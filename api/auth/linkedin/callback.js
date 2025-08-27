const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `LinkedIn auth error: ${error}` });
  }

  try {
    // Verify state
    const cookies = cookie.parse(req.headers.cookie || '');
    const storedState = cookies.linkedin_state;

    if (!state || state !== storedState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    const baseUrl = `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    const profile = profileResponse.data;

    // Create JWT
    const userToken = jwt.sign({
      linkedinId: profile.id,
      firstName: profile.localizedFirstName,
      lastName: profile.localizedLastName,
      accessToken: access_token,
      tokenExpiry: Date.now() + (expires_in * 1000)
    }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set auth cookie
    res.setHeader('Set-Cookie', [
      `auth_token=${userToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=None; Secure`,
      `linkedin_state=; HttpOnly; Path=/; Max-Age=0; SameSite=None; Secure`
    ]);

    // Return success response instead of redirect
    res.status(200).json({
      success: true,
      user: {
        id: profile.id,
        firstName: profile.localizedFirstName,
        lastName: profile.localizedLastName
      }
    });

  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
