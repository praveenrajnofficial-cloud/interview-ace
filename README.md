# ⚡ InterviewAce – AI Interview Preparation Chatbot

An AI-powered interview preparation and evaluation system built with **Flask**, **Gemini API**, and a modern dark-theme UI.

---

## Features

- 🤖 **Technical Interview Tracks** – Python, ML, SQL, Data Structures, Java
- 🤝 **HR Interview Mode** – Tell me about yourself, Strengths & Weaknesses, Career Goals
- 🎯 **Full Mock Interview** – 5 questions, one at a time, scored at the end
- 📊 **Evaluation Scoring** – Technical Knowledge / Communication / Confidence / Overall (out of 10)
- 💬 **Conversation Memory** – Full history maintained per session via Flask sessions
- 🔄 **Session Reset** – Start fresh anytime

---

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | HTML, CSS, JavaScript |
| Backend    | Python Flask          |
| AI Model   | Google Gemini 1.5 Flash |
| Deployment | Render.com            |

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/interview-ace.git
cd interview-ace
pip install -r requirements.txt
```

### 2. Add Your Gemini API Key

Open `app.py` and replace:
```python
GEMINI_API_KEY = "YOUR_API_KEY_HERE"
```

Or set it as an environment variable:
```bash
export GEMINI_API_KEY="your_key_here"
```

Get a free Gemini API key at: https://aistudio.google.com/

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
6. Add Environment Variable: `GEMINI_API_KEY = your_key`
7. Deploy!

---

## Project Structure

```
interview-ace/
├── app.py               ← Flask backend (routes, Gemini API, session management)
├── requirements.txt     ← Python dependencies
├── templates/
│   └── index.html       ← Main chat UI
├── static/
│   ├── style.css        ← Dark navy + teal design system
│   └── script.js        ← Chat logic, API calls, UI interactions
└── README.md
```

---

## Resume Description

> Developed **InterviewAce**, an AI-powered interview preparation and evaluation system using Flask, JavaScript, and Google Gemini API. The system conducts technical (Python, ML, SQL, DSA) and HR interview simulations, evaluates candidate responses with structured scoring across Technical Knowledge, Communication, and Confidence, maintains multi-turn conversation history via server-side sessions, and provides personalised improvement feedback. Deployed on Render with RESTful API architecture.
