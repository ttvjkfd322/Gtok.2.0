// ========== FILTER POSTS ==========
function filterPosts() {
  const query = document.getElementById("filterInput").value.toLowerCase().trim();

  if (!Array.isArray(posts)) {
    console.error("❌ Posts array is not defined or invalid.");
    return;
  }

  const filtered = posts.filter(post =>
    post.author.toLowerCase().includes(query) ||
    post.message.toLowerCase().includes(query)
  );

  renderPosts(filtered);
}