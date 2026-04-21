"""
Runner script for plagiarism check.
Reads JSON from stdin: {"answer1": "...", "answer2": "..."}
Prints JSON result to stdout: {"similarity_percent": 12.5, "status": "Safe"}
"""
import sys
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
os.chdir(script_dir)

try:
    payload = json.loads(sys.stdin.read())
    answer1 = payload.get("answer1", "")
    answer2 = payload.get("answer2", "")

    from plagiarism import check_plagiarism
    result = check_plagiarism(answer1, answer2)
    print(json.dumps(result))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"error": str(e), "similarity_percent": 0, "status": "Safe"}))
    sys.exit(1)
