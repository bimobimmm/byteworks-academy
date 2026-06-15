import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function signToken(user) {
  return jwt.sign(publicUser(user), process.env.JWT_SECRET || "byteworks_dev_secret", { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required" });

  const db = req.app.locals.db;
  const existing = await db.get("SELECT id FROM users WHERE email = ?", email.toLowerCase());
  if (existing) return res.status(409).json({ message: "Email is already registered" });

  const result = await db.run(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'member')",
    name,
    email.toLowerCase(),
    await bcrypt.hash(password, 10)
  );
  const user = await db.get("SELECT id, name, email, role FROM users WHERE id = ?", result.lastID);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;
  const user = await db.get("SELECT * FROM users WHERE email = ?", email?.toLowerCase());

  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authMiddleware, async (req, res) => {
  const db = req.app.locals.db;
  const user = await db.get("SELECT id, name, email, role FROM users WHERE id = ?", req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

export default router;
