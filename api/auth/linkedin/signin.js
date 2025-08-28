export default function handler(req, res) {
  const redirectUri = encodeURIComponent(
    "https://linkedin-backend-wheat.vercel.app/api/auth/linkedin/callback"
  );

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=r_liteprofile%20r_emailaddress%20w_member_social`;

  res.redirect(authUrl);
}
