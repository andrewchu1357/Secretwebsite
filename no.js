// Checks auth, asks for a one-time name, and greets the user.
// Uses same firebase config as your index.html.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

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

const loadingEl = document.getElementById("loading");
const welcomeArea = document.getElementById("welcomeArea");
const nameForm = document.getElementById("nameForm");
const greetingEl = document.getElementById("greeting");
const userEmailEl = document.getElementById("userEmail");
const firstNameInput = document.getElementById("firstName");
const signOutBtn = document.getElementById("signOut");
const editNameBtn = document.getElementById("editName");

function showLoading(msg = "Checking authentication...") {
  loadingEl.textContent = msg;
  loadingEl.classList.remove("hidden");
  welcomeArea.classList.add("hidden");
  nameForm.classList.add("hidden");
}
function showWelcome(name, email) {
  greetingEl.textContent = `Hello, ${name}!`;
  userEmailEl.textContent = email || "";
  loadingEl.classList.add("hidden");
  nameForm.classList.add("hidden");
  welcomeArea.classList.remove("hidden");
}
function showNameForm(prefill = "") {
  firstNameInput.value = prefill;
  loadingEl.classList.add("hidden");
  welcomeArea.classList.add("hidden");
  nameForm.classList.remove("hidden");
}

// If not authenticated, go back to login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // ensure relative path, not absolute
    window.location.href = "index.html";
    return;
  }
  const email = user.email || "";
  const storedName = localStorage.getItem("firstName");
  if (storedName) {
    showWelcome(storedName, email);
  } else {
    showNameForm("");
  }
});

// Save name one-time
nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = firstNameInput.value.trim();
  if (!name) return;
  localStorage.setItem("firstName", name);
  showWelcome(name, auth.currentUser ? auth.currentUser.email : "");
});

// Allow editing the name
editNameBtn.addEventListener("click", () => {
  const current = localStorage.getItem("firstName") || "";
  showNameForm(current);
});

// Sign out
signOutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    localStorage.removeItem("firstName"); // optional: remove stored name on sign out
    window.location.href = "index.html";
  } catch (err) {
    alert("Sign out failed: " + err.message);
  }
});