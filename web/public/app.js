(function () {
  const screens = {
    start: document.getElementById("screen-start"),
    form: document.getElementById("screen-form"),
    countdown: document.getElementById("screen-countdown"),
    answer: document.getElementById("screen-answer"),
    sending: document.getElementById("screen-sending"),
    done: document.getElementById("screen-done"),
    error: document.getElementById("screen-error"),
    ended: document.getElementById("screen-ended"),
  };

  function showScreen(name) {
    for (const key in screens) {
      screens[key].classList.toggle("active", key === name);
    }
  }

  const btnStart = document.getElementById("btn-start");
  const navnInput = document.getElementById("navn");
  const klasseInput = document.getElementById("klasse");
  const btnToCountdown = document.getElementById("btn-to-countdown");
  const countdownTextEl = document.getElementById("countdown-text");
  const countdownNumberEl = document.getElementById("countdown-number");
  const btnToAnswer = document.getElementById("btn-to-answer");
  const svarInput = document.getElementById("svar");
  const charCounter = document.getElementById("char-counter");
  const btnSend = document.getElementById("btn-send");
  const errorMessage = document.getElementById("error-message");
  const btnRetry = document.getElementById("btn-retry");

  let maxChars = 2000;
  let countdownSeconds = 10;
  let countdownText = "";
  let countdownTimer = null;

  fetch("/api/config")
    .then((r) => r.json())
    .then((cfg) => {
      maxChars = cfg.maxChars;
      countdownSeconds = cfg.countdownSeconds;
      countdownText = cfg.countdownText;
      svarInput.maxLength = maxChars;
      updateCharCounter();
    });

  function updateNextEnabled() {
    btnToCountdown.disabled = !(navnInput.value.trim() && klasseInput.value.trim());
  }
  navnInput.addEventListener("input", updateNextEnabled);
  klasseInput.addEventListener("input", updateNextEnabled);

  btnToCountdown.addEventListener("click", () => {
    showScreen("countdown");
    startCountdown();
  });

  function startCountdown() {
    let remaining = countdownSeconds;
    countdownTextEl.textContent = countdownText;
    countdownNumberEl.textContent = String(remaining);
    btnToAnswer.disabled = true;

    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      countdownNumberEl.textContent = String(Math.max(remaining, 0));
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        btnToAnswer.disabled = false;
      }
    }, 1000);
  }

  btnToAnswer.addEventListener("click", () => {
    svarInput.value = "";
    updateCharCounter();
    showScreen("answer");
    svarInput.focus();
  });

  function updateCharCounter() {
    charCounter.textContent = `${svarInput.value.length} / ${maxChars}`;
  }
  svarInput.addEventListener("input", updateCharCounter);

  btnSend.addEventListener("click", async () => {
    const svar = svarInput.value.trim();
    if (!svar) return;
    showScreen("sending");
    try {
      const res = await fetch("/api/send-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          navn: navnInput.value.trim(),
          klasse: klasseInput.value.trim(),
          svar,
        }),
      });
      const result = await res.json();
      if (result.ok) {
        showScreen("done");
      } else {
        errorMessage.textContent = result.error || "Ukendt fejl. Prøv igen.";
        showScreen("error");
      }
    } catch (err) {
      errorMessage.textContent = "Kunne ikke sende svaret. Tjek internetforbindelsen og prøv igen.";
      showScreen("error");
    }
  });

  btnRetry.addEventListener("click", () => {
    showScreen("answer");
  });

  // --- Fuldskærm / kiosk-lås ---
  // En webside kan kun bede om fuldskærm som reaktion på en bruger-interaktion
  // (klik/tastetryk) - derfor kræver det et eksplicit "Start"-tryk, i modsætning
  // til Electron-versionen der selv kan gå i fuldskærm ved opstart.
  const resumeOverlay = document.getElementById("resume-overlay");
  const resumeBox = document.getElementById("resume-box");
  let kioskActive = false;

  function requestFullscreen() {
    const el = document.documentElement;
    const req =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.msRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }

  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  }

  btnStart.addEventListener("click", () => {
    requestFullscreen();
    kioskActive = true;
    showScreen("form");
  });

  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  function onFullscreenChange() {
    if (!kioskActive) return;
    if (!isFullscreen()) {
      resumeOverlay.classList.remove("hidden");
    } else {
      resumeOverlay.classList.add("hidden");
    }
  }

  resumeBox.addEventListener("click", () => {
    requestFullscreen();
  });

  // Advar hvis eleven prøver at lukke/genindlæse fanen midt i forløbet.
  window.addEventListener("beforeunload", (e) => {
    if (!kioskActive) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // Bedste-forsøg blokering af almindelige måder at skifte program/fane på.
  // NB: Alt/Cmd+Tab og luk-med-Escape-fra-fuldskærm kan IKKE blokeres af en
  // webside - det er en OS/browser-begrænsning, ikke noget vi kan omgå her.
  const BLOCKED_KEYS = new Set([
    "F11",
    "F12",
    "Tab",
  ]);

  document.addEventListener("keydown", (e) => {
    if (!kioskActive) return;

    // Admin-genvej: Ctrl/Cmd+Alt+Shift+L åbner altid admin-panelet.
    if (e.shiftKey && e.altKey && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
      e.preventDefault();
      openAdmin();
      return;
    }

    if (adminOverlayOpen()) return; // lad admin-panelet bruge tastaturet frit

    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    if (ctrlOrCmd && ["w", "q", "n", "t"].includes(e.key.toLowerCase())) {
      e.preventDefault();
      return;
    }
    if (e.altKey && e.key === "F4") {
      e.preventDefault();
      return;
    }
    if (BLOCKED_KEYS.has(e.key)) {
      e.preventDefault();
      return;
    }
  });

  // --- Admin panel ---
  const adminOverlay = document.getElementById("admin-overlay");
  const adminPasswordInput = document.getElementById("admin-password");
  const adminError = document.getElementById("admin-error");
  const adminReset = document.getElementById("admin-reset");
  const adminQuit = document.getElementById("admin-quit");
  const adminCancel = document.getElementById("admin-cancel");

  function adminOverlayOpen() {
    return !adminOverlay.classList.contains("hidden");
  }

  function openAdmin() {
    adminPasswordInput.value = "";
    adminError.textContent = "";
    adminOverlay.classList.remove("hidden");
    adminPasswordInput.focus();
  }

  function closeAdmin() {
    adminOverlay.classList.add("hidden");
  }

  async function checkAdminPassword(attempt) {
    const res = await fetch("/api/admin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: attempt }),
    });
    const result = await res.json();
    return !!result.ok;
  }

  adminCancel.addEventListener("click", closeAdmin);

  adminReset.addEventListener("click", async () => {
    const ok = await checkAdminPassword(adminPasswordInput.value);
    if (!ok) {
      adminError.textContent = "Forkert adgangskode.";
      return;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    navnInput.value = "";
    klasseInput.value = "";
    svarInput.value = "";
    updateNextEnabled();
    updateCharCounter();
    showScreen("form");
    closeAdmin();
    if (!isFullscreen()) requestFullscreen();
  });

  adminQuit.addEventListener("click", async () => {
    const ok = await checkAdminPassword(adminPasswordInput.value);
    if (!ok) {
      adminError.textContent = "Forkert adgangskode.";
      return;
    }
    kioskActive = false;
    closeAdmin();
    resumeOverlay.classList.add("hidden");
    if (isFullscreen()) {
      const exit =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.msExitFullscreen;
      if (exit) exit.call(document).catch(() => {});
    }
    showScreen("ended");
  });

  showScreen("start");
})();
