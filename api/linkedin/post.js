import axios from 'axios';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    // Create LinkedIn post using current API format
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
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    res.status(200).json({ 
      success: true,
      postId: response.data.id,
      message: 'Post created successfully'
    });

  } catch (err) {
    console.error('Post error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to publish post",
      details: process.env.NODE_ENV === 'development' ? err.response?.data || err.message : undefined
    });
  }
}
