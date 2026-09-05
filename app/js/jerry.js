// Jerry tab: a chat UI in front of Claude, grounded only in the wiki-sourced
// ghost/strategy JSON data (see electron/main.js — the actual API call and
// key storage live in the main process, never in this renderer script).
window.PhasmoJerry = (function () {
  // Conversation history sent to the API each turn: [{ role, content }, ...].
  // The opening greeting is UI flavor only and isn't part of this.
  let history = [];
  let sending = false;

  let messagesEl, formEl, inputEl;
  let keyInputEl, workspaceInputEl, keySaveBtn, keyClearBtn, keyStatusEl;
  let keyIsSaved = false;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function appendBubble(author, text, extraClass) {
    const bubble = document.createElement("div");
    bubble.className = `jerry-message jerry-message-${author === "Jerry" ? "bot" : "user"}${
      extraClass ? ` ${extraClass}` : ""
    }`;
    bubble.innerHTML = `<span class="jerry-message-author">${escapeHtml(author)}</span><p>${escapeHtml(
      text
    )}</p>`;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function setSending(isSending) {
    sending = isSending;
    inputEl.disabled = isSending;
    formEl.querySelector("button").disabled = isSending;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text || sending) return;

    inputEl.value = "";
    appendBubble("You", text);
    history.push({ role: "user", content: text });

    setSending(true);
    const typingBubble = appendBubble("Jerry", "…", "jerry-message-typing");

    let result;
    try {
      result = await window.jerryAPI.sendMessage(history);
    } catch (err) {
      result = { error: err.message || "Something went wrong talking to Jerry." };
    }

    typingBubble.remove();
    setSending(false);

    if (result.error) {
      appendBubble("Jerry", result.error, "jerry-message-error");
      history.pop(); // don't keep an unanswered user turn in the sent history
      return;
    }

    appendBubble("Jerry", result.text);
    history.push({ role: "assistant", content: result.text });
  }

  async function refreshKeyStatus() {
    const { hasKey, workspaceId } = await window.jerryAPI.hasApiKey();
    keyIsSaved = hasKey;
    keyStatusEl.textContent = hasKey ? "✓ Key saved" : "No key saved yet";
    keyClearBtn.hidden = !hasKey;
    keyInputEl.placeholder = hasKey ? "•••••••••••••• (saved — enter a new key to replace)" : "sk-ant-...";
    // The workspace ID isn't secret, so it's safe to echo back and pre-fill —
    // unlike the API key, which the main process never sends to the renderer.
    if (document.activeElement !== workspaceInputEl) {
      workspaceInputEl.value = workspaceId || "";
    }
  }

  async function handleSaveKey() {
    const apiKey = keyInputEl.value.trim();
    const workspaceId = workspaceInputEl.value.trim();
    // A blank API key is fine as long as one's already saved — that just
    // means "update the workspace ID," handled by the main process.
    if (!apiKey && !keyIsSaved) return;
    keySaveBtn.disabled = true;
    try {
      await window.jerryAPI.saveApiKey({ apiKey, workspaceId });
      keyInputEl.value = "";
      await refreshKeyStatus();
    } catch (err) {
      keyStatusEl.textContent = `Couldn't save key: ${err.message}`;
    } finally {
      keySaveBtn.disabled = false;
    }
  }

  async function handleClearKey() {
    await window.jerryAPI.clearApiKey();
    await refreshKeyStatus();
  }

  function init() {
    messagesEl = document.getElementById("jerry-messages");
    formEl = document.getElementById("jerry-form");
    inputEl = document.getElementById("jerry-input");
    keyInputEl = document.getElementById("jerry-api-key");
    workspaceInputEl = document.getElementById("jerry-workspace-id");
    keySaveBtn = document.getElementById("jerry-key-save");
    keyClearBtn = document.getElementById("jerry-key-clear");
    keyStatusEl = document.getElementById("jerry-key-status");

    if (!window.jerryAPI) {
      appendBubble(
        "Jerry",
        "Can't connect to Jerry — try restarting PhasmoGuide.",
        "jerry-message-error"
      );
      return;
    }

    appendBubble("Jerry", "hey there! im Jerry the ghost expert. let me know if u need help with anything");

    refreshKeyStatus();
    keySaveBtn.addEventListener("click", handleSaveKey);
    keyClearBtn.addEventListener("click", handleClearKey);
    formEl.addEventListener("submit", handleSubmit);
  }

  return { init };
})();
