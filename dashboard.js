import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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

let db;
try { db = getFirestore(app); } catch (e) { db = null; }

const loadingEl = document.getElementById("loading");
const greetingEl = document.getElementById("greeting");
const userEmailEl = document.getElementById("userEmail");
const editNameBtn = document.getElementById("editName");
const signOutBtn = document.getElementById("signOut");

const noteText = document.getElementById("noteText");
const postBtn = document.getElementById("postBtn");
const pinCheckbox = document.getElementById("pinCheckbox");
const notesList = document.getElementById("notesList");

// Helpers
function showLoading(msg = "Checking authentication...") {
  loadingEl.textContent = msg; loadingEl.classList.remove("hidden");
}
function hideLoading() { loadingEl.classList.add("hidden"); }
function formatDate(ts) {
  try { return (ts.toDate) ? ts.toDate().toLocaleString() : new Date(ts).toLocaleString(); } catch { return ""; }
}
function renderNoteItem(nid, data, uid) {
  const el = document.createElement("div");
  el.className = "note";
  const left = document.createElement("div");
  left.style.flex = "1";
  left.innerHTML = `<div>${escapeHtml(data.text)}</div><div class="meta small">${formatDate(data.createdAt)}` + (data.pinned ? " • Pinned" : "") + `</div>`;
  const actions = document.createElement("div");
  actions.className = "actions";
  const del = document.createElement("button");
  del.textContent = "Delete";
  del.style.background = "#ef4444";
  del.onclick = async () => {
    // Try Firestore first
    if (db && uid) {
      try { await deleteDoc(doc(db, "users", uid, "notifications", nid)); return; } catch (e) { /* fallthrough */ }
    }
    // localStorage fallback
    const key = "notifications_" + uid;
    const arr = JSON.parse(localStorage.getItem(key) || "[]").filter(i => i.id !== nid);
    localStorage.setItem(key, JSON.stringify(arr));
    loadLocalNotes(uid);
  };
  actions.appendChild(del);
  el.appendChild(left);
  el.appendChild(actions);
  return el;
}
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }

// Auth & initial load
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // path: /Secretwebsite/public/dashboard.html -> root index is two levels up
    window.location.href = "../../index.html";
    return;
  }
  hideLoading();
  const email = user.email || "";
  greetingEl.textContent = `Hello, ${localStorage.getItem("firstName") || "friend"}!`;
  userEmailEl.textContent = email;
  // Load notes from Firestore if available, otherwise localStorage
  if (db) initFirestoreListener(user.uid);
  else loadLocalNotes(user.uid);
});

// Post notification
postBtn.addEventListener("click", async () => {
  const text = noteText.value.trim();
  if (!text) return;
  const pinned = !!pinCheckbox.checked;
  const user = auth.currentUser;
  if (!user) { alert("Not authenticated"); return; }

  // Try Firestore write
  if (db) {
    try {
      await addDoc(collection(db, "users", user.uid, "notifications"), {
        text, pinned, createdAt: serverTimestamp()
      });
      noteText.value = ""; pinCheckbox.checked = false;
      return;
    } catch (e) {
      console.warn("Firestore write failed, saving locally", e);
    }
  }

  // localStorage fallback
  const key = "notifications_" + user.uid;
  const arr = JSON.parse(localStorage.getItem(key) || "[]");
  arr.push({ id: cryptoRandomId(), text, pinned, createdAt: Date.now() });
  localStorage.setItem(key, JSON.stringify(arr));
  noteText.value = ""; pinCheckbox.checked = false;
  loadLocalNotes(user.uid);
});

// Firestore listener
let unsubscribe = null;
function initFirestoreListener(uid) {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snap) => {
    notesList.innerHTML = "";
    if (snap.empty) { notesList.innerHTML = "<div class='small'>No notifications yet</div>"; return; }
    snap.forEach(docSnap => {
      const data = docSnap.data();
      // Ensure createdAt is readable
      const createdAt = data.createdAt || Date.now();
      const item = renderNoteItem(docSnap.id, { text: data.text, pinned: data.pinned, createdAt }, uid);
      notesList.appendChild(item);
    });
  }, (err) => {
    console.error("Realtime failed:", err);
    notesList.innerHTML = "<div class='small'>Failed to load realtime notifications.</div>";
  });
}

// localStorage loader
function loadLocalNotes(uid) {
  notesList.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem("notifications_" + uid) || "[]");
  if (!arr.length) { notesList.innerHTML = "<div class='small'>No notifications yet</div>"; return; }
  // sort pinned + by date
  arr.sort((a,b)=> (b.pinned - a.pinned) || ( (b.createdAt||0) - (a.createdAt||0) ));
  arr.forEach(i => {
    const id = i.id || cryptoRandomId();
    const data = { text: i.text, pinned: i.pinned, createdAt: i.createdAt };
    notesList.appendChild(renderNoteItem(id, data, uid));
  });
}

// simple id
function cryptoRandomId(){ return Math.random().toString(36).slice(2,10); }

// Edit name / sign out
editNameBtn.addEventListener("click", ()=> {
  const current = localStorage.getItem("firstName") || "";
  const name = prompt("What should we call you?", current) || "";
  if (name) localStorage.setItem("firstName", name);
  greetingEl.textContent = `Hello, ${localStorage.getItem("firstName") || "friend"}!`;
});
signOutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "../../index.html";
  } catch (err) { alert("Sign out failed: " + err.message); }
});