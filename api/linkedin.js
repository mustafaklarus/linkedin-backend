import axios from "axios";
import jwt from "jsonwebtoken";
import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json({ message: "LinkedIn API working!" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
