# ============================================================
# TRAINET - Local Plagiarism Detection
# ============================================================
# Compares two student answers using TF-IDF and cosine similarity.
# No API needed — runs entirely on your machine.
#
# Similarity rules:
#   < 30%  → Safe
#   30–70% → Warning
#   > 70%  → Plagiarism Detected
# ============================================================

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def check_plagiarism(answer1: str, answer2: str) -> dict:
    """
    Compares two student answers and returns a similarity score.

    Parameters:
        answer1 (str): First student's answer
        answer2 (str): Second student's answer (reference or another submission)

    Returns:
        dict with:
            - similarity_percent: float (0.0 to 100.0)
            - status: "Safe" | "Warning" | "Plagiarism Detected"
    """

    # TfidfVectorizer converts text into numeric vectors
    # It measures how important each word is across both answers
    vectorizer = TfidfVectorizer()

    # Fit and transform both answers at once
    tfidf_matrix = vectorizer.fit_transform([answer1, answer2])

    # cosine_similarity returns a value between 0 (no match) and 1 (identical)
    similarity_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]

    # Convert to percentage and round to 2 decimal places
    similarity_percent = round(similarity_score * 100, 2)

    # Determine the plagiarism status based on the percentage
    if similarity_percent < 30:
        status = "Safe"
    elif similarity_percent <= 70:
        status = "Warning"
    else:
        status = "Plagiarism Detected"

    return {
        "similarity_percent": similarity_percent,
        "status": status,
    }
