import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
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
  getDocs
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
console.log("Firebase app options:", app?.options || {});
console.log("projectId:", app?.options?.projectId);
const auth = getAuth(app);
onAuthStateChanged(auth, u => console.log("Auth state change:", u));
let db = null;
try { db = getFirestore(app); } catch (e) { console.warn("Firestore unavailable", e); db = null; }

// DOM (guarded queries)
const loadingEl = document.getElementById("loading");
const greetingEl = document.getElementById("greeting");
const userEmailEl = document.getElementById("userEmail");
const editNameBtn = document.getElementById("editName");
const signOutBtn = document.getElementById("signOut");

const threadTitleInput = document.getElementById("threadTitle");
const threadIntroInput = document.getElementById("threadIntro");
const threadPinned = document.getElementById("threadPinned");
const createThreadBtn = document.getElementById("createThreadBtn");
const threadsList = document.getElementById("threadsList");

const threadView = document.getElementById("threadView");
const threadTitleView = document.getElementById("threadTitleView");
const threadIntroView = document.getElementById("threadIntroView");
const deleteThreadBtn = document.getElementById("deleteThreadBtn");
const backToThreads = document.getElementById("backToThreads");
const postsList = document.getElementById("postsList");
const postText = document.getElementById("postText");
const postBtn = document.getElementById("postBtn");
const postPinned = document.getElementById("postPinned");

// helpers
function hideLoading(){ if (loadingEl) loadingEl.classList.add("hidden"); }
function showLoading(msg="Checking authentication..."){ if (loadingEl){ loadingEl.textContent = msg; loadingEl.classList.remove("hidden"); } }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[c]); }
function fmtDate(ts){ try { if (!ts) return ""; if (ts.toDate) return ts.toDate().toLocaleString(); return new Date(ts).toLocaleString(); } catch { return ""; } }

// state
let threadsUnsub = null;
let postsUnsub = null;
let currentThreadId = null;

// debug/test helper (call from DevTools): window.testCreateThread()
window.testCreateThread = async function() {
  try {
    if (!auth.currentUser) return console.error("Not signed in (auth.currentUser is null)");
    if (!db) return console.error("Firestore (db) not initialized");
    const docRef = await addDoc(collection(db, "threads"), {
      title: "TEST THREAD " + new Date().toISOString(),
      intro: "debug test",
      pinned: false,
      authorUid: auth.currentUser.uid,
      authorEmail: auth.currentUser.email || "",
      createdAt: serverTimestamp()
    });
    console.log("Test thread created:", docRef.id);
  } catch (err) {
    console.error("Test create failed:", err);
  }
};

// threads listener
function initThreadsListener() {
  if (!db) { if (threadsList) threadsList.innerHTML = "<div class='small'>Firestore not available</div>"; return; }
  if (threadsUnsub) threadsUnsub();
  const q = query(collection(db, "threads"), orderBy("pinned", "desc"), orderBy("createdAt", "desc"));
  threadsUnsub = onSnapshot(q, snap => {
    if (!threadsList) return;
    threadsList.innerHTML = "";
    if (snap.empty) { threadsList.innerHTML = "<div class='small'>No threads yet</div>"; return; }
    snap.forEach(d => {
      const data = d.data();
      const el = renderThreadItem(d.id, data);
      threadsList.appendChild(el);
    });
  }, err => {
    console.error("threads snapshot error", err);
    if (threadsList) threadsList.innerHTML = "<div class='small'>Failed to load threads</div>";
  });
}

