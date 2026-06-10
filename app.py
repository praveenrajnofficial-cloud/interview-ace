from flask import Flask, render_template, request, jsonify, session
from groq import Groq
import os
 
app = Flask(__name__)
app.secret_key = "interviewace_secret_key_2024"
 
# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"
 
# ─────────────────────────────────────────────
# SYSTEM PROMPT
# ─────────────────────────────────────────────
SYSTEM_PROMPT = """
You are InterviewAce, a professional AI-powered interview preparation coach.
 
You help users prepare for technical and HR interviews by:
1. Asking targeted interview questions based on the selected topic.
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
"""
 
# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────
 
@app.route("/")
def home():
    session.clear()
    return render_template("index.html")
 
 
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_message = data.get("message", "").strip()
 
    if not user_message:
        return jsonify({"error": "Empty message"}), 400
 
    if "history" not in session:
        session["history"] = []
 
    session["history"].append({
        "role": "user",
        "content": user_message
    })
 
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in session["history"]:
        messages.append({
            "role": turn["role"],
            "content": turn["content"]
        })
 
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        bot_reply = response.choices[0].message.content
 
    except Exception as e:
        bot_reply = f"⚠️ Sorry, I encountered an error: {str(e)}. Please check your API key and try again."
 
    session["history"].append({
        "role": "assistant",
        "content": bot_reply
    })
    session.modified = True
 
    return jsonify({"response": bot_reply})
 
 
@app.route("/reset", methods=["POST"])
def reset():
    session.clear()
    return jsonify({"status": "Session reset successfully"})
 
 
@app.route("/history", methods=["GET"])
def get_history():
    history = session.get("history", [])
    return jsonify({"history": history, "count": len(history)})
 
 
if __name__ == "__main__":
    app.run(debug=True, port=5000)
 

 
