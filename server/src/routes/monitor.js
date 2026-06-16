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

function toTimestamp(value) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function relativeTime(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return "--";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString("en-US");
}

router.get("/", requireMonitorToken, async (req, res) => {
  const db = req.app.locals.db;
  const members = await db.get("SELECT COUNT(*) AS count FROM users WHERE role = ?", "member");
  const passedExams = await db.get("SELECT COUNT(*) AS count FROM exam_results WHERE passed = 1");
  const totalExamResults = await db.get("SELECT COUNT(*) AS count FROM exam_results");
  const courses = await db.all(
    "SELECT id, title, slug, description, level, duration FROM courses WHERE is_published = 1 ORDER BY id"
  );
  const memberUsers = await db.all(
    "SELECT id, name, email, role, created_at FROM users WHERE role = ? ORDER BY created_at DESC",
    "member"
  );
  const resultRows = await db.all(`
    SELECT
      exam_results.id,
      exam_results.user_id,
      exam_results.exam_id,
      exam_results.score,
      exam_results.passed,
      exam_results.created_at,
      exams.title AS exam_title,
      courses.id AS course_id,
      courses.title AS course_title
    FROM exam_results
    JOIN exams ON exams.id = exam_results.exam_id
    LEFT JOIN courses ON courses.id = exams.course_id
    ORDER BY exam_results.created_at DESC
  `);

  const resultsByUser = new Map();
  const resultsByCourse = new Map();
  for (const row of resultRows) {
    if (!resultsByUser.has(row.user_id)) resultsByUser.set(row.user_id, []);
    resultsByUser.get(row.user_id).push(row);

    if (row.course_id) {
      if (!resultsByCourse.has(row.course_id)) resultsByCourse.set(row.course_id, []);
      resultsByCourse.get(row.course_id).push(row);
    }
  }

  const learners = memberUsers.map((user) => {
    const userResults = resultsByUser.get(user.id) || [];
    const latestResult = userResults[0];
    const passedCount = userResults.filter((row) => Number(row.passed) === 1).length;
    const averageScore = userResults.length
      ? Math.round(userResults.reduce((sum, row) => sum + Number(row.score || 0), 0) / userResults.length)
      : 0;
    const progress = latestResult ? Number(latestResult.score || 0) : 0;
    const lastActivity = latestResult?.created_at || user.created_at;
    const inactiveDays = lastActivity ? (Date.now() - toTimestamp(lastActivity)) / 86400000 : 999;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      course: latestResult?.course_title || "No exam activity yet",
      progress,
      score: latestResult ? Number(latestResult.score || 0) : 0,
      averageScore,
      passedExams: passedCount,
      status: inactiveDays <= 7 ? "Active" : "Need Attention",
      lastLogin: relativeTime(lastActivity),
      lastActivityAt: lastActivity,
      active: inactiveDays <= 7,
    };
  });

  const coursesWithCompletion = courses.map((course) => {
    const courseResults = resultsByCourse.get(course.id) || [];
    const completion = courseResults.length
      ? Math.round(courseResults.reduce((sum, row) => sum + Number(row.score || 0), 0) / courseResults.length)
      : 0;
    return {
      ...course,
      completion,
      examResults: courseResults.length,
      passedExams: courseResults.filter((row) => Number(row.passed) === 1).length,
    };
  });

  const feed = resultRows.slice(0, 8).map((row) => {
    const user = memberUsers.find((memberUser) => Number(memberUser.id) === Number(row.user_id));
    return {
      time: relativeTime(row.created_at),
      createdAt: row.created_at,
      message: `${user?.name || "A learner"} ${Number(row.passed) === 1 ? "passed" : "submitted"} ${row.exam_title} with score ${row.score}`,
    };
  });

  res.json({
    service: "ByteWorks Academy",
    updatedAt: new Date().toISOString(),
    metrics: {
      members: Number(members?.count || 0),
      activeToday: learners.filter((learner) => isToday(learner.lastActivityAt)).length,
      activeMembers: learners.filter((learner) => learner.active).length,
      passedExams: Number(passedExams?.count || 0),
      totalExamResults: Number(totalExamResults?.count || 0),
      publishedCourses: courses.length,
    },
    courses: coursesWithCompletion,
    members: learners,
    learners,
    feed,
  });
});

export default router;
