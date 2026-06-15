import express from "express";

const router = express.Router();

function requireMonitorToken(req, res, next) {
  const expectedToken = String(process.env.MONITOR_TOKEN || "").trim();
  const providedToken = String(req.headers["x-monitor-token"] || "").trim();

  if (!expectedToken) {
    return res.status(503).json({ message: "Monitor token is not configured." });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({ message: "Invalid monitor token." });
  }

  return next();
}

router.get("/", requireMonitorToken, async (req, res) => {
  const db = req.app.locals.db;
  const members = await db.get("SELECT COUNT(*) AS count FROM users WHERE role = ?", "member");
  const passedExams = await db.get("SELECT COUNT(*) AS count FROM exam_results WHERE passed = 1");
  const totalExamResults = await db.get("SELECT COUNT(*) AS count FROM exam_results");
  const courses = await db.all(
    "SELECT id, title, slug, description, level, duration FROM courses WHERE is_published = 1 ORDER BY id"
  );

  res.json({
    service: "ByteWorks Academy",
    updatedAt: new Date().toISOString(),
    metrics: {
      members: Number(members?.count || 0),
      passedExams: Number(passedExams?.count || 0),
      totalExamResults: Number(totalExamResults?.count || 0),
      publishedCourses: courses.length,
    },
    courses,
  });
});

export default router;
