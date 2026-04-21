# ============================================================
# TRAINET - AI Assignment Grading using Groq API
# Model: llama-3.3-70b-versatile
# ============================================================

import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load GROQ_API_KEY from the .env file in this folder
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Create the Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def grade_assignment(question: str, answer: str) -> dict:
    """
    Sends the assignment question and student answer to Groq (llama-3.3-70b-versatile).
    Returns a dict with: score (0-100), feedback (str), missing_concepts (list).

    Grading scale:
        90-100 → Excellent answer
        60-89  → Partially correct answer
        35-59  → Weak answer
        0-34   → Wrong answer
    """

    prompt = f"""You are a strict academic assignment grader.

Question: {question}

Student Answer: {answer}

Evaluate the student's answer and return ONLY valid JSON in this exact format with no extra text:
{{
  "score": <integer between 0 and 100>,
  "feedback": "<one or two sentence evaluation of the answer>",
  "missing_concepts": ["<concept 1>", "<concept 2>"]
}}

Grading guide:
- 90 to 100: Excellent, complete and accurate answer
- 60 to 89: Partially correct, good but missing some details
- 35 to 59: Weak answer, major gaps in understanding
- 0 to 34: Wrong or completely off-topic answer

Rules:
- Return ONLY the JSON object, nothing else
- missing_concepts should list key topics the student did not cover
- If the answer is complete, missing_concepts can be an empty array []"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an academic grader. Always respond with valid JSON only. No markdown, no explanation, just the JSON object."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,   # low temperature for consistent grading
        max_tokens=512,
    )

    raw_text = response.choices[0].message.content.strip()

    # Strip markdown code fences if the model wraps the JSON
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`").strip()
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()

    result = json.loads(raw_text)
    return result


def get_grade_label(score: int) -> str:
    """Returns a human-readable label based on the score."""
    if score >= 90:
        return "Excellent answer"
    elif score >= 60:
        return "Partially correct answer"
    elif score >= 35:
        return "Weak answer"
    else:
        return "Wrong answer"
