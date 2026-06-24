import express from "express";
import { adminOnly, authMiddleware, memberOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const courses = await req.app.locals.db.all("SELECT * FROM courses WHERE is_published = 1 ORDER BY id");
  res.json({ courses });
});

router.get("/progress/me", authMiddleware, memberOnly, async (req, res) => {
  const db = req.app.locals.db;
  const courseStats = await db.get(`
    SELECT COUNT(DISTINCT courses.id) as total_courses, COUNT(lessons.id) as total_lessons
    FROM courses
    LEFT JOIN lessons ON lessons.course_id = courses.id
    WHERE courses.is_published = 1
  `);
  const completedStats = await db.get(`
    SELECT COUNT(*) as completed_lessons
    FROM lesson_progress
    JOIN courses ON courses.id = lesson_progress.course_id
    WHERE lesson_progress.user_id = ? AND lesson_progress.completed = 1 AND courses.is_published = 1
  `, req.user.id);

  const totalLessons = Number(courseStats?.total_lessons || 0);
  const completedLessons = Number(completedStats?.completed_lessons || 0);
  const learningProgress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  res.json({
    progress: {
      totalCourses: Number(courseStats?.total_courses || 0),
      totalLessons,
      completedLessons,
      learningProgress
    }
  });
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
  const progressRows = await db.all(
    "SELECT lesson_id, notes, checked_json, saved, completed FROM lesson_progress WHERE user_id = ? AND course_id = ?",
    req.user.id,
    req.params.id
  );
  const lessonWork = {};
  const completedLessonIds = [];

  for (const row of progressRows) {
    const lessonId = String(row.lesson_id);
    if (Number(row.completed) === 1) completedLessonIds.push(row.lesson_id);
    lessonWork[lessonId] = {
      notes: row.notes || "",
      checked: parseCheckedJson(row.checked_json),
      saved: Boolean(row.saved)
    };
  }

  res.json({ course, lessons, progress: { completedLessonIds, lessonWork } });
});

router.put("/:id/progress/:lessonId", authMiddleware, memberOnly, async (req, res) => {
  const db = req.app.locals.db;
  const lesson = await db.get("SELECT id FROM lessons WHERE id = ? AND course_id = ?", req.params.lessonId, req.params.id);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const notes = typeof req.body.notes === "string" ? req.body.notes : "";
  const checked = req.body.checked && typeof req.body.checked === "object" ? req.body.checked : {};
  const saved = req.body.saved ? 1 : 0;
  const completed = req.body.completed ? 1 : 0;

  await db.run(
    `
      INSERT INTO lesson_progress (user_id, course_id, lesson_id, notes, checked_json, saved, completed, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET
        course_id = excluded.course_id,
        notes = excluded.notes,
        checked_json = excluded.checked_json,
        saved = excluded.saved,
        completed = excluded.completed,
        updated_at = CURRENT_TIMESTAMP
      RETURNING user_id
    `,
    req.user.id,
    req.params.id,
    req.params.lessonId,
    notes,
    JSON.stringify(checked),
    saved,
    completed
  );

  const progress = await db.get(
    "SELECT lesson_id, notes, checked_json, saved, completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?",
    req.user.id,
    req.params.lessonId
  );

  res.json({
    progress: {
      lesson_id: progress.lesson_id,
      notes: progress.notes || "",
      checked: parseCheckedJson(progress.checked_json),
      saved: Boolean(progress.saved),
      completed: Boolean(progress.completed)
    }
  });
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

function parseCheckedJson(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export default router;
