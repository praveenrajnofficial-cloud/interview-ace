# ⚡ InterviewAce – AI Interview Preparation Chatbot

An AI-powered interview preparation and evaluation system built with **Flask**, **Groq API (LLaMA 3.3 70B)**, and a modern light-theme UI.

---

## Features

- 🤖 **Technical Interview Tracks** – Python, ML, SQL, Data Structures, Java
- 🤝 **HR Interview Mode** – Tell me about yourself, Strengths & Weaknesses, Career Goals
- 🎯 **Full Mock Interview** – 5 questions, one at a time, scored at the end
- 📊 **Evaluation Scoring** – Technical Knowledge / Communication / Confidence / Overall (out of 10)
- 💬 **Conversation Memory** – Full history maintained per session via Flask sessions
- 🎙️ **Voice Input** – Speak your answers using built-in speech-to-text (works on Chrome & Safari)
- 🔊 **Voice Output (Text-to-Speech)** – AI questions and feedback can be read aloud, toggleable
- 🎚️ **Difficulty Levels** – Beginner / Intermediate / Expert — adjusts question depth and complexity
- 📄 **Resume-Based Questions** – Upload your resume (PDF/TXT) and get questions tailored to your actual projects and skills
- 📈 **Score Dashboard** – Tracks all evaluated answers in a session with a live chart (Chart.js) showing Overall, Technical, Communication, and Confidence trends
- 🛡️ **Offline Fallback Question Bank** – If the Groq API is unavailable, the app serves questions from a built-in question bank (Python, ML, SQL, DSA, Java, HR) so it never fully breaks
- 🔄 **Session Reset** – Start fresh anytime, clears history, scores, and uploaded resume

---

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | HTML, CSS, JavaScript, Chart.js |
| Backend    | Python Flask          |
| AI Model   | Groq API – LLaMA 3.3 70B |
| Resume Parsing | pypdf |
| Voice      | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Deployment | Render.com            |

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/praveenrajofficial-cloud/interview-ace.git
cd interview-ace
pip install -r requirements.txt
```

### 2. Add Your Groq API Key

Get a free Groq API key at: https://console.groq.com/keys

Set it as an environment variable:

```bash
export GROQ_API_KEY="your_key_here"
```

### 3. Run Locally

```bash
python app.py
```

Open your browser at: `http://localhost:5000`

---

## How to Deploy on Render

1. Push this project to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set Build Command: `pip install -r requirements.txt`
5. Set Start Command: `gunicorn app:app`
6. Add Environment Variable: `GROQ_API_KEY = your_key`
7. Deploy!

---

## Project Structure

```
interview-ace/
├── app.py               ← Flask backend (routes, Groq API, sessions,
│                            resume parsing, score tracking, fallback bank)
├── requirements.txt     ← Python dependencies (flask, groq, gunicorn, pypdf)
├── templates/
│   └── index.html       ← Main chat UI + sidebar controls + dashboard modal
├── static/
│   ├── style.css        ← Light theme design system
│   └── script.js        ← Chat logic, voice I/O, dashboard chart, resume upload
└── README.md
```

---

## How the New Features Work

**Difficulty Levels**
Sidebar buttons (Beginner/Intermediate/Expert) send the selected level with every message. The system prompt instructs the AI to calibrate question depth accordingly. Current level is shown in the top bar.

**Resume Upload**
Upload a PDF or TXT resume via the sidebar. Text is extracted server-side using `pypdf` and injected into the AI's system prompt (truncated to 3000 characters). The AI then references your actual projects, skills, and experience when asking questions. Use "📄 Resume-Based Question" to trigger a tailored question explicitly.

**Score Dashboard**
Every AI evaluation response is scanned with regex to extract Technical/Communication/Confidence/Overall scores out of 10. These are stored in the session and visualized as a line chart (Chart.js) showing trends across all answered questions, plus running averages.

**Text-to-Speech**
Toggle "🔊 Read AI replies aloud" in the sidebar. Uses the browser's built-in `SpeechSynthesisUtterance` to read AI responses aloud (emojis and markdown formatting are stripped before speaking).

**Offline Fallback Question Bank**
If the Groq API call fails (network issue, quota exceeded, invalid key), the backend catches the exception and returns a random question from a built-in bank of 48 questions across 6 categories, so the app degrades gracefully instead of erroring out.

---

## Resume Description

Developed InterviewAce, an AI-powered interview preparation system using Python Flask, Groq API (LLaMA 3.3 70B), and JavaScript. Conducts technical (Python, ML, SQL, DSA, Java) and HR mock interviews with adjustable difficulty, structured scoring (Technical, Communication, Confidence), and a live performance dashboard (Chart.js). Features resume-based question personalization, voice input/output via Web Speech API, and session-based conversation memory. Deployed on Render with gunicorn.

