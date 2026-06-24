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
  const lastOpenedCourse = await db.get(`
    SELECT
      courses.id as course_id,
      courses.title as course_title,
      course_activity.opened_at,
      lessons.id as lesson_id,
      lessons.title as lesson_title,
      lessons.order_number as lesson_order
    FROM course_activity
    JOIN courses ON courses.id = course_activity.course_id
    LEFT JOIN lessons ON lessons.id = course_activity.last_lesson_id
    WHERE course_activity.user_id = ? AND courses.is_published = 1
    ORDER BY course_activity.opened_at DESC
    LIMIT 1
  `, req.user.id);
  const lastCompletedLesson = await db.get(`
    SELECT
      courses.id as course_id,
      courses.title as course_title,
      lessons.id as lesson_id,
      lessons.title as lesson_title,
      lessons.order_number as lesson_order,
      lesson_progress.updated_at
    FROM lesson_progress
    JOIN courses ON courses.id = lesson_progress.course_id
    JOIN lessons ON lessons.id = lesson_progress.lesson_id
    WHERE lesson_progress.user_id = ? AND lesson_progress.completed = 1 AND courses.is_published = 1
    ORDER BY lesson_progress.updated_at DESC
    LIMIT 1
  `, req.user.id);
  const latestExam = await db.get(`
    SELECT exam_results.*, exams.title as exam_title
    FROM exam_results
    JOIN exams ON exams.id = exam_results.exam_id
    WHERE exam_results.user_id = ?
    ORDER BY exam_results.created_at DESC
    LIMIT 1
  `, req.user.id);
  const nextLesson = await db.get(`
    SELECT
      courses.id as course_id,
      courses.title as course_title,
      lessons.id as lesson_id,
      lessons.title as lesson_title,
      lessons.order_number as lesson_order
    FROM courses
    JOIN lessons ON lessons.course_id = courses.id
    LEFT JOIN lesson_progress
      ON lesson_progress.lesson_id = lessons.id
      AND lesson_progress.user_id = ?
      AND lesson_progress.completed = 1
    WHERE courses.is_published = 1 AND lesson_progress.lesson_id IS NULL
    ORDER BY
      CASE WHEN courses.id = ? THEN 0 ELSE 1 END,
      courses.id,
      lessons.order_number
    LIMIT 1
  `, req.user.id, lastOpenedCourse?.course_id || 0);

  res.json({
    progress: {
      totalCourses: Number(courseStats?.total_courses || 0),
      totalLessons,
      completedLessons,
      learningProgress,
      lastOpenedCourse: lastOpenedCourse || null,
      lastCompletedLesson: lastCompletedLesson || null,
      latestExam: latestExam || null,
      recommendation: buildRecommendation({ nextLesson, latestExam, completedLessons, totalLessons })
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
  const firstLessonId = lessons[0]?.id || null;
  await db.run(
    `
      INSERT INTO course_activity (user_id, course_id, last_lesson_id, opened_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, course_id) DO UPDATE SET
        last_lesson_id = COALESCE(course_activity.last_lesson_id, excluded.last_lesson_id),
        opened_at = CURRENT_TIMESTAMP
      RETURNING user_id
    `,
    req.user.id,
    req.params.id,
    firstLessonId
  );
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
  await db.run(
    `
      INSERT INTO course_activity (user_id, course_id, last_lesson_id, opened_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, course_id) DO UPDATE SET
        last_lesson_id = excluded.last_lesson_id,
        opened_at = CURRENT_TIMESTAMP
      RETURNING user_id
    `,
    req.user.id,
    req.params.id,
    req.params.lessonId
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

function buildRecommendation({ nextLesson, latestExam, completedLessons, totalLessons }) {
  if (nextLesson) {
    return {
      type: "lesson",
      title: "Continue Learning",
      description: `Continue Module ${nextLesson.lesson_order} in ${nextLesson.course_title}.`,
      course_id: nextLesson.course_id,
      lesson_id: nextLesson.lesson_id,
      action_label: "Continue Course"
    };
  }

  if (totalLessons > 0 && completedLessons >= totalLessons && latestExam && !Number(latestExam.passed)) {
    return {
      type: "exam",
      title: "Retake Exam",
      description: `Your latest score in ${latestExam.exam_title} was ${latestExam.score}%. Retake it when ready.`,
      exam_id: latestExam.exam_id,
      action_label: "Retake Exam"
    };
  }

  return {
    type: "complete",
    title: "All Learning Completed",
    description: "You have completed all available lessons. Review your certificates or explore new courses when they are published.",
    action_label: "View Certificates"
  };
}

export default router;
