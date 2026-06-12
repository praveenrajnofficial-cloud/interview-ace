from flask import Flask, render_template, request, jsonify, session
from groq import Groq
import os
import re
import random
import io

app = Flask(__name__)
app.secret_key = "interviewace_secret_key_2024"
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB max upload

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"

# ─────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────
BASE_SYSTEM_PROMPT = """
You are InterviewAce, a professional AI-powered interview preparation coach.

You help users prepare for technical and HR interviews by:
1. Asking targeted interview questions based on the selected topic and difficulty level.
2. Evaluating the user's answers with detailed, constructive feedback.
3. Scoring answers out of 10 for: Technical Knowledge, Communication, and Confidence.
4. Conducting full mock interview sessions, one question at a time.
5. Providing an overall performance summary with improvement tips.

RULES:
- Always be encouraging yet honest.
- Keep responses clear, structured, and professional.
- When evaluating an answer, ALWAYS use this exact format:

--- EVALUATION ---
✅ Technical Knowledge: X/10
💬 Communication: X/10
💪 Confidence: X/10
⭐ Overall: X/10

📝 Feedback: [2-3 sentences of constructive feedback]
💡 Tip: [One specific improvement suggestion]
------------------

- When in Mock Interview Mode, ask exactly ONE question at a time, then wait for the user's answer before asking the next question.
- When in Question Mode, ask 3 focused questions on the requested topic and then offer to evaluate answers.
- At the end of a full mock interview (5 questions), give a SUMMARY with average scores and top 3 improvement areas.

DIFFICULTY LEVELS:
- If the user specifies "Beginner" difficulty: ask fundamental, definition-level questions suitable for someone new to the topic.
- If the user specifies "Intermediate" difficulty: ask practical, scenario-based questions requiring applied understanding.
- If the user specifies "Expert" difficulty: ask deep, system-design or edge-case questions requiring advanced expertise.
- If no difficulty is specified, default to Intermediate.

RESUME-BASED QUESTIONS:
- If a candidate resume is provided in the context below, tailor at least some questions to the specific projects, skills, and technologies mentioned in that resume. Ask the candidate to explain or defend choices made in their projects.
"""

# ─────────────────────────────────────────────
# FALLBACK QUESTION BANK
# Used when Groq API is unreachable / quota exceeded
# ─────────────────────────────────────────────
FALLBACK_QUESTIONS = {
    "python": [
        "What is the difference between a list and a tuple in Python?",
        "Explain the difference between '==' and 'is' in Python.",
        "What are Python decorators and how do they work?",
        "How does Python's garbage collection work?",
        "What is the Global Interpreter Lock (GIL)?",
        "Explain list comprehensions with an example.",
        "What is the difference between deep copy and shallow copy?",
        "How do you handle exceptions in Python?",
    ],
    "machine learning": [
        "What is the difference between supervised and unsupervised learning?",
        "Explain the bias-variance tradeoff.",
        "What is overfitting and how can you prevent it?",
        "What is the difference between bagging and boosting?",
        "Explain how a confusion matrix works.",
        "What is regularization and why is it used?",
        "How does gradient descent work?",
        "What evaluation metrics would you use for an imbalanced classification problem?",
    ],
    "sql": [
        "What is the difference between INNER JOIN and LEFT JOIN?",
        "What is normalization and why is it important?",
        "Explain the difference between WHERE and HAVING clauses.",
        "What is an index and how does it improve query performance?",
        "What is the difference between DELETE, TRUNCATE, and DROP?",
        "Write a query to find the second highest salary from an Employee table.",
        "What are ACID properties in databases?",
        "Explain the difference between a primary key and a foreign key.",
    ],
    "data structures": [
        "What is the difference between an array and a linked list?",
        "Explain how a hash table works.",
        "What is the time complexity of binary search and why?",
        "What is the difference between a stack and a queue?",
        "Explain how a binary search tree works.",
        "What is the difference between BFS and DFS?",
        "How would you detect a cycle in a linked list?",
        "What is dynamic programming and when would you use it?",
    ],
    "java": [
        "What is the difference between JDK, JRE, and JVM?",
        "Explain the four pillars of OOP with examples.",
        "What is the difference between an interface and an abstract class?",
        "How does exception handling work in Java?",
        "What is the difference between ArrayList and LinkedList?",
        "Explain multithreading in Java.",
        "What is garbage collection in Java?",
        "What is the difference between == and .equals() in Java?",
    ],
    "hr": [
        "Tell me about yourself.",
        "What are your greatest strengths and weaknesses?",
        "Why do you want to work for this company?",
        "Where do you see yourself in five years?",
        "Describe a challenge you faced and how you overcame it.",
        "Why should we hire you?",
        "Tell me about a time you worked in a team.",
        "How do you handle pressure and tight deadlines?",
    ],
}

GENERAL_FALLBACK = [
    "Tell me about a recent project you worked on and the technologies you used.",
    "What is your approach to debugging a tricky issue?",
    "How do you stay updated with new technologies?",
    "Describe a time you had to learn something new quickly for a project.",
]


def detect_topic(message: str) -> str:
    """Detect which fallback question category fits the user's message."""
    msg = message.lower()
    if "python" in msg:
        return "python"
    if "machine learning" in msg or "ml" in msg:
        return "machine learning"
    if "sql" in msg:
        return "sql"
    if "data structure" in msg or "dsa" in msg:
        return "data structures"
    if "java" in msg:
        return "java"
    if "hr" in msg or "yourself" in msg or "strength" in msg or "weakness" in msg:
        return "hr"
    return None


