/**
 * InterviewAce – script.js
 * Features:
 * 1. Send messages via text or voice
 * 2. Speech-to-Text using Web Speech API (built into browser, no extra packages)
 * 3. Typing indicator, auto-resize textarea
 * 4. Sidebar toggle, session reset
 */

// ─────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────
const chatMessages  = document.getElementById("chatMessages");
const welcomeScreen = document.getElementById("welcomeScreen");
const userInput     = document.getElementById("userInput");
const sendBtn       = document.getElementById("sendBtn");
const micBtn        = document.getElementById("micBtn");
const micStatus     = document.getElementById("micStatus");
const sidebar       = document.getElementById("sidebar");
const menuToggle    = document.getElementById("menuToggle");
const sidebarClose  = document.getElementById("sidebarClose");

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
    .replace(/✅|💬|💪|⭐|📝|💡|🎯|⚠️/g, match => `<span>${match}</span>`);

  bubbleDiv.innerHTML = formatted;

  messageDiv.appendChild(avatarDiv);
  messageDiv.appendChild(bubbleDiv);
  chatMessages.appendChild(messageDiv);

  chatMessages.parentElement.scrollTop = chatMessages.parentElement.scrollHeight;
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
      body: JSON.stringify({ message })
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const data = await res.json();
    hideTyping();
    appendMessage("bot", data.response);

  } catch (err) {
    hideTyping();
    appendMessage("bot", `⚠️ Connection error: ${err.message}\n\nPlease make sure the Flask server is running.`);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

// ─────────────────────────────────────────────
// SPEECH TO TEXT — Web Speech API
// ─────────────────────────────────────────────

let recognition = null;
let isRecording = false;

// Check if browser supports speech recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  // Hide mic button if browser doesn't support it (rare)
  if (micBtn) {
    micBtn.style.display = "none";
  }
} else {
  // Set up recognition object
  recognition = new SpeechRecognition();
  recognition.continuous = false;       // Stop after one answer
  recognition.interimResults = true;    // Show live partial transcript while speaking
  recognition.lang = "en-US";

  // ── While the user is speaking: show live transcript in textarea ──
  recognition.onresult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Show live text in the textarea as user speaks
    userInput.value = finalTranscript || interimTranscript;
    autoResize(userInput);
  };

  // ── When recording stops: finalize and auto-send ──
  recognition.onend = () => {
    isRecording = false;
    setMicState(false);

    // If there's text captured, send it automatically
    if (userInput.value.trim()) {
      // Small delay so user can see what was captured before it sends
      setTimeout(() => sendMessage(), 600);
    }
  };

  // ── Handle errors ──
  recognition.onerror = (event) => {
    isRecording = false;
    setMicState(false);

    if (event.error === "not-allowed") {
      showMicStatus("❌ Microphone access denied. Please allow mic in browser settings.", "error");
    } else if (event.error === "no-speech") {
      showMicStatus("🔇 No speech detected. Try again.", "warning");
    } else {
      showMicStatus(`⚠️ Error: ${event.error}`, "error");
    }
  };
}

// ── Toggle recording on mic button click ──
function toggleMic() {
  if (!SpeechRecognition) {
    showMicStatus("❌ Your browser doesn't support voice input. Try Chrome.", "error");
    return;
  }

  if (isRecording) {
    // Stop recording
    recognition.stop();
    isRecording = false;
    setMicState(false);
  } else {
    // Start recording
    userInput.value = "";
    recognition.start();
    isRecording = true;
    setMicState(true);
    showMicStatus("🎙️ Listening… speak your answer now", "listening");
  }
}

// ── Update mic button appearance ──
function setMicState(recording) {
  if (!micBtn) return;
  if (recording) {
    micBtn.classList.add("recording");
    micBtn.title = "Stop recording";
  } else {
    micBtn.classList.remove("recording");
    micBtn.title = "Speak your answer";
    // Clear status after 3 seconds
    setTimeout(() => hideMicStatus(), 3000);
  }
}

// ── Show/hide status text below input ──
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
// QUICK MESSAGE (sidebar buttons)
// ─────────────────────────────────────────────
function sendQuickMessage(text) {
  userInput.value = text;
  closeSidebar();
  sendMessage();
}

// ─────────────────────────────────────────────
// RESET CHAT SESSION
// ─────────────────────────────────────────────
async function resetChat() {
  try {
    await fetch("/reset", { method: "POST" });
  } catch (e) {}

  chatMessages.innerHTML = "";
  welcomeScreen.style.display = "flex";
  userInput.value = "";
  closeSidebar();
}

// ─────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ─────────────────────────────────────────────
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ─────────────────────────────────────────────
// AUTO-RESIZE TEXTAREA
// ─────────────────────────────────────────────
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

window.addEventListener("load", () => userInput.focus());
