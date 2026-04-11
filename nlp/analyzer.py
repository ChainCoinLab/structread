import json

import spacy
from openai import AsyncOpenAI

from models import AnalysisResponse, CoreParts, Span, Component, ProviderConfig

nlp = spacy.load("en_core_web_sm")

# Map spaCy dependency labels to our roles
DEP_TO_ROLE = {
    "nsubj": "subject",
    "nsubjpass": "subject",
    "ROOT": "verb",
    "dobj": "object",
    "pobj": "object",
    "attr": "object",
    "det": "determiner",
    "amod": "adjective",
    "advmod": "adverb",
    "prep": "prepositional_phrase",
    "relcl": "relative_clause",
    "advcl": "adverb_clause",
    "cc": "conjunction",
    "conj": "conjunction",
    "xcomp": "infinitive_phrase",
    "acomp": "adjective",
    "nummod": "adjective",
    "compound": "adjective",
    "poss": "determiner",
    "aux": "verb",
    "auxpass": "verb",
    "neg": "adverb",
}

CORE_ROLES = {"subject", "verb", "object"}

# Dependencies that should be merged into their head token
MERGE_INTO_HEAD = {"compound", "amod", "nummod", "poss", "det", "aux", "auxpass", "neg"}


def _get_subtree_span(token):
    """Get the character start/end for a token's full subtree."""
    subtree = sorted(token.subtree, key=lambda t: t.i)
    start = subtree[0].idx
    last = subtree[-1]
    end = last.idx + len(last.text)
    return start, end


def _get_role(token):
    """Map a spaCy token to our grammatical role."""
    return DEP_TO_ROLE.get(token.dep_, "modifier")


def _collect_left_modifiers(token, processed):
    """Collect compound, amod, nummod, det, poss children to the LEFT of token."""
    modifiers = []
    for child in token.children:
        if child.i < token.i and child.dep_ in MERGE_INTO_HEAD and child.i not in processed:
            # Recursively collect left modifiers of this child too
            modifiers.extend(_collect_left_modifiers(child, processed))
            modifiers.append(child)
    modifiers.sort(key=lambda t: t.i)
    return modifiers


def _collect_aux_verbs(token, processed):
    """Collect auxiliary verbs and negation for a verb token."""
    auxes = []
    for child in token.children:
        if child.dep_ in ("aux", "auxpass", "neg") and child.i not in processed:
            auxes.append(child)
    auxes.sort(key=lambda t: t.i)
    return auxes


def _make_span_from_tokens(sentence, tokens):
    """Create a text span from a list of tokens."""
    tokens = sorted(tokens, key=lambda t: t.i)
    start = tokens[0].idx
    last = tokens[-1]
    end = last.idx + len(last.text)
    text = sentence[start:end]
    return text, start, end


def _build_explanation(subject_text, verb_text, obj_text, modifiers):
    """Build a simple English explanation of the sentence structure."""
    parts = []
    if subject_text:
        parts.append("The subject is '%s'" % subject_text)
    if verb_text:
        parts.append("the main verb is '%s'" % verb_text)
    if obj_text:
        parts.append("the object is '%s'" % obj_text)

    explanation = ", ".join(parts) + "."

    if modifiers:
        mod_descs = []
        for m in modifiers[:3]:
            mod_descs.append("'%s' (%s, modifies %s)" % (m["text"], m["role"], m["modifies"]))
        explanation += " Modifiers: " + ", ".join(mod_descs) + "."

    return explanation


async def analyze(sentence: str, provider: ProviderConfig = None) -> AnalysisResponse:
    """Route to spaCy or LLM based on provider config."""
    if provider and provider.type == "llm" and provider.api_key:
        return await _analyze_llm(sentence, provider)
    return await _analyze_spacy(sentence)


# =========================================
# LLM-based analyzer
# =========================================

