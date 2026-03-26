const cron = require("node-cron");
const Capsule = require("../models/Capsule");
const sendEmail = require("../utils/sendEmail");

console.log("✅ reminderJob.js loaded");

function getTomorrowRange() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ✅ TEST MODE
cron.schedule("* * * * *", async () => {
  console.log("📩 Running capsule reminder job...");

  try {
    const { start, end } = getTomorrowRange();

    const capsules = await Capsule.find({
      unlockDate: { $gte: start, $lte: end },
      reminderSent: false,
      isUnlocked: false,
    }).populate("user");

    console.log("Capsules found:", capsules.length);

    for (const capsule of capsules) {
      const email = capsule.user?.email;

      if (!email) continue;

      console.log("Sending email to:", email);

      await sendEmail({
        to: email,
        subject: "⏳ Your Capsule Unlocks Tomorrow!",
        html: `
          <h2>Hey 👋</h2>
          <p>Your capsule <b>${capsule.title}</b> will unlock tomorrow 🎉</p>
        `,
      });

      capsule.reminderSent = true;
      await capsule.save();
    }

  } catch (err) {
    console.error("❌ Reminder job error:", err);
  }
});