
# ⚡ InterviewAce – AI Interview Preparation Chatbot

An AI-powered interview preparation and evaluation system built with **Flask**, **Groq API (LLaMA 3.3 70B)**, and a modern dark-theme UI.

---

## Features

- 🤖 **Technical Interview Tracks** – Python, ML, SQL, Data Structures, Java
- 🤝 **HR Interview Mode** – Tell me about yourself, Strengths & Weaknesses, Career Goals
- 🎯 **Full Mock Interview** – 5 questions, one at a time, scored at the end
- 📊 **Evaluation Scoring** – Technical Knowledge / Communication / Confidence / Overall (out of 10)
- 💬 **Conversation Memory** – Full history maintained per session via Flask sessions
- 🎙️ **Voice Input** – Speak your answers using built-in speech-to-text
- 🔄 **Session Reset** – Start fresh anytime

---

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | HTML, CSS, JavaScript |
| Backend    | Python Flask          |
| AI Model   | Groq API – LLaMA 3.3 70B |
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
├── app.py               ← Flask backend (routes, Groq API, session management)
├── requirements.txt     ← Python dependencies
├── templates/
│   └── index.html       ← Main chat UI
├── static/
│   ├── style.css        ← Dark navy + teal design system
│   └── script.js        ← Chat logic, voice input, API calls, UI interactions
└── README.md
```

---

## Resume Description

 Developed **InterviewAce**, an AI-powered interview preparation and evaluation system using Python Flask, Groq API (LLaMA 3.3 70B), and JavaScript. The system conducts technical (Python, ML, SQL, DSA, Java) and HR interview simulations, evaluates candidate responses with structured scoring across Technical Knowledge, Communication, and Confidence dimensions, supports voice input via Web Speech API, maintains multi-turn conversation history via server-side Flask sessions, and provides personalised improvement feedback. Deployed on Render with a gunicorn WSGI server.


