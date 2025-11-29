const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("text");
let history = [];

function append(role, text){
  const el = document.createElement("div");
  el.className = role;
  el.textContent = `${role === "user" ? "You" : "AI"}: ${text}`;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  append("user", text);
  history.push({ role: "user", text });
  input.value = "";
  append("assistant", "…thinking…");

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history })
    });
    const json = await resp.json();
    // remove the last "thinking…" element
    messagesEl.lastElementChild.remove();
    const reply = json.reply || (json.error ? `Error: ${json.error}` : "No reply");
    append("assistant", reply);
    history.push({ role: "assistant", text: reply });
  } catch (err) {
    console.error(err);
    messagesEl.lastElementChild.remove();
    append("assistant", "Request failed");
  }
});