"""
Runner script for Groq grading.
Reads JSON from stdin:  {"question": "...", "answer": "..."}
Prints JSON to stdout:  {"score": 80, "feedback": "...", "missing_concepts": [...]}
"""
import sys
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
os.chdir(script_dir)

try:
    payload = json.loads(sys.stdin.read())
    question = payload.get("question", "")
    answer   = payload.get("answer", "")

    from groq_grading import grade_assignment
    result = grade_assignment(question, answer)
    print(json.dumps(result))
    sys.exit(0)
except Exception as e:
    print(json.dumps({
        "error": str(e),
        "score": None,
        "feedback": str(e),
        "missing_concepts": []
    }))
    sys.exit(1)
