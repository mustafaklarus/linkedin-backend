import axios from "axios";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const cookie = req.headers.cookie?.split("session=")[1];
    if (!cookie) return res.status(401).json({ error: "Not logged in" });

    const { access_token } = jwt.verify(cookie, process.env.JWT_SECRET);

    const { text } = req.body;

    // Fetch user's URN (needed for posting)
    const me = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const authorUrn = `urn:li:person:${me.data.id}`;

    // Post content
    await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to publish post" });
  }
}
