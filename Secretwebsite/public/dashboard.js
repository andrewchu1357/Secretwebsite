import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, orderBy, onSnapshot,
  deleteDoc, doc, serverTimestamp, getDocs
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
try { db = getFirestore(app); } catch (e) { console.warn("Firestore unavailable", e); db = null; }

const loadingEl = document.getElementById("loading");
const greetingEl = document.getElementById("greeting");
const userEmailEl = document.getElementById("userEmail");
const editNameBtn = document.getElementById("editName");
const signOutBtn = document.getElementById("signOut");

const msgText = document.getElementById("msgText");
const postBtn = document.getElementById("postBtn");
const pinCheckbox = document.getElementById("pinCheckbox");
const messagesList = document.getElementById("messagesList");

function hideLoading(){ loadingEl && loadingEl.classList.add("hidden"); }
function showLoading(msg="Checking authentication..."){ if(loadingEl){ loadingEl.textContent = msg; loadingEl.classList.remove("hidden"); } }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }
function formatDate(ts){ try { if(!ts) return ""; if (ts.toDate) return ts.toDate().toLocaleString(); return new Date(ts).toLocaleString(); } catch { return ""; } }
function cryptoRandomId(){ return Math.random().toString(36).slice(2,10); }

// map of reply listeners to unsubscribe functions
const replyUnsubs = new Map();

// real-time messages listener
let messagesUnsub = null;
function initMessagesListener() {
  if (!db) {
    messagesList.innerHTML = "<div class='small'>Firestore is not available.</div>";
    return;
  }
  if (messagesUnsub) messagesUnsub();
  const q = query(collection(db, "messages"), orderBy("pinned", "desc"), orderBy("createdAt", "desc"));
  messagesUnsub = onSnapshot(q, snap => {
    messagesList.innerHTML = "";
    if (snap.empty) { messagesList.innerHTML = "<div class='small'>No messages yet</div>"; return; }
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const el = renderMessageItem(docSnap.id, data);
      messagesList.appendChild(el);
    });
  }, err => {
    console.error("Messages snapshot failed:", err);
    messagesList.innerHTML = "<div class='small'>Failed to load messages.</div>";
  });
}

// render a single message element (includes replies area & reply form)
function renderMessageItem(id, data) {
  const el = document.createElement("div");
  el.className = "message";
  const header = document.createElement("div");
  header.className = "messageHeader";
  const left = document.createElement("div");
  left.innerHTML = `<div class="messageText">${escapeHtml(data.text)}</div><div class="meta small">${formatDate(data.createdAt)} • ${escapeHtml(data.authorEmail || "")}${data.pinned ? " • Pinned" : ""}</div>`;
  const actions = document.createElement("div");
  actions.className = "actions";
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "Open";
  toggleBtn.className = "small";
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.style.background = "#ef4444";

  actions.appendChild(toggleBtn);
  // delete only shown to message author when user is known (checked later)
  actions.appendChild(deleteBtn);
  header.appendChild(left);
  header.appendChild(actions);

  const repliesDiv = document.createElement("div");
  repliesDiv.className = "replies hidden";
  const replyForm = document.createElement("div");
  replyForm.className = "replyForm hidden";
  const replyTextarea = document.createElement("textarea");
  replyTextarea.rows = 2;
  replyTextarea.placeholder = "Write a reply...";
  const replyBtn = document.createElement("button");
  replyBtn.className = "replyBtn";
  replyBtn.textContent = "Reply";
  replyForm.appendChild(replyTextarea);
  replyForm.appendChild(replyBtn);

  el.appendChild(header);
  el.appendChild(repliesDiv);
  el.appendChild(replyForm);

  // toggle show/hide replies
  let opened = false;
  toggleBtn.addEventListener("click", async () => {
    opened = !opened;
    if (opened) {
      repliesDiv.classList.remove("hidden");
      replyForm.classList.remove("hidden");
      toggleBtn.textContent = "Close";
      // attach replies listener
      attachRepliesListener(id, repliesDiv);
    } else {
      repliesDiv.classList.add("hidden");
      replyForm.classList.add("hidden");
      toggleBtn.textContent = "Open";
      detachRepliesListener(id);
      repliesDiv.innerHTML = "";
    }
  });

  // delete message
  deleteBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) { alert("Not authenticated"); return; }
    if (user.uid !== data.authorUid) { alert("Only the author can delete this message"); return; }
    if (!db) { alert("Cannot delete: Firestore not available"); return; }
    try {
      // delete subcollection replies first (best-effort)
      const repliesSnap = await getDocs(collection(db, "messages", id, "replies"));
      for (const r of repliesSnap.docs) {
        await deleteDoc(doc(db, "messages", id, "replies", r.id));
      }
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + err.message);
    }
  });

  // post a reply
  replyBtn.addEventListener("click", async () => {
    const text = (replyTextarea.value || "").trim();
    if (!text) return;
    const user = auth.currentUser;
    if (!user) { alert("Not authenticated"); return; }
    if (!db) { alert("Firestore required to save replies to cloud"); return; }
    try {
      await addDoc(collection(db, "messages", id, "replies"), {
        text,
        authorUid: user.uid,
        authorEmail: user.email || "",
        createdAt: serverTimestamp()
      });
      replyTextarea.value = "";
    } catch (err) {
      console.error("Reply failed:", err);
      alert("Reply failed: " + err.message);
    }
  });

  // show/hide delete based on current user
  onAuthStateChanged(auth, (user) => {
    if (user && user.uid === data.authorUid) deleteBtn.style.display = "";
    else deleteBtn.style.display = "none";
  });

  return el;
}

