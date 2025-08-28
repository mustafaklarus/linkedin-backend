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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    // Get fresh profile data using current API
    const profileResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { 
        Authorization: `Bearer ${decoded.accessToken}` 
      }
    });

    res.status(200).json({
      success: true,
      profile: {
        id: profileResponse.data.sub,
        firstName: profileResponse.data.given_name,
        lastName: profileResponse.data.family_name,
        email: profileResponse.data.email,
        picture: profileResponse.data.picture
      }
    });

  } catch (err) {
    console.error('Profile error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: "Failed to fetch profile",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