LLM_SYSTEM_PROMPT = """\
You are an English sentence structure analyzer. Given a sentence, return a JSON object.

## Output schema
{
  "core": {
    "subject": {"text": "...", "start": int, "end": int} or null,
    "verb": {"text": "...", "start": int, "end": int} or null,
    "object": {"text": "...", "start": int, "end": int} or null
  },
  "components": [
    {"text": "...", "role": "...", "category": "core|modifier", "start": int, "end": int, "modifies": "subject|verb|object|null"}
  ],
  "core_sentence": "subject + verb + object only.",
  "explanation": "1-2 sentences for non-native speakers."
}

## Rules
- Valid roles: subject, verb, object, determiner, adjective, adverb, prepositional_phrase, relative_clause, conjunction, infinitive_phrase, participle_phrase, compound
- category: "core" for subject/verb/object, "modifier" for others
- start/end: 0-based character offsets (Python slice: original[start:end] == text). Count carefully.
- Group compound nouns together (e.g. "Operating System" = one object).
- core_sentence: only subject + main verb + direct object, no modifiers.
- explanation: simple English for non-native speakers.
- Cover ALL words in components. No gaps.
"""


def _fix_offsets(original, data):
    """Validate and repair character offsets."""
    def fix_span(span):
        if span is None:
            return None
        text = span.get("text", "")
        start = span.get("start", 0)
        end = span.get("end", 0)
        if original[start:end] == text:
            return span
        idx = original.find(text)
        if idx != -1:
            span["start"] = idx
            span["end"] = idx + len(text)
        return span

    core = data.get("core", {})
    for key in ("subject", "verb", "object"):
        if core.get(key) is not None:
            core[key] = fix_span(core[key])

    for comp in data.get("components", []):
        text = comp.get("text", "")
        start = comp.get("start", 0)
        end = comp.get("end", 0)
        if original[start:end] != text:
            idx = original.find(text)
            if idx != -1:
                comp["start"] = idx
                comp["end"] = idx + len(text)
    return data


async def _analyze_llm(sentence: str, provider: ProviderConfig) -> AnalysisResponse:
    """Analyze using an LLM API (OpenAI-compatible)."""
    kwargs = {"api_key": provider.api_key}
    if provider.base_url:
        kwargs["base_url"] = provider.base_url

    client = AsyncOpenAI(**kwargs)
    model = provider.model or "gpt-4o-mini"

    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": LLM_SYSTEM_PROMPT},
            {"role": "user", "content": sentence},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)
    data["original"] = sentence
    data = _fix_offsets(sentence, data)

    core_data = data.get("core", {})
    core = CoreParts(
        subject=Span(**core_data["subject"]) if core_data.get("subject") else None,
        verb=Span(**core_data["verb"]) if core_data.get("verb") else None,
        object=Span(**core_data["object"]) if core_data.get("object") else None,
    )
    components = [Component(**c) for c in data.get("components", [])]

    return AnalysisResponse(
        original=sentence,
        core=core,
        components=components,
        core_sentence=data.get("core_sentence", ""),
        explanation=data.get("explanation", ""),
    )


# =========================================
# spaCy-based analyzer
# =========================================

