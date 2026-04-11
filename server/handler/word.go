package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type WordHandler struct {
	NLPServiceURL string
	Client        *http.Client
}

func NewWordHandler(nlpServiceURL string) *WordHandler {
	return &WordHandler{
		NLPServiceURL: nlpServiceURL,
		Client:        &http.Client{},
	}
}

type wordRequest struct {
	Word string `json:"word"`
}

func (h *WordHandler) Handle(w http.ResponseWriter, r *http.Request) {
	var req wordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	word := strings.TrimSpace(req.Word)
	if word == "" {
		writeError(w, http.StatusBadRequest, "word must be non-empty")
		return
	}
	if len(word) > 50 {
		writeError(w, http.StatusBadRequest, "word must be 50 characters or fewer")
		return
	}

	// Forward request to NLP service
	body, err := json.Marshal(wordRequest{Word: word})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to marshal request")
		return
	}

	nlpURL := fmt.Sprintf("%s/word", h.NLPServiceURL)
	resp, err := h.Client.Post(nlpURL, "application/json", bytes.NewReader(body))
	if err != nil {
		writeError(w, http.StatusBadGateway, "NLP service unavailable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		writeError(w, http.StatusBadGateway, fmt.Sprintf("NLP service returned status %d", resp.StatusCode))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
