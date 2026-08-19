const { app, BrowserWindow, globalShortcut, ipcMain, Menu } = require("electron");
const path = require("path");
const nodemailer = require("nodemailer");
const config = require("./config.js");

Menu.setApplicationMenu(null);

let mainWindow = null;
let unlocked = false; // true while admin has entered the password to exit/reset

// Shortcuts we try to intercept so students can't tab/quit their way out to use AI tools.
// Note: this is best-effort. A userland app cannot fully block OS-level shortcuts such as
// the Windows key or macOS Mission Control/Spotlight without deeper system hooks/permissions.
const BLOCKED_SHORTCUTS = [
  "CommandOrControl+Q",
  "CommandOrControl+W",
  "CommandOrControl+M",
  "CommandOrControl+H",
  "CommandOrControl+Alt+Escape",
  "CommandOrControl+Tab",
  "CommandOrControl+Shift+Tab",
  "Alt+Tab",
  "Alt+F4",
  "Alt+Space",
  "CommandOrControl+Space",
  "CommandOrControl+Shift+3",
  "CommandOrControl+Shift+4",
  "F11",
  "Escape",
];

function registerLockdown() {
  for (const accel of BLOCKED_SHORTCUTS) {
    try {
      globalShortcut.register(accel, () => {});
    } catch (_) {
      // some accelerators are invalid on some platforms; ignore
    }
  }
}

function unregisterLockdown() {
  // Unregister only the blocked shortcuts (not the always-on admin trigger).
  for (const accel of BLOCKED_SHORTCUTS) {
    try {
      globalShortcut.unregister(accel);
    } catch (_) {
      // ignore
    }
  }
}

// Set KIOSK_DEV=1 to run in a normal, closable window with no shortcut lockdown,
// for testing the flow on a developer machine without trapping the screen.
const DEV_MODE = process.env.KIOSK_DEV === "1";

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: !DEV_MODE,
    kiosk: !DEV_MODE,
    frame: DEV_MODE,
    autoHideMenuBar: true,
    resizable: DEV_MODE,
    closable: DEV_MODE,
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: DEV_MODE,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.webContents.on("devtools-opened", () => {
    if (!DEV_MODE) mainWindow.webContents.closeDevTools();
  });

  mainWindow.on("close", (e) => {
    if (!DEV_MODE && !unlocked) e.preventDefault();
  });

  if (DEV_MODE) return;

  registerLockdown();

  // Always-on admin trigger (not in BLOCKED_SHORTCUTS) so the teacher can open the
  // admin panel even while the kiosk lockdown is active.
  try {
    globalShortcut.register("CommandOrControl+Alt+Shift+L", () => {
      if (mainWindow) mainWindow.webContents.send("open-admin");
    });
  } catch (_) {
    // ignore if unavailable on this platform
  }
}

app.whenReady().then(() => {
  createWindow();
  app.focus({ steal: true });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});

// Prevent students from re-launching or spawning extra windows.
app.on("browser-window-created", (_e, win) => {
  if (win !== mainWindow) win.close();
});

ipcMain.handle("check-admin-password", (_e, attempt) => {
  const ok = typeof attempt === "string" && attempt === config.adminPassword;
  if (ok) {
    unlocked = true;
    unregisterLockdown();
  }
  return ok;
});

ipcMain.handle("relock", () => {
  unlocked = false;
  registerLockdown();
  return true;
});

ipcMain.handle("admin-quit", (_e, attempt) => {
  if (typeof attempt === "string" && attempt === config.adminPassword) {
    unlocked = true;
    unregisterLockdown();
    app.quit();
    return true;
  }
  return false;
});

ipcMain.handle("get-config", () => ({
  countdownSeconds: config.countdownSeconds,
  countdownText: config.countdownText,
  maxChars: config.maxChars,
}));

ipcMain.handle("send-answer", async (_e, { navn, klasse, svar }) => {
  navn = String(navn || "").trim().slice(0, 200);
  klasse = String(klasse || "").trim().slice(0, 100);
  svar = String(svar || "").trim().slice(0, config.maxChars);

  if (!navn || !klasse || !svar) {
    return { ok: false, error: "Navn, klasse og svar skal alle være udfyldt." };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.auth,
  });

  const fromAddr = `"${config.fromName}" <${config.smtp.auth.user}>`;
  const timestamp = new Date().toLocaleString("da-DK");

  const jobs = [];

  if (config.recipients.anonym && config.recipients.anonym.length) {
    jobs.push(
      transporter.sendMail({
        from: fromAddr,
        to: config.recipients.anonym.join(","),
        subject: `Svar fra klasse ${klasse}`,
        text: `Klasse: ${klasse}\nTidspunkt: ${timestamp}\n\nSvar:\n${svar}`,
      })
    );
  }

  if (config.recipients.full && config.recipients.full.length) {
    jobs.push(
      transporter.sendMail({
        from: fromAddr,
        to: config.recipients.full.join(","),
        subject: `Svar fra ${navn}, ${klasse}`,
        text: `Navn: ${navn}\nKlasse: ${klasse}\nTidspunkt: ${timestamp}\n\nSvar:\n${svar}`,
      })
    );
  }

  try {
    await Promise.all(jobs);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});
