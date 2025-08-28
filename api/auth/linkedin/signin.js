export default function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const redirectUri = encodeURIComponent(
      "https://linkedin-backend-wheat.vercel.app/api/auth/linkedin/callback"
    );

    // Updated LinkedIn OAuth scopes (current API v2)
    const scopes = [
      'openid',
      'profile',
      'email',
      'w_member_social'
    ].join(' ');

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}`;

    // Return JSON instead of redirect for API usage
    res.status(200).json({ 
      authUrl: authUrl,
      success: true,
      scopes: scopes
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
}
