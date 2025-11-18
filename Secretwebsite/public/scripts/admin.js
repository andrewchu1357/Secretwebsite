// This file contains the JavaScript logic for the admin console, including functions to create, read, update, and delete user accounts.

import { getAuth, createUserWithEmailAndPassword, deleteUser, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUGgIUEHJiYfz5s-25OaJh-ME8jtxDZx4",
  authDomain: "secretweb-71fcc.firebaseapp.com",
  projectId: "secretweb-71fcc",
  storageBucket: "secretweb-71fcc.firebasestorage.app",
  messagingSenderId: "767394475176",
  appId: "1:767394475176:web:ff0ef5216bd8e61252669d",
  measurementId: "G-VJRSGWVXY5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to create a new user
async function createUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await addDoc(collection(db, "users"), {
      uid: user.uid,
      email: user.email
    });
    alert("User created successfully!");
  } catch (error) {
    alert("Error creating user: " + error.message);
  }
}

// Function to delete a user
async function deleteUserAccount(uid) {
  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
    alert("User deleted successfully!");
  } catch (error) {
    alert("Error deleting user: " + error.message);
  }
}

// Function to list all users
async function listUsers() {
  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data().email}`);
  });
}

// Event listeners for admin actions
document.getElementById("createUserForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("newEmail").value;
  const password = document.getElementById("newPassword").value;
  createUser(email, password);
});

document.getElementById("deleteUserForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const uid = document.getElementById("deleteUid").value;
  deleteUserAccount(uid);
});

// Call listUsers on page load to display current users
window.onload = listUsers;