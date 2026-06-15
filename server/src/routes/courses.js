import express from "express";
import { adminOnly, authMiddleware, memberOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const courses = await req.app.locals.db.all("SELECT * FROM courses WHERE is_published = 1 ORDER BY id");
  res.json({ courses });
});

router.get("/admin/all", authMiddleware, adminOnly, async (req, res) => {
  const courses = await req.app.locals.db.all(`
    SELECT courses.*, COUNT(lessons.id) as lesson_count
    FROM courses
    LEFT JOIN lessons ON lessons.course_id = courses.id
    GROUP BY courses.id
    ORDER BY courses.id
  `);
  res.json({ courses });
});

router.get("/:id", authMiddleware, memberOnly, async (req, res) => {
  const db = req.app.locals.db;
  const course = await db.get("SELECT * FROM courses WHERE id = ?", req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const lessons = await db.all("SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number", req.params.id);
  res.json({ course, lessons, progress: 35 });
});

router.get("/:id/admin", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const course = await db.get("SELECT * FROM courses WHERE id = ?", req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const lessons = await db.all("SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number", req.params.id);
  res.json({ course, lessons });
});

router.post("/", authMiddleware, adminOnly, async (req, res) => {
  const { title, slug, description, level, duration, is_published = 1 } = req.body;
  const result = await req.app.locals.db.run(
    "INSERT INTO courses (title, slug, description, level, duration, is_published) VALUES (?, ?, ?, ?, ?, ?)",
    title,
    slug,
    description,
    level,
    duration,
    is_published ? 1 : 0
  );
  const course = await req.app.locals.db.get("SELECT * FROM courses WHERE id = ?", result.lastID);
  res.status(201).json({ course });
});

router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { title, slug, description, level, duration, is_published = 1 } = req.body;
  await req.app.locals.db.run(
    "UPDATE courses SET title = ?, slug = ?, description = ?, level = ?, duration = ?, is_published = ? WHERE id = ?",
    title,
    slug,
    description,
    level,
    duration,
    is_published ? 1 : 0,
    req.params.id
  );
  const course = await req.app.locals.db.get("SELECT * FROM courses WHERE id = ?", req.params.id);
  res.json({ course });
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  await req.app.locals.db.run("DELETE FROM courses WHERE id = ?", req.params.id);
  res.status(204).end();
});

router.post("/:id/lessons", authMiddleware, adminOnly, async (req, res) => {
  const { title, content, order_number } = req.body;
  const db = req.app.locals.db;
  const course = await db.get("SELECT id FROM courses WHERE id = ?", req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const result = await db.run(
    "INSERT INTO lessons (course_id, title, content, order_number) VALUES (?, ?, ?, ?)",
    req.params.id,
    title,
    content,
    Number(order_number) || 1
  );
  const lesson = await db.get("SELECT * FROM lessons WHERE id = ?", result.lastID);
  res.status(201).json({ lesson });
});

router.put("/:id/lessons/:lessonId", authMiddleware, adminOnly, async (req, res) => {
  const { title, content, order_number } = req.body;
  const db = req.app.locals.db;
  await db.run(
    "UPDATE lessons SET title = ?, content = ?, order_number = ? WHERE id = ? AND course_id = ?",
    title,
    content,
    Number(order_number) || 1,
    req.params.lessonId,
    req.params.id
  );
  const lesson = await db.get("SELECT * FROM lessons WHERE id = ? AND course_id = ?", req.params.lessonId, req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });
  res.json({ lesson });
});

router.delete("/:id/lessons/:lessonId", authMiddleware, adminOnly, async (req, res) => {
  await req.app.locals.db.run("DELETE FROM lessons WHERE id = ? AND course_id = ?", req.params.lessonId, req.params.id);
  res.status(204).end();
});

export default router;
