/**
 * InterviewAce – script.js
 * Features:
 * 1. Send messages via text or voice (Speech-to-Text)
 * 2. Text-to-Speech for AI replies (toggle)
 * 3. Difficulty level selector (Beginner/Intermediate/Expert)
 * 4. Resume upload — AI tailors questions to it
 * 5. Score Dashboard — tracks scores across the session, shown as a chart
 * 6. Typing indicator, auto-resize, sidebar toggle, session reset
 */

// ─────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────
const chatMessages   = document.getElementById("chatMessages");
const welcomeScreen  = document.getElementById("welcomeScreen");
const userInput      = document.getElementById("userInput");
const sendBtn        = document.getElementById("sendBtn");
const micBtn         = document.getElementById("micBtn");
const micStatus      = document.getElementById("micStatus");
const sidebar        = document.getElementById("sidebar");
const menuToggle     = document.getElementById("menuToggle");
const sidebarClose   = document.getElementById("sidebarClose");
const difficultyBadge = document.getElementById("difficultyBadge");
const resumeLabel    = document.getElementById("resumeLabel");
const clearResumeBtn = document.getElementById("clearResumeBtn");
const dashboardOverlay = document.getElementById("dashboardOverlay");
const dashboardBody  = document.getElementById("dashboardBody");

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let currentDifficulty = "Intermediate";
let ttsEnabled = false;
let dashboardChart = null;

// ─────────────────────────────────────────────
// SIDEBAR TOGGLE
// ─────────────────────────────────────────────
const overlay = document.createElement("div");
overlay.className = "sidebar-overlay";
document.body.appendChild(overlay);

function openSidebar()  { sidebar.classList.add("open");    overlay.classList.add("visible"); }
function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("visible"); }

menuToggle.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// ─────────────────────────────────────────────
// HIDE WELCOME SCREEN
// ─────────────────────────────────────────────
function hideWelcome() {
  if (welcomeScreen && welcomeScreen.style.display !== "none") {
    welcomeScreen.style.display = "none";
  }
}

// ─────────────────────────────────────────────
// DIFFICULTY SELECTOR
// ─────────────────────────────────────────────
function setDifficulty(level) {
  currentDifficulty = level;
  difficultyBadge.textContent = level;

  document.querySelectorAll(".diff-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.difficulty === level);
  });
}

// ─────────────────────────────────────────────
// APPEND MESSAGE TO CHAT
// ─────────────────────────────────────────────
function appendMessage(role, text) {
  hideWelcome();

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "avatar";
  avatarDiv.textContent = role === "user" ? "👤" : "⚡";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/✅|💬|💪|⭐|📝|💡|🎯|⚠️|📄|📊/g, match => `<span>${match}</span>`);

  bubbleDiv.innerHTML = formatted;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);
  chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;

  // ── Text-to-Speech for bot messages ──
  if (role === "bot" && ttsEnabled) {
    speakText(text);
  }
}

// ─────────────────────────────────────────────
// TYPING INDICATOR
// ─────────────────────────────────────────────
function showTyping() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.id = "typingIndicator";

  const avatarDiv = document.createElement("div");
  avatarDiv.className = "avatar";
  avatarDiv.textContent = "⚡";

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "typing-bubble";
  bubbleDiv.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;

  indicator.appendChild(avatarDiv);
  indicator.appendChild(bubbleDiv);
  chatMessages.appendChild(indicator);
  chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
}

