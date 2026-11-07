package main

import (
	"log"
	"net/http"
	"os"

	"codeanalysis-platform/internal/config"
	"codeanalysis-platform/internal/server"
)

func main() {
	cfg := config.Load()
	srv := server.NewServer(cfg)
	mux := http.NewServeMux()
	srv.RegisterRoutes(mux)

	log.Printf("starting analysis server on %s", cfg.Addr)
	if err := http.ListenAndServe(cfg.Addr, mux); err != nil {
		log.Fatalf("server failed: %v", err)
	}
	_ = os.Getenv
}
