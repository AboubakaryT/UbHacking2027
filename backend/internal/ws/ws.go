package ws

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Handler struct {
	mu      sync.RWMutex
	clients map[string]*Client
	onEvent func(projectID string, payload map[string]any)
}

type Client struct {
	ID        string
	ProjectID string
	Role      string
	Conn      *websocket.Conn
	Send      chan []byte
	LastSeen  time.Time
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewHandler(onEvent func(projectID string, payload map[string]any)) *Handler {
	return &Handler{clients: map[string]*Client{}, onEvent: onEvent}
}

func (h *Handler) ServeAgent(w http.ResponseWriter, r *http.Request) {
	h.serve(w, r, "agent")
}

func (h *Handler) ServeClient(w http.ResponseWriter, r *http.Request) {
	h.serve(w, r, "client")
}

func (h *Handler) serve(w http.ResponseWriter, r *http.Request, role string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade failed:", err)
		return
	}
	client := &Client{
		ID:       fmt.Sprintf("ws-%d", time.Now().UnixNano()),
		Role:     role,
		Conn:     conn,
		Send:     make(chan []byte, 64),
		LastSeen: time.Now(),
	}
	h.mu.Lock()
	h.clients[client.ID] = client
	h.mu.Unlock()
	go h.writePump(client)
	go h.readPump(client)
}

func (h *Handler) readPump(client *Client) {
	defer func() {
		h.mu.Lock()
		delete(h.clients, client.ID)
		h.mu.Unlock()
		client.Conn.Close()
	}()
	for {
		_, msg, err := client.Conn.ReadMessage()
		if err != nil {
			return
		}
		var envelope map[string]any
		if err := json.Unmarshal(msg, &envelope); err != nil {
			continue
		}
		if projectID, ok := envelope["projectId"].(string); ok {
			client.ProjectID = projectID
			if h.onEvent != nil {
				h.onEvent(projectID, envelope)
			}
		}
		client.LastSeen = time.Now()
	}
}

func (h *Handler) writePump(client *Client) {
	defer client.Conn.Close()
	for msg := range client.Send {
		if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			return
		}
	}
}

func (h *Handler) Broadcast(projectID string, payload any) {
	msg, err := json.Marshal(payload)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
		if client.ProjectID == projectID {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
}

func (h *Handler) BroadcastToRole(projectID, role string, payload any) {
	msg, err := json.Marshal(payload)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, client := range h.clients {
		if client.ProjectID == projectID && client.Role == role {
			select {
			case client.Send <- msg:
			default:
			}
		}
	}
}