function hideTyping() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  sendBtn.disabled = true;
  userInput.disabled = true;

  appendMessage("user", message);

  userInput.value = "";
  userInput.style.height = "auto";
  userInput.disabled = false;

  showTyping();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, difficulty: currentDifficulty })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    hideTyping();
    appendMessage("bot", data.response);

  } catch (err) {
    hideTyping();
    appendMessage("bot", `⚠️ Connection error: ${err.message}`);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

// ─────────────────────────────────────────────
// TEXT-TO-SPEECH (AI replies read aloud)
// ─────────────────────────────────────────────
function toggleTTS(enabled) {
  ttsEnabled = enabled;
  if (!enabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function speakText(text) {
  if (!window.speechSynthesis) return;

  // Strip markdown/emoji/formatting so TTS doesn't read symbols aloud
  const cleanText = text
    .replace(/\*\*/g, "")
    .replace(/[✅💬💪⭐📝💡🎯⚠️📄📊🔊🎙️]/g, "")
    .replace(/---.*?---/gs, "")
    .replace(/-{3,}/g, "")
    .trim();

  if (!cleanText) return;

  window.speechSynthesis.cancel(); // stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

// ─────────────────────────────────────────────
// RESUME UPLOAD
// ─────────────────────────────────────────────
async function uploadResume(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("resume", file);

  resumeLabel.textContent = "Uploading...";

  try {
    const res = await fetch("/upload_resume", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      resumeLabel.textContent = `✅ ${file.name}`;
      clearResumeBtn.style.display = "block";
      appendMessage("bot", `📄 ${data.message}`);
    } else {
      resumeLabel.textContent = "Upload resume (PDF/TXT)";
      appendMessage("bot", `⚠️ ${data.error}`);
    }
  } catch (err) {
    resumeLabel.textContent = "Upload resume (PDF/TXT)";
    appendMessage("bot", `⚠️ Upload failed: ${err.message}`);
  }

  event.target.value = ""; // allow re-uploading same file
}

async function clearResume() {
  try {
    await fetch("/clear_resume", { method: "POST" });
  } catch (e) {}

  resumeLabel.textContent = "Upload resume (PDF/TXT)";
  clearResumeBtn.style.display = "none";
}

// ─────────────────────────────────────────────
// SCORE DASHBOARD
// ─────────────────────────────────────────────
async function openDashboard() {
  closeSidebar();
  dashboardOverlay.classList.add("visible");

  dashboardBody.innerHTML = `<p class="dashboard-loading">Loading scores...</p>`;

  try {
    const res = await fetch("/scores");
    const data = await res.json();

    if (!data.count || data.count === 0) {
      dashboardBody.innerHTML = `
        <div class="dashboard-empty">
          <p>📭 No evaluated answers yet.</p>
          <p class="dashboard-empty-sub">Answer a few interview questions and your scores will appear here.</p>
        </div>
      `;
      return;
    }

    renderDashboard(data);

  } catch (err) {
    dashboardBody.innerHTML = `<p class="dashboard-loading">⚠️ Could not load scores: ${err.message}</p>`;
  }
}

function renderDashboard(data) {
  const { scores, averages, count } = data;

  dashboardBody.innerHTML = `
    <div class="dashboard-summary">
      <div class="score-card">
        <span class="score-card-label">Overall</span>
        <span class="score-card-value">${averages.overall ?? "-"}/10</span>
      </div>
      <div class="score-card">
        <span class="score-card-label">Technical</span>
        <span class="score-card-value">${averages.technical ?? "-"}/10</span>
      </div>
      <div class="score-card">
        <span class="score-card-label">Communication</span>
        <span class="score-card-value">${averages.communication ?? "-"}/10</span>
      </div>
      <div class="score-card">
        <span class="score-card-label">Confidence</span>
        <span class="score-card-value">${averages.confidence ?? "-"}/10</span>
      </div>
    </div>
    <p class="dashboard-count">${count} answer${count === 1 ? "" : "s"} evaluated this session</p>
    <div class="dashboard-chart-wrap">
      <canvas id="scoreChart"></canvas>
    </div>
  `;

  const labels = scores.map((_, i) => `Q${i + 1}`);

  const ctx = document.getElementById("scoreChart").getContext("2d");

  if (dashboardChart) {
    dashboardChart.destroy();
  }

  dashboardChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Overall",
          data: scores.map(s => s.overall),
          borderColor: "#0f9d80",
          backgroundColor: "rgba(15,157,128,0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Technical",
          data: scores.map(s => s.technical),
          borderColor: "#7c6bff",
          tension: 0.3,
        },
        {
          label: "Communication",
          data: scores.map(s => s.communication),
          borderColor: "#ff8c42",
          tension: 0.3,
        },
        {
          label: "Confidence",
          data: scores.map(s => s.confidence),
          borderColor: "#3b8bd4",
          tension: 0.3,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 0, max: 10, ticks: { stepSize: 2 } }
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } }
      }
    }
  });
}

function closeDashboard() {
  dashboardOverlay.classList.remove("visible");
}

function closeDashboardOnOverlay(event) {
  if (event.target === dashboardOverlay) closeDashboard();
}

