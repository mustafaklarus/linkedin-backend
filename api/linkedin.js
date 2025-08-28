import axios from "axios";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ 
      message: "LinkedIn API working!",
      timestamp: new Date().toISOString(),
      endpoints: {
        signin: "/api/auth/linkedin/signin",
        callback: "/api/auth/linkedin/callback", 
        profile: "/api/linkedin/profile",
        post: "/api/linkedin/post"
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
