package config

import (
	"os"
	"strings"
)

type Config struct {
	Addr              string
	ProjectToken      string
	AllowedOrigins    []string
	AIAPIKey          string
	AIBaseURL         string
	MaxFileSize       int
	AllowedExtensions []string
	IgnoreDirs        map[string]bool
}

func Load() Config {
	cfg := Config{
		Addr:           getEnv("PORT", ":8080"),
		ProjectToken:   getEnv("PROJECT_TOKEN", "demo-token"),
		AIAPIKey:       getEnv("AI_API_KEY", ""),
		AIBaseURL:      getEnv("AI_BASE_URL", "https://api.openai.com/v1"),
		MaxFileSize:    1024 * 1024,
		AllowedOrigins: strings.FieldsFunc(getEnv("ALLOWED_ORIGINS", "*"), func(r rune) bool { return r == ',' }),
		AllowedExtensions: []string{".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yaml", ".yml"},
		IgnoreDirs: map[string]bool{
			".git":      true,
			"node_modules": true,
			"dist":      true,
			"build":     true,
			".next":     true,
		},
	}
	if cfg.MaxFileSize <= 0 {
		cfg.MaxFileSize = 1024 * 1024
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
