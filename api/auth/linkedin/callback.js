import axios from "axios";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { code } = req.query;

  try {
    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri:
            "https://linkedin-backend-wheat.vercel.app/api/auth/linkedin/callback",
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const { access_token } = response.data;

    // Sign JWT with LinkedIn token
    const token = jwt.sign({ access_token }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Save JWT in cookie
    res.setHeader(
      "Set-Cookie",
      `session=${token}; HttpOnly; Secure; Path=/; Max-Age=3600`
    );

    // Redirect back to frontend dashboard
    res.redirect("https://your-frontend-domain.com/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "LinkedIn auth failed" });
  }
}
