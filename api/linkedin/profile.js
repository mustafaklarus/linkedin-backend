const axios = require('axios');
const jwt = require('jsonwebtoken');

export default async function handler(req, res) {
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

    // Get fresh profile data
    const profileResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { 
        Authorization: `Bearer ${decoded.accessToken}` 
      }
    });

    res.status(200).json({
      success: true,
      profile: {
        id: profileResponse.data.id,
        firstName: profileResponse.data.localizedFirstName,
        lastName: profileResponse.data.localizedLastName
      }
    });

  } catch (err) {
    console.error('Profile error:', err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}
