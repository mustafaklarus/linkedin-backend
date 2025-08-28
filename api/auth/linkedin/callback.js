import axios from 'axios';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `LinkedIn auth error: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://linkedin-backend-wheat.vercel.app/api/auth/linkedin/callback",
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user profile using current LinkedIn API v2
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const profile = profileResponse.data;

    // Create JWT token
    const token = jwt.sign({
      linkedinId: profile.sub,
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      accessToken: access_token,
      tokenExpiry: Date.now() + (expires_in * 1000)
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `session=${token}; HttpOnly; Secure; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=None`,
    ]);

    // Return success response
    res.status(200).json({
      success: true,
      user: {
        id: profile.sub,
        firstName: profile.given_name,
        lastName: profile.family_name,
        email: profile.email
      }
    });

  } catch (err) {
    console.error('Callback error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: "LinkedIn authentication failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
