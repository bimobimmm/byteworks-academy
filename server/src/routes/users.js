import express from "express";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const users = await db.all("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
  const results = await db.all(`
    SELECT exam_results.*, users.name as user_name, exams.title as exam_title
    FROM exam_results
    JOIN users ON users.id = exam_results.user_id
    JOIN exams ON exams.id = exam_results.exam_id
    ORDER BY exam_results.created_at DESC
  `);
  res.json({ users, results });
});

router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { name, email, role } = req.body;
  const db = req.app.locals.db;
  await db.run(
    "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
    name,
    email?.toLowerCase(),
    role,
    req.params.id
  );
  const user = await db.get("SELECT id, name, email, role, created_at FROM users WHERE id = ?", req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  if (Number(req.params.id) === Number(req.user.id)) {
    return res.status(400).json({ message: "Admin cannot delete the active account" });
  }
  await req.app.locals.db.run("DELETE FROM users WHERE id = ?", req.params.id);
  res.status(204).end();
});

export default router;
