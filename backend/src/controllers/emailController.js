const { sendLoginEmail, sendLogoutEmail } = require("../services/emailService");

async function sendLoginNotification(req, res) {
  try {
    const email = req.user?.email;
    const name = req.user?.user_metadata?.full_name || req.user?.email?.split("@")[0] || "User";

    if (!email) {
      return res.status(400).json({ success: false, error: "User email not found" });
    }

    // Fire-and-forget — don't block the response
    sendLoginEmail(email, name).catch(() => {});

    res.json({ success: true, message: "Login notification email queued" });
  } catch (error) {
    console.error("Login notification error:", error.message);
    res.status(500).json({ success: false, error: "Failed to send login notification" });
  }
}

async function sendLogoutNotification(req, res) {
  try {
    const email = req.user?.email;
    const name = req.user?.user_metadata?.full_name || req.user?.email?.split("@")[0] || "User";

    if (!email) {
      return res.status(400).json({ success: false, error: "User email not found" });
    }

    // Fire-and-forget — don't block the response
    sendLogoutEmail(email, name).catch(() => {});

    res.json({ success: true, message: "Logout notification email queued" });
  } catch (error) {
    console.error("Logout notification error:", error.message);
    res.status(500).json({ success: false, error: "Failed to send logout notification" });
  }
}

module.exports = { sendLoginNotification, sendLogoutNotification };
