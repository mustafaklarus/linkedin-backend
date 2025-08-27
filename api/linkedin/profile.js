const jwt = require('jsonwebtoken');
const axios = require('axios');

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = require('cookie').parse(req.headers.cookie || '');
    const token = cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (Date.now() > decoded.tokenExpiry) {
      return res.status(401).json({ error: 'LinkedIn token expired' });
    }

    // Get fresh profile data
    const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${decoded.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const profile = profileResponse.data;

    res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
