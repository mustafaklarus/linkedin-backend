import axios from "axios";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie?.split("session=")[1];
    if (!cookie) return res.status(401).json({ error: "Not logged in" });

    const { access_token } = jwt.verify(cookie, process.env.JWT_SECRET);

    const profileRes = await axios.get(
      "https://api.linkedin.com/v2/me",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    res.json(profileRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}
