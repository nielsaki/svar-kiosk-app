module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }
  const { password } = req.body || {};
  const ok =
    typeof password === "string" &&
    typeof process.env.ADMIN_PASSWORD === "string" &&
    process.env.ADMIN_PASSWORD.length > 0 &&
    password === process.env.ADMIN_PASSWORD;
  res.status(200).json({ ok });
};
