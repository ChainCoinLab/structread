.PHONY: dev server-run server-build server-test nlp-run nlp-install extension-release clean

# Run both services (use two terminals, or run each target separately)
dev:
	@echo "Run in separate terminals:"
	@echo "  make nlp-run"
	@echo "  make server-run"

# Go API Gateway
server-run:
	cd server && go run .

server-build:
	cd server && go build -o ../bin/server .

server-test:
	cd server && go test ./...

# Python NLP Service
nlp-install:
	cd nlp && pip install -r requirements.txt

nlp-run:
	cd nlp && uvicorn main:app --port 8081 --reload

extension-release:
	@if [ -z "$(ESA_API_ORIGIN)" ]; then echo "ESA_API_ORIGIN is required, for example: make extension-release ESA_API_ORIGIN=https://api.example.com"; exit 1; fi
	python3 scripts/build_extension_release.py --api-origin "$(ESA_API_ORIGIN)"