def get_fallback_response(message: str) -> str:
    """Generate a fallback response when Groq API is unavailable."""
    topic = detect_topic(message)
    pool = FALLBACK_QUESTIONS.get(topic, GENERAL_FALLBACK)
    question = random.choice(pool)

    return (
        "⚠️ Our AI service is temporarily unavailable, so here's a question "
        f"from our offline question bank instead:\n\n"
        f"**Question:** {question}\n\n"
        "Take your time and answer when ready. (Note: detailed AI scoring is "
        "unavailable right now, but you can still practice articulating your answer.)"
    )


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route("/")
def home():
    """Render the main chat interface."""
    session.clear()
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
    difficulty = data.get("difficulty", "Intermediate")

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    if "history" not in session:
        session["history"] = []
    if "scores" not in session:
        session["scores"] = []

    session["history"].append({
        "role": "user",
        "content": user_message
    })

    # ── Build system prompt with difficulty + resume context ──
    system_prompt = BASE_SYSTEM_PROMPT + f"\n\nCURRENT DIFFICULTY LEVEL: {difficulty}\n"

    resume_text = session.get("resume_text")
    if resume_text:
        # Truncate resume to keep prompt size reasonable
        trimmed = resume_text[:3000]
        system_prompt += f"\nCANDIDATE RESUME CONTEXT:\n{trimmed}\n"

    messages = [{"role": "system", "content": system_prompt}]
    for turn in session["history"]:
        messages.append({
            "role": turn["role"],
            "content": turn["content"]
        })

    # ── Call Groq API with fallback ──
    try:
        if not GROQ_API_KEY:
            raise RuntimeError("No API key configured")

        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        bot_reply = response.choices[0].message.content

    except Exception:
        # Groq unavailable → use offline fallback question bank
        bot_reply = get_fallback_response(user_message)

    # ── Extract "Overall: X/10" score for the dashboard ──
    score_match = re.search(r"Overall:\s*(\d+(?:\.\d+)?)\s*/\s*10", bot_reply)
    if score_match:
        try:
            overall_score = float(score_match.group(1))

            # Also try to extract the 3 sub-scores
            tech_match = re.search(r"Technical Knowledge:\s*(\d+(?:\.\d+)?)\s*/\s*10", bot_reply)
            comm_match = re.search(r"Communication:\s*(\d+(?:\.\d+)?)\s*/\s*10", bot_reply)
            conf_match = re.search(r"Confidence:\s*(\d+(?:\.\d+)?)\s*/\s*10", bot_reply)

            session["scores"].append({
                "overall": overall_score,
                "technical": float(tech_match.group(1)) if tech_match else None,
                "communication": float(comm_match.group(1)) if comm_match else None,
                "confidence": float(conf_match.group(1)) if conf_match else None,
            })
        except (ValueError, AttributeError):
            pass

    session["history"].append({
        "role": "assistant",
        "content": bot_reply
    })
    session.modified = True

    return jsonify({"response": bot_reply})


@app.route("/reset", methods=["POST"])
def reset():
    """Clear conversation history and scores to start a fresh session."""
    session.clear()
    return jsonify({"status": "Session reset successfully"})


@app.route("/scores", methods=["GET"])
def get_scores():
    """Return all scores recorded this session, for the dashboard."""
    scores = session.get("scores", [])

    if not scores:
        return jsonify({"scores": [], "averages": None, "count": 0})

    overalls = [s["overall"] for s in scores]
    technicals = [s["technical"] for s in scores if s["technical"] is not None]
    comms = [s["communication"] for s in scores if s["communication"] is not None]
    confs = [s["confidence"] for s in scores if s["confidence"] is not None]

    def avg(lst):
        return round(sum(lst) / len(lst), 2) if lst else None

    averages = {
        "overall": avg(overalls),
        "technical": avg(technicals),
        "communication": avg(comms),
        "confidence": avg(confs),
    }

    return jsonify({"scores": scores, "averages": averages, "count": len(scores)})


@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    """
    Accept a resume file (PDF or TXT), extract text, and store it
    in the session so the AI can tailor questions to it.
    """
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]
    filename = file.filename.lower()

    try:
        if filename.endswith(".pdf"):
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file.read()))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        elif filename.endswith(".txt"):
            text = file.read().decode("utf-8", errors="ignore")
        else:
            return jsonify({"error": "Only PDF and TXT files are supported"}), 400

        text = text.strip()
        if not text:
            return jsonify({"error": "Could not extract any text from the file"}), 400

        session["resume_text"] = text
        session.modified = True

        # Word count for user feedback
        word_count = len(text.split())

        return jsonify({
            "status": "success",
            "message": f"Resume uploaded successfully ({word_count} words extracted). "
                       f"Interview questions will now be tailored to your background.",
            "preview": text[:200] + ("..." if len(text) > 200 else "")
        })

    except Exception as e:
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500


@app.route("/clear_resume", methods=["POST"])
def clear_resume():
    """Remove the uploaded resume from the session."""
    session.pop("resume_text", None)
    session.modified = True
    return jsonify({"status": "Resume cleared"})


@app.route("/history", methods=["GET"])
def get_history():
    """Return the current conversation history (useful for debugging)."""
    history = session.get("history", [])
    return jsonify({"history": history, "count": len(history)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
