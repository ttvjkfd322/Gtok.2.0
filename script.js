<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gtok 🌸 Social Site</title>

  <!-- Trendy Font -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;600&display=swap" rel="stylesheet" />

  <!-- Styles -->
  <link rel="stylesheet" href="style.css" />

  <!-- Sakura Petals -->
  <script src="https://unpkg.com/sakura-js" defer></script>
  <script>
    window.addEventListener("DOMContentLoaded", () => {
      new Sakura('body');
    });
  </script>
</head>
<body>

  <!-- 🔔 Notification Bar -->
  <div id="notificationBar">
    <div class="notif-icon" id="notifLikes">❤️ <span>0</span></div>
    <div class="notif-icon" id="notifComments">💬 <span>0</span></div>
    <div class="notif-icon" id="notifFollows">➕ <span>0</span></div>
  </div>

  <!-- Header -->
  <header>
    <h1>🌸 Gtok Social</h1>
    <div id="userStatus" class="status-bar">Not logged in</div>
  </header>

  <!-- Navigation -->
  <nav id="mainNav" class="hidden">
    <button onclick="showPage('home')">🏠 Home</button>
    <button onclick="showPage('profile')">👤 Profile</button>
    <button onclick="showPage('settings')">⚙️ Settings</button>
  </nav>

  <!-- Authentication -->
  <section id="authSection">
    <h2>✨ Login or Sign Up</h2>
    <input type="text" id="usernameInput" placeholder="Username" autocomplete="username" />
    <input type="password" id="passwordInput" placeholder="Password" autocomplete="current-password" />
    <div>
      <button onclick="login()">Login</button>
      <button onclick="signup()">Sign Up</button>
    </div>
    <p id="authMessage"></p>
  </section>

  <!-- Home Page -->
  async function submitPost() {
  const contentEl = document.getElementById("postContent");
  const content = contentEl?.value.trim();
  if (!content) return;

  // 🔮 Generate thumbnail based on post content
  const thumbnail = await generateAnimeThumbnail(content);

  const newPost = {
    id: Date.now(),
    author: currentUser,
    avatar: currentAvatar,
    message: sanitizeText(content),
    timestamp: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    comments: [],
    thumbnail // 👈 Save generated anime thumbnail
  };

  posts.unshift(newPost);
  saveAndRender();
  contentEl.value = "";
}
  <section id="homePage" class="page hidden">
    <div id="postSection">
      <h2>📝 Create Post</h2>
      <textarea id="postContent" placeholder="What's on your mind, senpai?" rows="3" maxlength="280"></textarea>
      <button onclick="submitPost()">Post</button>
    </div>

    <div id="feedSection">
      <h2>🌍 Public Feed</h2>
      <input type="text" id="filterInput" placeholder="Filter posts..." oninput="filterPosts()" />
      <div id="postFeed" class="post-feed"></div>
      <div id="pagination"></div>
    </div>

    <div id="videoPostSection">
      <h2>🎥 Post a Video Link</h2>
      <textarea id="videoUrl" placeholder="Paste YouTube or Vimeo link here" rows="2"></textarea>
      <button onclick="postVideo()">Post Video</button>
      <div id="videoFeed"></div>
    </div>
  </section>

  <!-- Profile Page -->
  <section id="profilePage" class="page hidden">
    <h2>👘 Your Profile</h2>
    <p>Profile info coming soon... maybe your anime watchlist too?</p>
  </section>

  <!-- Settings Page -->
  <section id="settingsPage" class="page hidden">
    <h2>⚙️ Settings</h2>

    <div class="setting-item">
      <label for="themeToggle">🌗 Dark Mode</label>
      <input type="checkbox" id="themeToggle" onchange="toggleTheme()" />
    </div>

    <div class="setting-item">
      <h4>🔒 Change Password</h4>
      <input type="password" id="newPasswordInput" placeholder="New password" autocomplete="new-password" />
      <button onclick="changePassword()">Change Password</button>
    </div>

    <div class="setting-item">
      <button onclick="logout()">🚪 Log Out</button>
    </div>

    <div class="setting-item">
      <button onclick="deleteAccount()" style="background: #ff4d4d;">🗑️ Delete Account</button>
    </div>

    <p id="settingsMessage"></p>
  </section>

  <!-- Events Page -->
  <section id="eventSection" class="hidden">
    <h2>📅 Upcoming Events</h2>
    <div id="eventFeed"></div>
  </section>

  <!-- Create Event (Admin only) -->
  <section id="createEventSection" class="hidden">
    <h2>🎉 Create New Event</h2>
    <input type="text" id="eventTitleInput" placeholder="Event Title" />
    <textarea id="eventDescInput" placeholder="Event Description"></textarea>
    <input type="datetime-local" id="eventDateInput" />
    <button onclick="submitEvent()">Create Event</button>
  </section>

  <!-- Scripts -->
  <script src="script.js" defer></script>
  <script>
    function postVideo() {
      const url = document.getElementById("videoUrl").value.trim();
      if (!url) {
        alert("Please enter a video URL.");
        return;
      }

      if (!url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("vimeo.com")) {
        alert("Only YouTube or Vimeo URLs are supported.");
        return;
      }

      const embedUrl = convertToEmbed(url);
      if (!embedUrl) {
        alert("Could not parse the video URL.");
        return;
      }

      const videoFeed = document.getElementById("videoFeed");
      const videoDiv = document.createElement("div");
      videoDiv.className = "video-post";
      videoDiv.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
      videoFeed.prepend(videoDiv);
      document.getElementById("videoUrl").value = "";
    }

    function convertToEmbed(url) {
      if (url.includes("youtu.be")) {
        const videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes("youtube.com/watch")) {
        const videoId = new URL(url).searchParams.get("v");
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes("vimeo.com")) {
        const parts = url.split("/");
        const videoId = parts[parts.length - 1].split(/[?&]/)[0];
        return `https://player.vimeo.com/video/${videoId}`;
      }
      return null;
    }
  </script>
</body>
</html>