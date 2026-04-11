package config

import "os"

type Config struct {
	Port          string
	NLPServiceURL string
}

func Load() *Config {
	return &Config{
		Port:          getEnv("PORT", "8080"),
		NLPServiceURL: getEnv("NLP_SERVICE_URL", "http://127.0.0.1:8081"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
