package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/fcihpy/english-chrome/server/config"
	"github.com/fcihpy/english-chrome/server/handler"
	"github.com/fcihpy/english-chrome/server/middleware"
)

func main() {
	cfg := config.Load()

	analyzeHandler := handler.NewAnalyzeHandler(cfg.NLPServiceURL)
	wordHandler := handler.NewWordHandler(cfg.NLPServiceURL)

	mux := http.NewServeMux()

	mux.HandleFunc("POST /api/v1/analyze", analyzeHandler.Handle)
	mux.HandleFunc("POST /api/v1/word", wordHandler.Handle)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	wrapped := middleware.CORS(mux)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("API gateway starting on %s (NLP service: %s)", addr, cfg.NLPServiceURL)
	if err := http.ListenAndServe(addr, wrapped); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
