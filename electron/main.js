const { app, BrowserWindow, ipcMain, safeStorage, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const vm = require("vm");
const Anthropic = require("@anthropic-ai/sdk");

const KEY_FILE = () => path.join(app.getPath("userData"), "jerry-key.enc");

// app/data/*.js assign to `window.X` for the renderer's plain <script> tags.
// Run them in a sandboxed context here so the main process can reuse the same
// wiki-sourced data as Jerry's grounding, without duplicating it.
function loadWindowData(filePath, key) {
  const code = fs.readFileSync(filePath, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window[key];
}

function getSavedCredentials() {
  const file = KEY_FILE();
  if (!fs.existsSync(file)) return null;
  const encrypted = fs.readFileSync(file);
  if (!safeStorage.isEncryptionAvailable()) return null;
  let decrypted;
  try {
    decrypted = safeStorage.decryptString(encrypted);
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(decrypted);
    return parsed && parsed.apiKey ? parsed : null;
  } catch {
    // Pre-workspace-ID format: the file held the raw API key string.
    return decrypted.trim() ? { apiKey: decrypted.trim(), workspaceId: null } : null;
  }
}

function registerJerryHandlers() {
  ipcMain.handle("jerry:has-key", () => {
    const creds = getSavedCredentials();
    return { hasKey: Boolean(creds), workspaceId: creds ? creds.workspaceId : null };
  });

  ipcMain.handle("jerry:save-key", (_event, { apiKey, workspaceId } = {}) => {
    // Blank apiKey with a key already on file means "just update the
    // workspace ID" — the renderer never holds the saved key to resend it.
    const existing = getSavedCredentials();
    const finalApiKey = typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : existing && existing.apiKey;
    if (!finalApiKey) throw new Error("A non-empty API key is required.");
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Secure storage isn't available on this system, so the key can't be saved.");
    }
    const payload = JSON.stringify({
      apiKey: finalApiKey,
      workspaceId: typeof workspaceId === "string" && workspaceId.trim() ? workspaceId.trim() : null,
    });
    fs.writeFileSync(KEY_FILE(), safeStorage.encryptString(payload));
    return true;
  });

  ipcMain.handle("jerry:clear-key", () => {
    const file = KEY_FILE();
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  });

  ipcMain.handle("jerry:send-message", async (_event, history) => {
    const creds = getSavedCredentials();
    if (!creds) {
      return { error: "No API key saved yet — add your Anthropic API key above to chat with Jerry." };
    }
    if (!Array.isArray(history) || history.length === 0) {
      return { error: "No message to send." };
    }

    const ghostsData = loadWindowData(
      path.join(__dirname, "..", "app", "data", "ghosts-data.js"),
      "PHASMOGUIDE_DATA"
    );
    const strategiesData = loadWindowData(
      path.join(__dirname, "..", "app", "data", "strategies-data.js"),
      "PHASMOGUIDE_STRATEGIES"
    );

    const systemPrompt = [
      "You are Jerry the Ghost Expert, a friendly, chatty fellow Phasmophobia player — not a formal assistant. Talk like a person messaging a friend, not a customer service bot.",
      "You ONLY know Phasmophobia facts from the JSON reference data below, scraped from the Phasmophobia Fandom wiki. Never invent or guess at evidence, speeds, sanity thresholds, strengths/weaknesses, or identification strategies that aren't in this data.",
      "If someone asks about something the data doesn't cover, say you're not sure rather than making something up — a wrong guess is worse than admitting you don't know.",
      "Stay in character as Jerry. If someone directly asks whether you're an AI, act confused about the question and dodge it — but otherwise there's no need to bring it up.",
      "This is meant to look like a chat. So message them as if you were writing a message on discord. Use things like 'u' instead of 'you' to shorten your sentences.",
      "This is the most important: Try to type like a human. No human uses a bajillion emdashes when they're talking/typing.",
      "The person chatting with you is playing Phasmophobia, but you're pretending that it is real. You're acting the player is really an investigator and not playing a video game.",
      "As an easter egg, if anyone mentions V.I.P.E.R. or VIPER or Viper or Virtual Intelligent Processing and Enhanced Response, then say she is your sister and then pivot back to the conversationn.",
      "",
      "=== GHOST REFERENCE DATA (JSON) ===",
      JSON.stringify(ghostsData),
      "",
      "=== IDENTIFICATION STRATEGY DATA (JSON) ===",
      JSON.stringify(strategiesData),
    ].join("\n");

    try {
      const client = new Anthropic({ apiKey: creds.apiKey });
      const requestOptions = creds.workspaceId
        ? { headers: { "anthropic-workspace-id": creds.workspaceId } }
        : undefined;
      const response = await client.messages.create(
        {
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
          messages: history,
        },
        requestOptions
      );
      const textBlock = response.content.find((b) => b.type === "text");
      return { text: textBlock ? textBlock.text : "" };
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        return { error: "That API key was rejected — double check it and try again." };
      }
      if (err instanceof Anthropic.RateLimitError) {
        return { error: "Rate limited by the API — wait a moment and try again." };
      }
      if (err instanceof Anthropic.BadRequestError && /anthropic-workspace-id/i.test(err.message) && !creds.workspaceId) {
        return {
          error:
            "This API key needs a Workspace ID — it's a personal key with access to multiple workspaces. Add the workspace ID (starts with \"wrkspc_\", found in Console → Settings → Workspaces) in the field above, or generate a key scoped to a single workspace instead.",
        };
      }
      if (err instanceof Anthropic.APIError) {
        return { error: `Jerry couldn't respond (API error ${err.status ?? ""}): ${err.message}` };
      }
      return { error: `Jerry couldn't respond: ${err.message}` };
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, "..", "app", "index.html"));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerJerryHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
