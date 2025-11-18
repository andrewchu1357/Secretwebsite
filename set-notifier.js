// Usage: node set-notifier.js user@example.com true
const admin = require("firebase-admin");
const email = process.argv[2];
const value = process.argv[3] === "true";

if (!email) {
  console.error("Usage: node set-notifier.js <email> <true|false>");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { notifier: value });
    console.log(`Set notifier=${value} for ${email} (uid=${user.uid})`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();