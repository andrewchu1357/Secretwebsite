// ...existing code...
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, getIdTokenResult } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp
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

let db = null;
try { db = getFirestore(app); } catch (e) { db = null; console.warn("Firestore not available, will use localStorage fallback.", e); }

// DOM elems
const loadingEl = document.getElementById("loading");
const greetingEl = document.getElementById("greeting");
const userEmailEl = document.getElementById("userEmail");
const editNameBtn = document.getElementById("editName");
const signOutBtn = document.getElementById("signOut");

const noteText = document.getElementById("noteText");
const postBtn = document.getElementById("postBtn");
const pinCheckbox = document.getElementById("pinCheckbox");
const notesList = document.getElementById("notesList");

function showLoading(msg = "Checking authentication...") {
  if (loadingEl) { loadingEl.textContent = msg; loadingEl.classList.remove("hidden"); }
}
function hideLoading() { if (loadingEl) loadingEl.classList.add("hidden"); }
function formatDate(ts) {
  if (!ts) return "";
  // Firestore Timestamp vs number
  if (ts instanceof Timestamp) return ts.toDate().toLocaleString();
  if (ts.toDate) return ts.toDate().toLocaleString();
  return new Date(ts).toLocaleString();
}
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }

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
    // Try Firestore deletion first
    if (db && uid) {
      try {
        await deleteDoc(doc(db, "users", uid, "notifications", nid));
        return;
      } catch (e) {
        console.warn("Firestore delete failed, falling back to localStorage", e);
      }
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

let canPost = false;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // dashboard.html is in project root; go to root index
    window.location.href = "index.html";
    return;
  }

  hideLoading();
  const email = user.email || "";
  greetingEl.textContent = `Hello, ${localStorage.getItem("firstName") || "friend"}!`;
  userEmailEl.textContent = email;

  // Secure: check custom claim 'notifier'
  try {
    const idTokenRes = await getIdTokenResult(user, /*forceRefresh=*/ false);
    canPost = !!(idTokenRes?.claims?.notifier);
  } catch (err) {
    console.warn("Failed to read ID token claims:", err);
    canPost = false;
  }

  // UI: enable/disable post button and show a message
  postBtn.disabled = !canPost;
  postBtn.title = canPost ? "" : "You are not allowed to post notifications";

  // If using roles collection instead of custom claims, you can read roles doc:
  // const roleDoc = await getDoc(doc(db, "roles", user.uid)); canPost = roleDoc.exists() && roleDoc.data().notifier === true;

  if (db) initFirestoreListener(user.uid);
  else loadLocalNotes(user.uid);
});

// Prevent client from posting if not allowed (extra guard)
postBtn.addEventListener("click", async () => {
  if (!canPost) { alert("You are not allowed to post notifications."); return; }
  const text = (noteText.value || "").trim();
  if (!text) return;
  const pinned = !!pinCheckbox.checked;
  const user = auth.currentUser;
  if (!user) { alert("Not authenticated"); return; }

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

let unsubscribe = null;
function initFirestoreListener(uid) {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, (snap) => {
    notesList.innerHTML = "";
    if (snap.empty) { notesList.innerHTML = "<div class='small'>No notifications yet</div>"; return; }
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt || null;
      const item = renderNoteItem(docSnap.id, { text: data.text, pinned: data.pinned, createdAt }, uid);
      notesList.appendChild(item);
    });
  }, (err) => {
    console.error("Realtime snapshot error:", err);
    notesList.innerHTML = "<div class='small'>Failed to load realtime notifications.</div>";
  });
}

function loadLocalNotes(uid) {
  notesList.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem("notifications_" + uid) || "[]");
  if (!arr.length) { notesList.innerHTML = "<div class='small'>No notifications yet</div>"; return; }
  arr.sort((a,b)=> (Number(b.pinned) - Number(a.pinned)) || ((b.createdAt||0) - (a.createdAt||0)));
  arr.forEach(i => {
    const id = i.id || cryptoRandomId();
    const data = { text: i.text, pinned: i.pinned, createdAt: i.createdAt };
    notesList.appendChild(renderNoteItem(id, data, uid));
  });
}

function cryptoRandomId(){ return Math.random().toString(36).slice(2,10); }

editNameBtn.addEventListener("click", ()=> {
  const current = localStorage.getItem("firstName") || "";
  const name = prompt("What should we call you?", current) || "";
  if (name) localStorage.setItem("firstName", name);
  greetingEl.textContent = `Hello, ${localStorage.getItem("firstName") || "friend"}!`;
});

signOutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) { alert("Sign out failed: " + err.message); }
});