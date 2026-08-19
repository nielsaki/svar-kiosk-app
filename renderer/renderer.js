(function () {
  const screens = {
    form: document.getElementById("screen-form"),
    countdown: document.getElementById("screen-countdown"),
    answer: document.getElementById("screen-answer"),
    sending: document.getElementById("screen-sending"),
    done: document.getElementById("screen-done"),
    error: document.getElementById("screen-error"),
  };

  function showScreen(name) {
    for (const key in screens) {
      screens[key].classList.toggle("active", key === name);
    }
  }

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

  window.kiosk.getConfig().then((cfg) => {
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
    const result = await window.kiosk.sendAnswer({
      navn: navnInput.value.trim(),
      klasse: klasseInput.value.trim(),
      svar,
    });
    if (result.ok) {
      showScreen("done");
    } else {
      errorMessage.textContent = result.error || "Ukendt fejl. Prøv igen.";
      showScreen("error");
    }
  });

  btnRetry.addEventListener("click", () => {
    showScreen("answer");
  });

  // --- Admin panel ---
  const adminOverlay = document.getElementById("admin-overlay");
  const adminPasswordInput = document.getElementById("admin-password");
  const adminError = document.getElementById("admin-error");
  const adminReset = document.getElementById("admin-reset");
  const adminQuit = document.getElementById("admin-quit");
  const adminCancel = document.getElementById("admin-cancel");

  function openAdmin() {
    adminPasswordInput.value = "";
    adminError.textContent = "";
    adminOverlay.classList.remove("hidden");
    adminPasswordInput.focus();
  }

  function closeAdmin() {
    adminOverlay.classList.add("hidden");
  }

  window.kiosk.onOpenAdmin(openAdmin);

  adminCancel.addEventListener("click", closeAdmin);

  adminReset.addEventListener("click", async () => {
    const ok = await window.kiosk.checkAdminPassword(adminPasswordInput.value);
    if (!ok) {
      adminError.textContent = "Forkert adgangskode.";
      return;
    }
    await window.kiosk.relock();
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
  });

  adminQuit.addEventListener("click", async () => {
    const ok = await window.kiosk.adminQuit(adminPasswordInput.value);
    if (!ok) {
      adminError.textContent = "Forkert adgangskode.";
    }
  });

  showScreen("form");
})();
