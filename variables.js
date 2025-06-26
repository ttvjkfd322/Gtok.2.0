// ========== Variables ==========
let users = JSON.parse(localStorage.getItem("users")) || {};
let posts = JSON.parse(localStorage.getItem("posts")) || [];
let currentUser = localStorage.getItem("currentUser") || null;
const ADMIN_USER = "admin";

// ========== Authentication ==========
function signup() {
  const username = document.getElementById("usernameInput")?.value.trim();
  const password = document.getElementById("passwordInput")?.value.trim();

  if (!username || !password) {
    return displayAuth("❗ Please fill in both fields.");
  }

  if (users[username]) {
    return displayAuth("⚠️ User already exists.");
  }

  users[username] = password;
  localStorage.setItem("users", JSON.stringify(users));
  displayAuth("✅ Account created. Now log in.");
}

function login() {
  const username = document.getElementById("usernameInput")?.value.trim();
  const password = document.getElementById("passwordInput")?.value.trim();

  if (users[username] === password) {
    currentUser = username;
    localStorage.setItem("currentUser", currentUser);
    displayAuth("");
    showApp();
  } else {
    displayAuth("❌ Invalid username or password.");
  }
}

function displayAuth(msg) {
  const el = document.getElementById("authMessage");
  if (el) el.textContent = msg;
}

// ========== UI Logic ==========
function showApp() {
  document.getElementById("authSection")?.classList.add("hidden");
  document.getElementById("postSection")?.classList.remove("hidden");
  document.getElementById("feedSection")?.classList.remove("hidden");

  const status = currentUser === ADMIN_USER ? "🛡️ Admin" : "🟢 Online";
  document.getElementById("userStatus").textContent = `Logged in as ${escapeHTML(currentUser)} ${status}`;

  renderPosts();
}

// ========== Posts ==========
function submitPost() {
  if (!currentUser) {
    return alert("Please log in to post.");
  }

  const contentEl = document.getElementById("postContent");
  const content = contentEl?.value.trim();
  if (!content) return;

  const newPost = {
    id: Date.now(),
    author: currentUser,
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
  if (!currentUser) {
    return alert("Please log in to like posts.");
  }

  const post = posts.find(p => p.id === id);
  if (!post || post.likedBy.includes(currentUser)) {
    return alert("You've already liked this post.");
  }

  post.likes++;
  post.likedBy.push(currentUser);
  saveAndRender();
}

function deletePost(id) {
  if (currentUser !== ADMIN_USER) {
    return alert("Only admin can delete posts.");
  }

  posts = posts.filter(p => p.id !== id);
  saveAndRender();
}

function addComment(id, text, inputElement) {
  if (!currentUser) {
    return alert("Please log in to comment.");
  }

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
    const dateStr = post.timestamp ? new Date(post.timestamp).toLocaleString() : "";

    const commentsHTML = post.comments.map(c =>
      `<p><strong>${escapeHTML(c.author)}:</strong> ${escapeHTML(c.text)}</p>`
    ).join("");

    div.innerHTML = `
      <strong>${escapeHTML(post.author)}</strong> <small>${dateStr}</small>
      <p>${escapeHTML(post.message)}</p>

      <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
      ${canDelete ? `<button onclick="deletePost(${post.id})">🗑️</button>` : ""}

      <div class="comment-box">
        <input type="text" placeholder="Add a comment..." 
               onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value, this)">
      </div>
      <div class="comments">${commentsHTML}</div>
    `;

    container.appendChild(div);
  });
}

function saveAndRender() {
  localStorage.setItem("posts", JSON.stringify(posts));
  renderPosts(); // live update
}

// ========== Helpers ==========
function sanitizeText(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// ========== Auto-login ==========
if (currentUser) {
  showApp();
}