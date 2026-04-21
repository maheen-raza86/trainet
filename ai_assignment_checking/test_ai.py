# ============================================================
# TRAINET - AI Assignment Checker Test Script
# ============================================================
# Run this file to test both:
#   1. Gemini grading (score, feedback, missing concepts)
#   2. Local plagiarism detection (similarity %)
#
# Usage:
#   python test_ai.py
# ============================================================

from groq_grading import grade_assignment, get_grade_label
from plagiarism import check_plagiarism

# ── Step 1: Get input from the user ─────────────────────────
print("=" * 55)
print("  TRAINET AI Assignment Checker")
print("=" * 55)

question = input("\nEnter the assignment question:\n> ").strip()

print("\nEnter the student's answer (press Enter twice when done):")
lines = []
while True:
    line = input()
    if line == "":
        break
    lines.append(line)
student_answer = " ".join(lines).strip()

if not question or not student_answer:
    print("Question or answer cannot be empty. Please try again.")
    exit()

# ── Step 2: Grade the answer using Gemini ───────────────────
print("\nSending to Gemini for grading...")

try:
    result = grade_assignment(question, student_answer)

    score            = result.get("score", 0)
    feedback         = result.get("feedback", "No feedback provided.")
    missing_concepts = result.get("missing_concepts", [])
    label            = get_grade_label(score)

    print("\n" + "=" * 55)
    print("  GRADING RESULT")
    print("=" * 55)
    print(f"  Score            : {score} / 100")
    print(f"  Grade            : {label}")
    print(f"  Feedback         : {feedback}")
    if missing_concepts:
        print(f"  Missing Concepts : {', '.join(missing_concepts)}")
    else:
        print("  Missing Concepts : None")

except Exception as e:
    print(f"\n[ERROR] Groq grading failed: {e}")
    print("Make sure your GROQ_API_KEY is set correctly in the .env file.")

# ── Step 3: Run plagiarism check against a sample answer ────
print("\n" + "=" * 55)
print("  PLAGIARISM CHECK")
print("=" * 55)

# This is a sample reference answer to compare against
sample_reference = (
    "Containerization allows applications to run in isolated environments "
    "called containers. Docker is a popular tool for this. It packages the "
    "application and all its dependencies together so it runs consistently "
    "on any machine."
)

print(f"  Comparing against sample reference answer...")

plagiarism_result = check_plagiarism(student_answer, sample_reference)

print(f"  Similarity       : {plagiarism_result['similarity_percent']}%")
print(f"  Status           : {plagiarism_result['status']}")
print("=" * 55)
