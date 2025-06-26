// ========== Password Hashing ==========
async function hashPassword(password) {
  const e = new TextEncoder(), data = e.encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// ========== App State ==========
let users = {}, posts = JSON.parse(localStorage.getItem("posts")) || [],
    events = JSON.parse(localStorage.getItem("events")) || [],
    currentUser = localStorage.getItem("currentUser") || null,
    currentAvatar = localStorage.getItem("currentAvatar") || "avatar1.png",
    ADMIN_USER = "admin";

// ========== Admin Init ==========
(async () => {
  const saved = JSON.parse(localStorage.getItem("users") || "{}");
  if (!saved.admin) {
    saved.admin = await hashPassword("secureadmin123");
    localStorage.setItem("users", JSON.stringify(saved));
  }
  initApp();
})();

function initApp() {
  users = JSON.parse(localStorage.getItem("users") || "{}");
  if (currentUser) showApp();
}

// ========== Anime Thumbnail Fetcher (Pic.re) ==========
async function fetchAnimeThumbnail() {
  try {
    const res = await fetch("https://pic.re/image");
    if (!res.ok) throw new Error(res.status);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Thumbnail error:", err);
    return "fallback-thumbnail.jpg";
  }
}

// ========== Render Posts + Notifications ==========
async function renderPosts(filtered = posts) {
  const feed = document.getElementById("postFeed");
  if (!feed) return;
  feed.innerHTML = "";

  let totalLikes = 0, totalComments = 0;

  for (const p of filtered) {
    if (!p.thumbnail) {
      p.thumbnail = await fetchAnimeThumbnail();
      localStorage.setItem("posts", JSON.stringify(posts));
    }

    totalLikes += p.likes;
    totalComments += p.comments.length;

    const commentsHTML = p.comments.map(c =>
      `<p><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</p>`
    ).join("");

    const date = new Date(p.timestamp).toLocaleString();
    const isAdmin = currentUser === ADMIN_USER;

    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <img src="${p.thumbnail}" class="anime-thumbnail" alt="Anime thumbnail">
      <div style="display:flex;align-items:center;gap:10px;margin:0.5rem 0">
        <img src="${p.avatar}" style="width:40px;height:40px;border-radius:50%;">
        <div><strong>${escapeHTML(p.author)}</strong><br><small>${date}</small></div>
      </div>
      <p>${escapeHTML(p.message)}</p>
      <button onclick="likePost(${p.id})">❤️ ${p.likes}</button>
      ${isAdmin ? `<button onclick="deletePost(${p.id})">🗑️</button>` : ""}
      <div class="comment-box">
        <input type="text" placeholder="Add a comment…" onkeydown="if(event.key==='Enter') addComment(${p.id},this.value,this)">
      </div>
      <div class="comments">${commentsHTML}</div>
    `;
    feed.appendChild(div);
  }

  document.querySelector("#notifLikes span").textContent = totalLikes;
  document.querySelector("#notifComments span").textContent = totalComments;
  // follow feature not implemented yet:
  document.querySelector("#notifFollows span").textContent = 0;
}

// ========== Submit New Post ==========
async function submitPost() {
  const el = document.getElementById("postContent");
  const txt = el?.value.trim();
  if (!txt) return;

  const thumbnail = await fetchAnimeThumbnail();
  const newPost = {
    id: Date.now(), author: currentUser, avatar: currentAvatar,
    message: sanitizeText(txt),
    timestamp: new Date().toISOString(),
    likes: 0, likedBy: [], comments: [], thumbnail
  };
  posts.unshift(newPost);
  saveAndRender();
  el.value = "";
}

// ========== Like, Delete, Comment ==========
function likePost(id) {
  const p = posts.find(x => x.id === id);
  if (!p) return;
  const i = p.likedBy.indexOf(currentUser);
  i >= 0 ? (p.likes--, p.likedBy.splice(i, 1)) : (p.likes++, p.likedBy.push(currentUser));
  saveAndRender();
}

function deletePost(id) {
  if (currentUser !== ADMIN_USER) return alert("Admins only");
  posts = posts.filter(x => x.id !== id);
  saveAndRender();
}

function addComment(id, text, inp) {
  if (!text.trim()) return;
  const p = posts.find(x => x.id === id);
  p.comments.push({ author: currentUser, text: sanitizeText(text) });
  saveAndRender();
  if (inp) inp.value = "";
}

// ========== Event Handling ==========
function submitEvent() {
  if (currentUser !== ADMIN_USER) return alert("Admins only");
  const t = document.getElementById("eventTitleInput").value.trim();
  const d = document.getElementById("eventDescInput").value.trim();
  const dt = document.getElementById("eventDateInput").value;
  if (!t || !d || !dt) return alert("Fill all fields");

  events.unshift({ id: Date.now(), title: sanitizeText(t), description: sanitizeText(d), datetime: dt });
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();
}

function deleteEvent(id) {
  if (currentUser !== ADMIN_USER) return alert("Admins only");
  events = events.filter(e => e.id !== id);
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();
}

function renderEvents() {
  const c = document.getElementById("eventFeed");
  if (!c) return;
  if (!events.length) return c.innerHTML = "<p>No events yet.</p>";
  c.innerHTML = events.map(e => `
    <div class="event-card">
      <h3>${escapeHTML(e.title)}</h3>
      <p>${escapeHTML(e.description)}</p>
      <small>📅 ${new Date(e.datetime).toLocaleString()}</small>
      ${currentUser === ADMIN_USER ? `<br><button onclick="deleteEvent(${e.id})">🗑️ Delete</button>` : ""}
    </div>
  `).join("");
}

// ========== Authentication ==========
async function signup() {
  const u = document.getElementById("usernameInput").value.trim();
  const p = document.getElementById("passwordInput").value;
  if (!u || !p) return displayAuth("Fill both fields");

  if (users[u]) return displayAuth("User exists");
  users[u] = await hashPassword(p);
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("avatar:" + u, currentAvatar);
  displayAuth("✅ Created! Please login.");
}

async function login() {
  const u = document.getElementById("usernameInput").value.trim();
  const p = document.getElementById("passwordInput").value;
  if (!u || !p) return displayAuth("Fill both fields");

  const stored = users[u];
  if (!stored) return displayAuth("User not found");

  const input = await hashPassword(p);
  if (input !== stored) return displayAuth("❌ Invalid login");
  
  currentUser = u;
  localStorage.setItem("currentUser", u);
  currentAvatar = localStorage.getItem("avatar:" + u) || "avatar1.png";
  sessionStorage.getItem("welcomed") || setTimeout(() => (alert(`🎉 Welcome ${u}-senpai!`), sessionStorage.setItem("welcomed","1")), 300);

  displayAuth("");
  showApp();
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

function displayAuth(msg) {
  document.getElementById("authMessage").textContent = msg;
}

// ========== UI Helpers ==========
function showApp() {
  ["authSection","mainNav","postSection","feedSection","eventSection"]
    .forEach(id => document.getElementById(id)?.classList.toggle("hidden", id==="authSection"));
  if (currentUser === ADMIN_USER) document.getElementById("createEventSection").classList.remove("hidden");

  document.getElementById("userStatus").textContent =
    `Logged in as ${escapeHTML(currentUser)} ${currentUser === ADMIN_USER ? "🛡️ Admin" : "🟢 Online"}`;

  renderPosts();
  renderEvents();
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
}

function saveAndRender() {
  localStorage.setItem("posts", JSON.stringify(posts));
  renderPosts();
}

// ========== Sanitizers ==========
function sanitizeText(s) {
  const t = document.createElement("div");
  t.textContent = s;
  return t.innerHTML;
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}