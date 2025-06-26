// ========== Password Hashing ==========
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ========== App Variables ==========
let users = {};
let posts = JSON.parse(localStorage.getItem("posts")) || [];
let events = JSON.parse(localStorage.getItem("events")) || [];
let currentUser = localStorage.getItem("currentUser") || null;
let currentAvatar = localStorage.getItem("currentAvatar") || "avatar1.png";

const ADMIN_USER = "admin";

// ========== Auto-create Admin Account ==========
(async () => {
  const savedUsers = JSON.parse(localStorage.getItem("users") || "{}");

  if (!savedUsers.admin) {
    const adminHash = await hashPassword("secureadmin123");
    savedUsers.admin = adminHash;
    localStorage.setItem("users", JSON.stringify(savedUsers));
  }

  initApp();
})();

// ========== Initialization ==========
function initApp() {
  users = JSON.parse(localStorage.getItem("users")) || {};
  if (currentUser) showApp();
}

// ========== Authentication ==========
async function signup() {
  const username = document.getElementById("usernameInput")?.value.trim();
  const password = document.getElementById("passwordInput")?.value;
  const avatar = document.querySelector('input[name="avatar"]:checked')?.value || "avatar1.png";

  if (!username || !password) {
    return displayAuth("Please fill in both fields.");
  }

  if (users[username]) {
    return displayAuth("User already exists.");
  }

  const hashedPassword = await hashPassword(password);
  users[username] = hashedPassword;
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("avatar:" + username, avatar);

  displayAuth("✅ Account created. Now log in.");
}

async function login() {
  const username = document.getElementById("usernameInput")?.value.trim();
  const password = document.getElementById("passwordInput")?.value;

  if (!username || !password) {
    return displayAuth("Please fill in both fields.");
  }

  const storedHash = users[username];
  if (!storedHash) return displayAuth("User not found.");

  const inputHash = await hashPassword(password);

  if (storedHash === inputHash) {
    currentUser = username;
    localStorage.setItem("currentUser", currentUser);

    // Avatar retrieval
    currentAvatar = localStorage.getItem("avatar:" + username) || "avatar1.png";
    localStorage.setItem("currentAvatar", currentAvatar);

    // Welcome modal (session-only)
    if (!sessionStorage.getItem("welcomed")) {
      setTimeout(() => {
        alert(`🎉 Welcome to Gtok, ${username}-senpai!`);
        sessionStorage.setItem("welcomed", "true");
      }, 300);
    }

    displayAuth("");
    showApp();
  } else {
    displayAuth("❌ Invalid username or password.");
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  location.reload();
}

function displayAuth(msg) {
  const el = document.getElementById("authMessage");
  if (el) el.textContent = msg;
}

// ========== UI ==========
function showApp() {
  document.getElementById("authSection")?.classList.add("hidden");
  document.getElementById("postSection")?.classList.remove("hidden");
  document.getElementById("feedSection")?.classList.remove("hidden");
  document.getElementById("eventSection")?.classList.remove("hidden");

  if (currentUser === ADMIN_USER) {
    document.getElementById("createEventSection")?.classList.remove("hidden");
  }

  const status = currentUser === ADMIN_USER ? "🛡️ Admin" : "🟢 Online";
  document.getElementById("userStatus").textContent = `Logged in as ${escapeHTML(currentUser)} ${status}`;

  renderPosts();
  renderEvents();
}

// ========== Event Handling ==========
function submitEvent() {
  if (currentUser !== ADMIN_USER) {
    return alert("Only admins can create events.");
  }

  const title = document.getElementById("eventTitleInput").value.trim();
  const desc = document.getElementById("eventDescInput").value.trim();
  const date = document.getElementById("eventDateInput").value;

  if (!title || !desc || !date) {
    return alert("Please fill in all fields.");
  }

  const newEvent = {
    id: Date.now(),
    title: sanitizeText(title),
    description: sanitizeText(desc),
    datetime: date
  };

  events.unshift(newEvent);
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();

  document.getElementById("eventTitleInput").value = "";
  document.getElementById("eventDescInput").value = "";
  document.getElementById("eventDateInput").value = "";
}

function deleteEvent(id) {
  if (currentUser !== ADMIN_USER) {
    return alert("Only admins can delete events.");
  }

  if (!confirm("Are you sure you want to delete this event?")) return;

  events = events.filter(ev => ev.id !== id);
  localStorage.setItem("events", JSON.stringify(events));
  renderEvents();
}

function renderEvents() {
  const container = document.getElementById("eventFeed");
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = "<p>No events posted yet.</p>";
    return;
  }

  container.innerHTML = events.map(ev => `
    <div class="event-card">
      <h3>${escapeHTML(ev.title)}</h3>
      <p>${escapeHTML(ev.description)}</p>
      <small>📅 ${new Date(ev.datetime).toLocaleString()}</small>
      ${currentUser === ADMIN_USER ? `<br><button onclick="deleteEvent(${ev.id})">🗑️ Delete</button>` : ""}
    </div>
  `).join("");
}

// ========== Posts ==========
function submitPost() {
  const contentEl = document.getElementById("postContent");
  const content = contentEl?.value.trim();
  if (!content) return;

  const newPost = {
    id: Date.now(),
    author: currentUser,
    avatar: currentAvatar,
    message: sanitizeText(content),
    timestamp: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    comments: []
  };

  posts.unshift(newPost);
  saveAndRender();
  contentEl.value = "";
}

function likePost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const idx = post.likedBy.indexOf(currentUser);
  if (idx >= 0) {
    post.likes--;
    post.likedBy.splice(idx, 1);
  } else {
    post.likes++;
    post.likedBy.push(currentUser);
  }

  saveAndRender();
}

function deletePost(id) {
  if (currentUser !== ADMIN_USER) {
    return alert("Only the admin can delete posts.");
  }

  posts = posts.filter(p => p.id !== id);
  saveAndRender();
}

function addComment(id, text, inputElement) {
  if (!text.trim()) return;
  const post = posts.find(p => p.id === id);
  if (!post) return;

  post.comments.push({
    author: currentUser,
    text: sanitizeText(text.trim())
  });

  saveAndRender();
  if (inputElement) inputElement.value = "";
}

// ========== Rendering ==========
function renderPosts(filteredPosts = posts) {
  const container = document.getElementById("postFeed");
  if (!container) return;

  container.innerHTML = "";

  filteredPosts.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post");

    const canDelete = currentUser === ADMIN_USER;
    const dateStr = new Date(post.timestamp).toLocaleString();

    const commentsHTML = post.comments.map(c =>
      `<p><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</p>`
    ).join("");

    div.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
        <img src="${post.avatar}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
        <div>
          <strong>${escapeHTML(post.author)}</strong><br>
          <small>${dateStr}</small>
        </div>
      </div>

      <p>${escapeHTML(post.message)}</p>

      <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
      ${canDelete ? `<button onclick="deletePost(${post.id})">🗑️</button>` : ""}

      <div class="comment-box">
        <input type="text" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value, this)">
      </div>
      <div class="comments">${commentsHTML}</div>
    `;

    container.appendChild(div);
  });
}

function saveAndRender() {
  localStorage.setItem("posts", JSON.stringify(posts));
  renderPosts();
}

// ========== Helpers ==========
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
}
