package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/fcihpy/english-chrome/server/model"
)

type AnalyzeHandler struct {
	NLPServiceURL string
	Client        *http.Client
}

func NewAnalyzeHandler(nlpServiceURL string) *AnalyzeHandler {
	return &AnalyzeHandler{
		NLPServiceURL: nlpServiceURL,
		Client:        &http.Client{},
	}
}

func (h *AnalyzeHandler) Handle(w http.ResponseWriter, r *http.Request) {
	var req model.AnalysisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	sentence := strings.TrimSpace(req.Sentence)
	if sentence == "" {
		writeError(w, http.StatusBadRequest, "sentence must be non-empty")
		return
	}
	if len(sentence) > 500 {
		writeError(w, http.StatusBadRequest, "sentence must be 500 characters or fewer")
		return
	}

	// Forward full request (including provider) to NLP service
	req.Sentence = sentence
	body, err := json.Marshal(req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to marshal request")
		return
	}

	nlpURL := fmt.Sprintf("%s/analyze", h.NLPServiceURL)
	resp, err := h.Client.Post(nlpURL, "application/json", bytes.NewReader(body))
	if err != nil {
		writeError(w, http.StatusBadGateway, "NLP service unavailable")
		return
	}
	defer resp.Body.Close()

	// Forward the response as-is (including errors with their detail)
	w.Header().Set("Content-Type", "application/json")
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		w.WriteHeader(resp.StatusCode)
	} else {
		w.WriteHeader(http.StatusBadGateway)
	}
	io.Copy(w, resp.Body)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
