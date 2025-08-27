const jwt = require('jsonwebtoken');
const axios = require('axios');

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, visibility = 'PUBLIC' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Post content is required' });
    }

    const cookies = require('cookie').parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (Date.now() > decoded.tokenExpiry) {
      return res.status(401).json({ error: 'LinkedIn token expired' });
    }

    // Create LinkedIn post
    const postData = {
      author: `urn:li:person:${decoded.linkedinId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility
      }
    };

    const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
      headers: {
        'Authorization': `Bearer ${decoded.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    res.status(200).json({
      success: true,
      postId: response.data.id,
      message: 'Post created successfully'
    });

  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ 
      error: error.response?.data?.message || 'Failed to create post' 
    });
  }
}
