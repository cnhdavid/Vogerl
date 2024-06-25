// Assuming you have an API endpoint that returns vote data for multiple posts
export async function fetchVotesForPosts(postIds) {
  const response = await fetch("/vote/votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ postIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch votes");
  }
  const data = await response.json();
  return data.votes;
}

export async function fetchUserVotesForPosts(postIds) {
  const response = await fetch("/vote/userVotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ postIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user votes");
  }

  const data = await response.json();
  return data.userVotes;
}
