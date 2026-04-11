package model

type ProviderConfig struct {
	Type    string `json:"type"`
	APIKey  string `json:"api_key,omitempty"`
	BaseURL string `json:"base_url,omitempty"`
	Model   string `json:"model,omitempty"`
}

type AnalysisRequest struct {
	Sentence string          `json:"sentence"`
	Provider *ProviderConfig `json:"provider,omitempty"`
}

type Span struct {
	Text  string `json:"text"`
	Start int    `json:"start"`
	End   int    `json:"end"`
}

type CoreParts struct {
	Subject *Span `json:"subject,omitempty"`
	Verb    *Span `json:"verb,omitempty"`
	Object  *Span `json:"object,omitempty"`
}

type Component struct {
	Text     string  `json:"text"`
	Role     string  `json:"role"`
	Category string  `json:"category"`
	Start    int     `json:"start"`
	End      int     `json:"end"`
	Modifies *string `json:"modifies"`
}

type AnalysisResponse struct {
	Original     string      `json:"original"`
	Core         CoreParts   `json:"core"`
	Components   []Component `json:"components"`
	CoreSentence string      `json:"core_sentence"`
	Explanation  string      `json:"explanation"`
}