async def _analyze_spacy(sentence: str) -> AnalysisResponse:
    """Analyze an English sentence using spaCy."""
    doc = nlp(sentence)

    components = []
    core_subject = None
    core_verb = None
    core_object = None

    # Find the root verb
    root = None
    for token in doc:
        if token.dep_ == "ROOT":
            root = token
            break
    if root is None:
        root = doc[0]

    processed = set()

    # Phase 1: Extract clause-level phrases (prep phrases, relative clauses, adverb clauses)
    # These get their full subtree grouped as one component
    phrase_deps = {"prep", "relcl", "advcl"}
    for token in doc:
        if token.dep_ in phrase_deps and token.i not in processed:
            start, end = _get_subtree_span(token)
            text = sentence[start:end]
            role = _get_role(token)

            head_role = _get_role(token.head)
            if head_role in CORE_ROLES:
                modifies = head_role
            else:
                modifies = token.head.text

            components.append(Component(
                text=text,
                role=role,
                category="modifier",
                start=start,
                end=end,
                modifies=modifies,
            ))
            for t in token.subtree:
                processed.add(t.i)

    # Phase 2: Group core nouns with their compounds/modifiers
    # For subject/object tokens, merge left-side compound & amod children into one phrase
    core_noun_deps = {"nsubj", "nsubjpass", "dobj", "attr", "pobj"}
    for token in doc:
        if token.i in processed:
            continue
        if token.dep_ not in core_noun_deps:
            continue

        # Collect the noun + its left modifiers (compounds, adjectives, determiners)
        left_mods = _collect_left_modifiers(token, processed)
        group_tokens = left_mods + [token]

        # Split into: determiners as separate weak modifier, rest as the noun phrase
        det_tokens = [t for t in group_tokens if t.dep_ in ("det", "poss")]
        noun_tokens = [t for t in group_tokens if t.dep_ not in ("det", "poss")]

        # Emit determiners as separate weak modifiers
        for dt in det_tokens:
            components.append(Component(
                text=dt.text,
                role="determiner",
                category="modifier",
                start=dt.idx,
                end=dt.idx + len(dt.text),
                modifies=_get_role(token),
            ))
            processed.add(dt.i)

        # Emit the noun phrase (including compounds) as the core element
        if noun_tokens:
            text, start, end = _make_span_from_tokens(sentence, noun_tokens)
            role = _get_role(token)  # subject or object

            components.append(Component(
                text=text,
                role=role,
                category="core",
                start=start,
                end=end,
                modifies=None,
            ))

            if role == "subject" and core_subject is None:
                core_subject = Span(text=text, start=start, end=end)
            elif role == "object" and core_object is None:
                core_object = Span(text=text, start=start, end=end)

            for t in noun_tokens:
                processed.add(t.i)

    # Phase 3: Group verb with its auxiliaries
    if root.i not in processed:
        aux_tokens = _collect_aux_verbs(root, processed)
        verb_tokens = aux_tokens + [root]
        text, start, end = _make_span_from_tokens(sentence, verb_tokens)

        components.append(Component(
            text=text,
            role="verb",
            category="core",
            start=start,
            end=end,
            modifies=None,
        ))
        core_verb = Span(text=text, start=start, end=end)

        for t in verb_tokens:
            processed.add(t.i)

    # Phase 4: Remaining tokens as individual modifiers
    for token in doc:
        if token.i in processed:
            continue
        if token.is_space or token.is_punct:
            continue

        role = _get_role(token)
        start = token.idx
        end = token.idx + len(token.text)

        if role in CORE_ROLES:
            category = "core"
            modifies = None
        else:
            category = "modifier"
            head_role = _get_role(token.head)
            if head_role in CORE_ROLES:
                modifies = head_role
            else:
                modifies = token.head.text

        components.append(Component(
            text=token.text,
            role=role,
            category=category,
            start=start,
            end=end,
            modifies=modifies,
        ))
        processed.add(token.i)

    # Sort by position
    components.sort(key=lambda c: c.start)

    # Build core sentence
    core_parts = []
    if core_subject:
        core_parts.append(core_subject.text)
    if core_verb:
        core_parts.append(core_verb.text)
    if core_object:
        core_parts.append(core_object.text)
    core_sentence = " ".join(core_parts) + "." if core_parts else sentence

    # Build explanation
    modifier_descs = [
        {"text": c.text, "role": c.role, "modifies": c.modifies or "sentence"}
        for c in components if c.category == "modifier"
    ]
    explanation = _build_explanation(
        core_subject.text if core_subject else None,
        core_verb.text if core_verb else None,
        core_object.text if core_object else None,
        modifier_descs,
    )

    return AnalysisResponse(
        original=sentence,
        core=CoreParts(subject=core_subject, verb=core_verb, object=core_object),
        components=components,
        core_sentence=core_sentence,
        explanation=explanation,
    )
