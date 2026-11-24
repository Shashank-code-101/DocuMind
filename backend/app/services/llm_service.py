"""
LLM Service (Google Gemini + Local Extractive Synthesis Engine)
Communicates with Google Gemini models using the official Google GenAI SDK.
When a Gemini API key is not configured, provides an intelligent, structured
extractive synthesis across all retrieved chunks with clear headings, bullet points,
and exact document page references.
"""
from typing import List, Dict, Any, Optional
import os
import re

from app.core.config import settings

DOCUMIND_SYSTEM_PROMPT = """You are DocuMind, an elite AI document intelligence assistant.

Answer questions using ONLY the factual information contained in the retrieved document context below.

Strict Factual Grounding:
1. Use the supplied context as your primary and only factual source.
2. Do not invent facts, speculate, or introduce unsupported external information.
3. If the required information is not available in the context, clearly state:
   "I cannot find sufficient supporting information in the uploaded documents to answer your question."
4. If multiple documents or passages contain relevant information, synthesize them clearly across sources.
5. If the sources contradict one another, explicitly point out the contradiction rather than silently choosing one.
6. Do not claim that information exists in a document unless the retrieved context directly supports it.

Adaptive Markdown Formatting & Readability Guidelines:
Structure your response intelligently to maximize visual clarity, hierarchy, and reading comprehension. Do NOT force every response into a rigid template—adapt naturally to the content:

- Headings & Subheadings: Use clear markdown headings (`###`, `####`) to separate distinct topics, sections, modules, or themes.
- Bullet Points: Use bullets (`-`) for lists of attributes, features, components, advantages, and itemized specifications.
- Numbered Lists: Use numbered lists (`1.`, `2.`, `3.`) strictly for sequential steps, procedural instructions, chronological workflows, or numbered assignment questions.
- Bold Emphasis: Use **bold** intentionally for important terms, keywords, parameter names, question weights/marks, and key takeaways.
- Tables: Use Markdown tables (`| Col 1 | Col 2 |`) whenever comparing multiple items, summarizing technical specifications, or presenting structured tabular data.
- Paragraphs: Use well-spaced paragraphs for conceptual explanations, background narratives, and synthesis.
- Academic Assignments & Exams: Display the assignment title as a clear heading, group questions into numbered lists with subheadings per section, and highlight marks/instructions in **bold**.
- Explanatory Deep Dives: Divide complex explanations into logical subsections with descriptive headers, followed by clean paragraphs and bolded core concepts.
- Short Answers: For simple or brief questions, provide a clean, direct answer without superfluous headings.
"""


def format_context_for_prompt(chunks: List[Dict[str, Any]]) -> str:
    """Formats retrieved chunks with document name, page number, and text."""
    if not chunks:
        return "No relevant document passages were found."

    formatted_passages = []
    for idx, c in enumerate(chunks, 1):
        doc_name = c.get("document_name", "Unknown Document")
        page_num = c.get("page_number", "Unknown")
        text = c.get("text", "").strip()
        passage = f"[Passage {idx} | Document: {doc_name} | Page: {page_num}]\n{text}"
        formatted_passages.append(passage)

    return "\n\n---\n\n".join(formatted_passages)


def synthesize_local_extractive_answer(question: str, chunks: List[Dict[str, Any]]) -> str:
    """
    Intelligent local extractive synthesizer for when no LLM API key is present.
    Analyzes all retrieved chunks, ranks relevant sentences, and formats a clean,
    structured markdown answer with executive summary, key findings, and page citations.
    """
    if not chunks:
        return (
            "I cannot find sufficient supporting information in your uploaded documents "
            "to answer this question. Please ensure relevant documents have been uploaded to this workspace."
        )

    # 1. Normalize and extract query keywords
    stop_words = {
        "what", "is", "are", "the", "a", "an", "of", "in", "to", "for", "with", "on", "at",
        "by", "from", "and", "or", "how", "why", "when", "where", "which", "who", "whom",
        "this", "that", "these", "those", "can", "could", "would", "should", "do", "does",
        "did", "about", "tell", "me", "summarize", "explain", "give", "key", "findings",
        "takeaways", "documents", "document", "please", "overview"
    }
    query_words = [
        w.lower() for w in re.findall(r"\b[A-Za-z0-9_]{3,}\b", question)
        if w.lower() not in stop_words
    ]

    # 2. Extract and score sentences across all retrieved chunks
    scored_sentences = []
    seen_texts = set()

    for chunk in chunks:
        doc_name = chunk.get("document_name", "Document")
        page_num = chunk.get("page_number", 1)
        raw_text = chunk.get("text", "").strip()

        # Split into sentences using punctuation boundaries
        sentences = re.split(r"(?<=[.!?])\s+", raw_text)
        for s in sentences:
            cleaned = s.strip()
            # Skip empty or very short lines / headers
            if len(cleaned) < 25 or cleaned in seen_texts:
                continue
            seen_texts.add(cleaned)

            s_lower = cleaned.lower()
            # Calculate match score
            score = 0
            for qw in query_words:
                if qw in s_lower:
                    score += 2

            # Boost sentences with informative verbs / indicators
            if any(term in s_lower for term in [
                "is defined", "means", "refers to", "consists of", "results show", "conclude",
                "important", "objective", "primary", "feature", "method", "algorithm",
                "process", "advantage", "classified", "divided into", "difference", "significant"
            ]):
                score += 1.5

            # Base score from chunk similarity
            chunk_score = chunk.get("score", 0.0)
            score += chunk_score

            scored_sentences.append({
                "text": cleaned,
                "doc_name": doc_name,
                "page": page_num,
                "score": score,
            })

    # Sort sentences by relevance
    scored_sentences.sort(key=lambda x: x["score"], reverse=True)

    # 3. Assemble structured answer
    is_summary_query = any(w in question.lower() for w in [
        "finding", "findings", "takeaway", "takeaways", "summar", "overview", "conclusion",
        "what is", "explain", "main", "core", "topic"
    ])

    lines = []

    # Lead summary / direct answer
    top_sentences = scored_sentences[:6]
    if not top_sentences:
        # Fallback to chunk texts if sentences were short
        top_sentences = [{
            "text": chunks[0]["text"][:250].strip() + "...",
            "doc_name": chunks[0].get("document_name", "Document"),
            "page": chunks[0].get("page_number", 1),
            "score": 1.0,
        }]

    # Lead synthesis sentence
    lead_sentence = top_sentences[0]["text"]
    lines.append(f"Based on the documents in this workspace, here is the supporting information regarding **\"{question}\"**:")
    lines.append("")

    if not is_summary_query and len(top_sentences) > 0:
        lines.append(f"**Direct Answer:**\n{lead_sentence} *(Source: {top_sentences[0]['doc_name']}, p. {top_sentences[0]['page']})*")
        lines.append("")

    # Structured Key Points
    lines.append("### Key Findings & Insights:")
    used_pages = set()
    bullet_count = 0

    for item in top_sentences:
        if bullet_count >= 5:
            break
        text = item["text"]
        # Ensure sentence ends with period
        if not text.endswith((".", "!", "?")):
            text += "."
        lines.append(f"- **{text}** — *[{item['doc_name']}, p. {item['page']}]*")
        used_pages.add(f"{item['doc_name']} (p. {item['page']})")
        bullet_count += 1

    lines.append("")
    lines.append(f"*Extracted from: {', '.join(sorted(used_pages))}*")
    lines.append("")
    lines.append("> 💡 **Note on AI Synthesis**: This response was generated using DocuMind's local semantic search & extraction engine. For conversational multi-paragraph generative answers, add your `GEMINI_API_KEY` in `backend/.env`.")

    return "\n".join(lines)


