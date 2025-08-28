export default function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const redirectUri = encodeURIComponent(
      "https://linkedin-backend-wheat.vercel.app/api/auth/linkedin/callback"
    );

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;

    // Return JSON instead of redirect for API usage
    res.status(200).json({ 
      authUrl: authUrl,
      success: true 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
}