// render thread element
function renderThreadItem(id, data) {
  const el = document.createElement("div");
  el.className = "thread";

  const left = document.createElement("div");
  left.className = "left";
  left.innerHTML = `<strong>${escapeHtml(data.title)}</strong>
    <div class="meta small">${fmtDate(data.createdAt)} • ${escapeHtml(data.authorEmail||"")}${data.pinned ? " • Pinned":""}</div>
    <div class="small">${escapeHtml(data.intro||"")}</div>`;

  const actions = document.createElement("div");
  actions.className = "actions";
  const openBtn = document.createElement("button"); openBtn.textContent = "Open";
  const delBtn = document.createElement("button"); delBtn.textContent = "Delete"; delBtn.style.background = "#ef4444";
  actions.appendChild(openBtn);
  actions.appendChild(delBtn);

  el.appendChild(left);
  el.appendChild(actions);

  openBtn.addEventListener("click", () => openThread(id, data));

  // show delete only for author (reactive)
  onAuthStateChanged(auth, user => {
    if (!user) delBtn.style.display = "none";
    else delBtn.style.display = (user.uid === data.authorUid) ? "" : "none";
  });

  delBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) { alert("Not authenticated"); return; }
    if (user.uid !== data.authorUid) { alert("Only the author can delete this thread"); return; }
    if (!db) { alert("Firestore required"); return; }
    try {
      const postsSnap = await getDocs(collection(db, "threads", id, "posts"));
      for (const r of postsSnap.docs) {
        await deleteDoc(doc(db, "threads", id, "posts", r.id));
      }
      await deleteDoc(doc(db, "threads", id));
    } catch (err) {
      console.error("Delete thread failed", err);
      alert("Delete failed: " + (err.message || err));
    }
  });

  return el;
}

// open thread
function openThread(threadId, threadData) {
  currentThreadId = threadId;
  if (threadTitleView) threadTitleView.textContent = threadData.title || "Thread";
  if (threadIntroView) threadIntroView.textContent = threadData.intro || "";

  if (threadView) threadView.classList.remove("hidden");
  const threadsSection = document.getElementById("threadsSection");
  const createSection = document.getElementById("createThread");
  if (threadsSection) threadsSection.classList.add("hidden");
  if (createSection) createSection.classList.add("hidden");

  const user = auth.currentUser;
  if (deleteThreadBtn) deleteThreadBtn.style.display = (user && user.uid === threadData.authorUid) ? "" : "none";

  if (!db) { if (postsList) postsList.innerHTML = "<div class='small'>Cloud posts unavailable</div>"; return; }
  if (postsUnsub) postsUnsub();
  const q = query(collection(db, "threads", threadId, "posts"), orderBy("pinned", "desc"), orderBy("createdAt","asc"));
  postsUnsub = onSnapshot(q, snap => {
    if (!postsList) return;
    postsList.innerHTML = "";
    if (snap.empty) { postsList.innerHTML = "<div class='small'>No posts yet</div>"; return; }
    snap.forEach(d => {
      const p = d.data();
      const el = renderPostItem(threadId, d.id, p);
      postsList.appendChild(el);
    });
  }, err => {
    console.error("posts snapshot failed", err);
    if (postsList) postsList.innerHTML = "<div class='small'>Failed to load posts</div>";
  });
}

// render post
function renderPostItem(threadId, postId, data) {
  const el = document.createElement("div");
  el.className = "message";
  const textDiv = document.createElement("div");
  textDiv.className = "messageText";
  textDiv.innerHTML = escapeHtml(data.text);
  const metaDiv = document.createElement("div");
  metaDiv.className = "meta small";
  metaDiv.textContent = `${fmtDate(data.createdAt)} • ${data.authorEmail || ""}${data.pinned ? " • Pinned":""}`;
  el.appendChild(textDiv);
  el.appendChild(metaDiv);

  const user = auth.currentUser;
  if (user && user.uid === data.authorUid) {
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.style.background = "#ef4444";
    del.style.marginTop = "8px";
    del.addEventListener("click", async () => {
      try { await deleteDoc(doc(db, "threads", threadId, "posts", postId)); } catch (err) { console.error("Delete post failed", err); alert("Delete failed: "+(err.message||err)); }
    });
    el.appendChild(del);
  }

  return el;
}

// create thread (fixed with better error handling)
if (createThreadBtn) {
  createThreadBtn.addEventListener("click", async () => {
    const title = (threadTitleInput?.value||"").trim();
    if (!title) { alert("Thread title required"); return; }
    const intro = (threadIntroInput?.value||"").trim();
    const pinned = !!threadPinned?.checked;
    const user = auth.currentUser;
    if (!user) { alert("Sign in required"); return; }
    if (!db) { alert("Firestore required — enable Firestore in Firebase Console"); return; }
    try {
      const docRef = await addDoc(collection(db, "threads"), {
        title,
        intro,
        pinned,
        authorUid: user.uid,
        authorEmail: user.email || "",
        createdAt: serverTimestamp()
      });
      console.log("Thread created:", docRef.id);
      if (threadTitleInput) threadTitleInput.value = "";
      if (threadIntroInput) threadIntroInput.value = "";
      if (threadPinned) threadPinned.checked = false;
    } catch (err) {
      console.error("Create thread failed", err);
      alert("Create thread failed: " + (err.message || err));
    }
  });
}

