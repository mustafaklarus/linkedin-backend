const crypto = require('crypto');

export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const state = crypto.randomBytes(32).toString('hex');
    
    // Set state cookie
    res.setHeader('Set-Cookie', `linkedin_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=None; Secure`);

    const baseUrl = `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;
    
    const linkedinAuthURL = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent('r_liteprofile r_emailaddress w_member_social')}`;

    res.status(200).json({ 
      authUrl: linkedinAuthURL,
      state: state 
    });

  } catch (error) {
    console.error('LinkedIn signin error:', error);
    res.status(500).json({ error: 'Failed to initiate LinkedIn signin' });
  }
}
