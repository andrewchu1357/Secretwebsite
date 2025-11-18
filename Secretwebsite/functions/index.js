const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.createUser = functions.https.onRequest(async (req, res) => {
  const { email, password } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });
    res.status(201).send(`User created: ${userRecord.uid}`);
  } catch (error) {
    res.status(400).send(`Error creating user: ${error.message}`);
  }
});

exports.deleteUser = functions.https.onRequest(async (req, res) => {
  const { uid } = req.body;

  try {
    await admin.auth().deleteUser(uid);
    res.status(200).send(`User deleted: ${uid}`);
  } catch (error) {
    res.status(400).send(`Error deleting user: ${error.message}`);
  }
});

exports.listUsers = functions.https.onRequest(async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    res.status(200).send(listUsersResult.users);
  } catch (error) {
    res.status(400).send(`Error listing users: ${error.message}`);
  }
});