// attach live listener for replies for a message id
function attachRepliesListener(messageId, container) {
  if (!db) {
    container.innerHTML = "<div class='small'>Cloud replies unavailable</div>";
    return;
  }
  if (replyUnsubs.has(messageId)) return; // already listening
  const repliesCol = collection(db, "messages", messageId, "replies");
  const q = query(repliesCol, orderBy("createdAt", "asc"));
  const unsub = onSnapshot(q, snap => {
    container.innerHTML = "";
    if (snap.empty) { container.innerHTML = "<div class='small'>No replies</div>"; return; }
    snap.forEach(docSnap => {
      const d = docSnap.data();
      const r = document.createElement("div");
      r.className = "reply";
      r.innerHTML = `<div>${escapeHtml(d.text)}</div><div class="meta small">${formatDate(d.createdAt)} • ${escapeHtml(d.authorEmail || "")}</div>`;
      // delete reply only for author
      const user = auth.currentUser;
      if (user && d.authorUid === user.uid) {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.style.marginTop = "6px";
        del.style.background = "#ef4444";
        del.onclick = async () => {
          try { await deleteDoc(doc(db, "messages", messageId, "replies", docSnap.id)); } catch (err) { console.error("Delete reply failed", err); }
        };
        r.appendChild(del);
      }
      container.appendChild(r);
    });
  }, err => {
    console.error("Replies onSnapshot error:", err);
    container.innerHTML = "<div class='small'>Failed to load replies</div>";
  });
  replyUnsubs.set(messageId, unsub);
}
function detachRepliesListener(messageId) {
  const unsub = replyUnsubs.get(messageId);
  if (unsub) { unsub(); replyUnsubs.delete(messageId); }
}

// auth state + initialize messages listener
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../../index.html";
    return;
  }
  hideLoading();
  greetingEl.textContent = `Hello, ${localStorage.getItem("firstName") || "friend"}!`;
  userEmailEl.textContent = user.email || "";
  if (db) initMessagesListener();
  else messagesList.innerHTML = "<div class='small'>Firestore is not available. Messages require Firestore.</div>";
});

// post a new message
postBtn.addEventListener("click", async () => {
  const text = (msgText.value || "").trim();
  if (!text) return;
  const pinned = !!pinCheckbox.checked;
  const user = auth.currentUser;
  if (!user) { alert("Not authenticated"); return; }
  if (!db) { alert("Firestore is required to save messages to the cloud"); return; }
  try {
    await addDoc(collection(db, "messages"), {
      text,
      pinned,
      authorUid: user.uid,
      authorEmail: user.email || "",
      createdAt: serverTimestamp()
    });
    msgText.value = "";
    pinCheckbox.checked = false;
  } catch (err) {
    console.error("Post failed:", err);
    alert("Post failed: " + err.message);
  }
});

// edit name & sign out
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