// post in thread
if (postBtn) {
  postBtn.addEventListener("click", async () => {
    const text = (postText?.value||"").trim();
    if (!text) return;
    const pinned = !!postPinned?.checked;
    const user = auth.currentUser;
    if (!user) { alert("Sign in required"); return; }
    if (!db) { alert("Firestore required"); return; }
    if (!currentThreadId) { alert("Open a thread first"); return; }
    try {
      await addDoc(collection(db, "threads", currentThreadId, "posts"), {
        text, pinned,
        authorUid: user.uid, authorEmail: user.email||"",
        createdAt: serverTimestamp()
      });
      if (postText) postText.value = "";
      if (postPinned) postPinned.checked = false;
    } catch (err) {
      console.error("Post failed", err);
      alert("Post failed: " + (err.message || err));
    }
  });
}

// back, delete thread handlers
if (backToThreads) {
  backToThreads.addEventListener("click", () => {
    if (threadView) threadView.classList.add("hidden");
    const threadsSection = document.getElementById("threadsSection");
    const createSection = document.getElementById("createThread");
    if (threadsSection) threadsSection.classList.remove("hidden");
    if (createSection) createSection.classList.remove("hidden");
    if (postsUnsub) { postsUnsub(); postsUnsub = null; }
    currentThreadId = null;
  });
}

if (deleteThreadBtn) {
  deleteThreadBtn.addEventListener("click", async () => {
    if (!currentThreadId) return;
    const user = auth.currentUser;
    if (!user) { alert("Sign in required"); return; }
    if (!db) { alert("Firestore required"); return; }
    try {
      const postsSnap = await getDocs(collection(db, "threads", currentThreadId, "posts"));
      for (const r of postsSnap.docs) await deleteDoc(doc(db, "threads", currentThreadId, "posts", r.id));
      await deleteDoc(doc(db, "threads", currentThreadId));
      if (backToThreads) backToThreads.click();
    } catch (err) {
      console.error("Delete thread failed", err);
      alert("Delete failed: " + (err.message || err));
    }
  });
}

// auth + init (replace your existing onAuthStateChanged handler with this block)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../../index.html";
    return;
  }

  console.log("Signed in user:", { uid: user.uid, email: user.email, displayName: user.displayName });

  // Prefer Auth displayName, fallback to localStorage
  const name = user.displayName || localStorage.getItem("firstName") || "friend";
  if (greetingEl) greetingEl.textContent = `Hello, ${name}!`;
  if (userEmailEl) userEmailEl.textContent = user.email || "";

  hideLoading();
  if (db) initThreadsListener();
  else if (threadsList) threadsList.innerHTML = "<div class='small'>Firestore required for threads/posts.</div>";
});

// edit name & sign out (replace your handler)
if (editNameBtn) {
  editNameBtn.addEventListener("click", async () => {
    const current = localStorage.getItem("firstName") || (auth.currentUser && auth.currentUser.displayName) || "";
    const name = prompt("What should we call you?", current) || "";
    if (!name) return;
    // save locally
    localStorage.setItem("firstName", name);
    if (greetingEl) greetingEl.textContent = `Hello, ${name}!`;

    // also attempt to update the Firebase Auth profile so the name persists cross-device
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
        console.log("Auth displayName updated:", name);
      }
    } catch (err) {
      console.warn("Failed to update Auth profile displayName:", err);
    }
  });
}

// debug helpers (add these near other helpers)
window.testReadThreads = async function() {
  try {
    if (!db) return console.error("db not initialized");
    const snap = await getDocs(collection(db, "threads"));
    console.log("threads count:", snap.size);
    snap.forEach(d => console.log(d.id, d.data()));
  } catch (err) {
    console.error("read threads failed", err);
  }
};
