const nodemailer = require("nodemailer");

function splitRecipients(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const maxChars = Number(process.env.MAX_CHARS || 2000);
  const body = req.body || {};
  const navn = String(body.navn || "").trim().slice(0, 200);
  const klasse = String(body.klasse || "").trim().slice(0, 100);
  const svar = String(body.svar || "").trim().slice(0, maxChars);

  if (!navn || !klasse || !svar) {
    res.status(400).json({ ok: false, error: "Navn, klasse og svar skal alle være udfyldt." });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromName = process.env.FROM_NAME || "Svar Kiosk";
  const fromAddr = `"${fromName}" <${process.env.SMTP_USER}>`;
  const timestamp = new Date().toLocaleString("da-DK");

  const anonymRecipients = splitRecipients(process.env.RECIPIENTS_ANONYM);
  const fullRecipients = splitRecipients(process.env.RECIPIENTS_FULL);

  const jobs = [];

  if (anonymRecipients.length) {
    jobs.push(
      transporter.sendMail({
        from: fromAddr,
        to: anonymRecipients.join(","),
        subject: `Svar fra klasse ${klasse}`,
        text: `Klasse: ${klasse}\nTidspunkt: ${timestamp}\n\nSvar:\n${svar}`,
      })
    );
  }

  if (fullRecipients.length) {
    jobs.push(
      transporter.sendMail({
        from: fromAddr,
        to: fullRecipients.join(","),
        subject: `Svar fra ${navn}, ${klasse}`,
        text: `Navn: ${navn}\nKlasse: ${klasse}\nTidspunkt: ${timestamp}\n\nSvar:\n${svar}`,
      })
    );
  }

  try {
    await Promise.all(jobs);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: String((err && err.message) || err) });
  }
};