class LLMService:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self._custom_api_key = api_key
        self._custom_model_name = model_name
        self._genai_client = None

    @property
    def api_key(self) -> str:
        if self._custom_api_key is not None:
            return self._custom_api_key
        return settings.GEMINI_API_KEY

    @property
    def model_name(self) -> str:
        if self._custom_model_name is not None:
            return self._custom_model_name
        return settings.GEMINI_MODEL

    def _ensure_client(self):
        """Initializes or returns the Gemini client using the latest settings."""
        if self._genai_client is not None:
            return self._genai_client

        key = self.api_key
        if key and not key.startswith("your-gemini"):
            try:
                from google import genai
                self._genai_client = genai.Client(api_key=key)
            except Exception:
                try:
                    import google.generativeai as legacy_genai
                    legacy_genai.configure(api_key=key)
                    self._genai_client = "legacy"
                except Exception:
                    self._genai_client = None
        return self._genai_client

    def is_configured(self) -> bool:
        """Checks if a valid Gemini API key is configured."""
        key = self.api_key
        return bool(key and not key.startswith("your-gemini"))

    def generate_grounded_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Generates a grounded answer from retrieved document chunks.
        If no chunks are provided, returns standard insufficient-info message.
        If Gemini API key is absent, uses the smart local extractive synthesis engine with clear mode tag.
        If Gemini API key is present, uses Gemini LLM for conversational grounded synthesis.
        On Gemini API error, falls back to local extractive engine with a prominent error banner.
        """
        if not retrieved_chunks:
            return (
                "I cannot find sufficient supporting information in your uploaded documents "
                "to answer this question. Please ensure relevant documents have been uploaded to this workspace."
            )

        client = self._ensure_client()
        if not self.is_configured() or client is None:
            local_ans = synthesize_local_extractive_answer(question, retrieved_chunks)
            return (
                "> ℹ️ **Mode: Local Semantic Search** (Gemini API key is not configured in `backend/.env`).\n"
                "> *The response below was synthesized directly from matching passages in your uploaded documents:*\n\n"
                f"{local_ans}"
            )

        context_text = format_context_for_prompt(retrieved_chunks)
        user_prompt = f"""RETRIEVED DOCUMENT CONTEXT:
{context_text}

USER QUESTION:
{question}

Provide a direct, factual answer based exclusively on the context above."""

        try:
            # Modern google-genai client
            if hasattr(client, "models"):
                from google.genai import types
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=DOCUMIND_SYSTEM_PROMPT,
                        temperature=0.2,
                        max_output_tokens=2500,
                    ),
                )
                if response and response.text:
                    return response.text.strip()
                raise ValueError("Gemini returned an empty response.")
            else:
                # Legacy SDK fallback
                import google.generativeai as legacy_genai
                model = legacy_genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=DOCUMIND_SYSTEM_PROMPT,
                )
                response = model.generate_content(
                    user_prompt,
                    generation_config=legacy_genai.GenerationConfig(
                        temperature=0.2,
                        max_output_tokens=2500,
                    ),
                )
                if response and response.text:
                    return response.text.strip()
                raise ValueError("Legacy Gemini returned an empty response.")

        except Exception as e:
            # Prominently indicate that Gemini failed, display the accurate error message,
            # and provide local extractive synthesis as graceful fallback
            err_msg = str(e)
            local_ans = synthesize_local_extractive_answer(question, retrieved_chunks)
            return (
                f"> ⚠️ **Gemini Generative AI Unavailable** (`{err_msg}`)\n"
                "> *Displaying local semantic search findings from document chunks instead:*\n\n"
                f"{local_ans}"
            )


# Singleton instance
llm_service = LLMService()
