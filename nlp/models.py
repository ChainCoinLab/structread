from typing import List, Optional

from pydantic import BaseModel


class ProviderConfig(BaseModel):
    type: str = "nlp"  # "nlp" or "llm"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None


class AnalysisRequest(BaseModel):
    sentence: str
    provider: Optional[ProviderConfig] = None


class Span(BaseModel):
    text: str
    start: int
    end: int


class CoreParts(BaseModel):
    subject: Optional[Span] = None
    verb: Optional[Span] = None
    object: Optional[Span] = None


class Component(BaseModel):
    text: str
    role: str
    category: str
    start: int
    end: int
    modifies: Optional[str] = None


class AnalysisResponse(BaseModel):
    original: str
    core: CoreParts
    components: List[Component]
    core_sentence: str
    explanation: str


class WordRequest(BaseModel):
    word: str


class WordDefinition(BaseModel):
    part_of_speech: str
    meaning: str


class WordResponse(BaseModel):
    word: str
    phonetic: Optional[str] = None
    audio: Optional[str] = None
    definitions: List[WordDefinition] = []
