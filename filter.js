function filterPosts() {
  const query = document.getElementById("filterInput").value.toLowerCase();
  const postFeed = document.getElementById("postFeed");

  if (!Array.isArray(posts)) {
    console.error("posts array is not defined.");
    return;
  }

  const filtered = posts.filter(post =>
    post.author.toLowerCase().includes(query) ||
    post.message.toLowerCase().includes(query)
  );

  postFeed.innerHTML = "";

  filtered.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post");

    const canDelete = currentUser === ADMIN_USER;

    // Build comments HTML
    let commentsHTML = "";
    if (Array.isArray(post.comments)) {
      post.comments.forEach(c => {
        commentsHTML += `<p><strong>${c.author}:</strong> ${c.text}</p>`;
      });
    }

    div.innerHTML = `
      <strong>${post.author}</strong><br />
      <small>${post.timestamp}</small>
      <p>${post.message}</p>

      <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
      ${canDelete ? `<button onclick="deletePost(${post.id})">🗑️ Delete</button>` : ""}

      <div class="comment-box">
        <input type="text" placeholder="Comment..." onkeydown="if(event.key==='Enter') addComment(${post.id}, this.value)">
      </div>
      <div class="comments">${commentsHTML}</div>
    `;

    postFeed.appendChild(div);
  });
}