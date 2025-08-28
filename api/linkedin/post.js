const axios = require('axios');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Post content is required' });
    }

    // Get session cookie
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const sessionToken = sessionMatch[1];
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);

    // Check if token is expired
    if (Date.now() > decoded.tokenExpiry) {
      return res.status(401).json({ error: 'Token expired' });
    }

    // Create LinkedIn post
    const postData = {
      author: `urn:li:person:${decoded.linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: text.trim() },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const response = await axios.post("https://api.linkedin.com/v2/ugcPosts", postData, {
      headers: { 
        Authorization: `Bearer ${decoded.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ 
      success: true,
      postId: response.data.id,
      message: 'Post created successfully'
    });

  } catch (err) {
    console.error('Post error:', err.response?.data || err.message);
    res.status(500).json({ error: "Failed to publish post" });
  }
}
