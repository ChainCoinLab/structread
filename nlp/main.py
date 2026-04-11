import os

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import AnalysisRequest, AnalysisResponse, WordRequest, WordResponse, WordDefinition
from analyzer import analyze

app = FastAPI(title="English Sentence Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_sentence(request: AnalysisRequest):
    sentence = request.sentence.strip()
    if not sentence:
        raise HTTPException(status_code=400, detail="Sentence cannot be empty")
    try:
        result = await analyze(sentence, provider=request.provider)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/word", response_model=WordResponse)
async def lookup_word(request: WordRequest):
    word = request.word.strip()
    if not word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
                timeout=10.0,
            )
        if resp.status_code == 404:
            return WordResponse(word=word)

        resp.raise_for_status()
        data = resp.json()
        entry = data[0]

        phonetic = entry.get("phonetic")
        audio = None
        for p in entry.get("phonetics", []):
            if not phonetic and p.get("text"):
                phonetic = p["text"]
            if not audio and p.get("audio"):
                audio = p["audio"]

        definitions = []
        for meaning in entry.get("meanings", []):
            pos = meaning.get("partOfSpeech", "")
            for defn in meaning.get("definitions", []):
                definitions.append(
                    WordDefinition(
                        part_of_speech=pos,
                        meaning=defn.get("definition", ""),
                    )
                )

        return WordResponse(
            word=entry.get("word", word),
            phonetic=phonetic,
            audio=audio,
            definitions=definitions,
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Dictionary API error: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Word lookup failed: {str(e)}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