// ─────────────────────────────────────────────
// SPEECH TO TEXT — Safari + Chrome compatible
// ─────────────────────────────────────────────

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition    = null;
let isRecording    = false;
let fullTranscript = "";
let silenceTimer   = null;
let restartFlag    = false;

const SILENCE_TIMEOUT = 2500;

if (!SpeechRecognition) {
  if (micBtn) micBtn.style.display = "none";
} else {
  setupRecognition();
}

function setupRecognition() {
  recognition = new SpeechRecognition();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.lang           = "en-US";
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interimText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result    = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        fullTranscript += transcript + " ";
      } else {
        interimText += transcript;
      }
    }

    userInput.value = (fullTranscript + interimText).trim();
    autoResize(userInput);
    resetSilenceTimer();
  };

  recognition.onend = () => {
    if (restartFlag && isRecording) {
      try { recognition.start(); } catch (e) {}
      return;
    }

    isRecording = false;
    restartFlag = false;
    setMicState(false);

    if (userInput.value.trim()) {
      showMicStatus("✅ Got it! Sending your answer…", "success");
      setTimeout(() => {
        sendMessage();
        hideMicStatus();
      }, 500);
    } else {
      showMicStatus("🔇 Nothing captured. Try again.", "warning");
      setTimeout(hideMicStatus, 3000);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === "no-speech" && isRecording) {
      try { recognition.start(); } catch (e) {}
      return;
    }

    if (event.error === "aborted") return;

    isRecording = false;
    restartFlag = false;
    setMicState(false);
    clearSilenceTimer();

    if (event.error === "not-allowed") {
      showMicStatus("❌ Microphone blocked. Go to Safari → Settings → Websites → Microphone → Allow", "error");
    } else {
      showMicStatus(`⚠️ Voice error: ${event.error}. Try again.`, "error");
      setTimeout(hideMicStatus, 4000);
    }
  };

  recognition.onstart = () => {
    showMicStatus("🎙️ Listening… speak at your natural pace. Click mic again to stop.", "listening");
  };
}

function resetSilenceTimer() {
  clearSilenceTimer();
  silenceTimer = setTimeout(() => {
    if (isRecording) stopRecording();
  }, SILENCE_TIMEOUT);
}

function clearSilenceTimer() {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
}

function startRecording() {
  fullTranscript = "";
  userInput.value = "";
  isRecording    = true;
  restartFlag    = true;

  // Pause any TTS playback while user is speaking
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  try {
    recognition.start();
    setMicState(true);
    silenceTimer = setTimeout(() => {
      if (isRecording) stopRecording();
    }, 8000);
  } catch (e) {
    isRecording = false;
    showMicStatus("⚠️ Could not start microphone. Try again.", "error");
    setTimeout(hideMicStatus, 3000);
  }
}

function stopRecording() {
  restartFlag = false;
  isRecording = false;
  clearSilenceTimer();
  try { recognition.stop(); } catch (e) {}
  setMicState(false);
}

function toggleMic() {
  if (!SpeechRecognition) {
    showMicStatus("❌ Voice not supported in this browser. Use Chrome for best experience.", "error");
    return;
  }

  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function setMicState(recording) {
  if (!micBtn) return;
  if (recording) {
    micBtn.classList.add("recording");
    micBtn.title = "Click to stop recording";
  } else {
    micBtn.classList.remove("recording");
    micBtn.title = "Speak your answer";
  }
}

function showMicStatus(message, type = "info") {
  if (!micStatus) return;
  micStatus.textContent = message;
  micStatus.className = `mic-status ${type}`;
  micStatus.style.display = "block";
}

function hideMicStatus() {
  if (!micStatus) return;
  micStatus.style.display = "none";
}

// ─────────────────────────────────────────────
// QUICK MESSAGE / RESET / KEYBOARD / RESIZE
// ─────────────────────────────────────────────
function sendQuickMessage(text) {
  userInput.value = text;
  closeSidebar();
  sendMessage();
}

async function resetChat() {
  try { await fetch("/reset", { method: "POST" }); } catch (e) {}

  chatMessages.innerHTML = "";
  welcomeScreen.style.display = "flex";
  userInput.value = "";
  closeSidebar();

  // Reset resume UI
  resumeLabel.textContent = "Upload resume (PDF/TXT)";
  clearResumeBtn.style.display = "none";

  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

window.addEventListener("load", () => userInput.focus());
