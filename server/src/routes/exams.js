import express from "express";
import { adminOnly, authMiddleware, memberOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, memberOnly, async (req, res) => {
  const exams = await req.app.locals.db.all(`
    SELECT
      exams.*,
      courses.title as course_title,
      exam_results.id as latest_result_id,
      exam_results.score as latest_score,
      exam_results.passed as latest_passed,
      exam_results.created_at as latest_result_at
    FROM exams
    LEFT JOIN courses ON courses.id = exams.course_id
    LEFT JOIN exam_results ON exam_results.exam_id = exams.id AND exam_results.user_id = ?
    ORDER BY exams.id
  `, req.user.id);
  res.json({ exams });
});

router.get("/admin/all", authMiddleware, adminOnly, async (req, res) => {
  const exams = await req.app.locals.db.all(`
    SELECT exams.*, courses.title as course_title, COUNT(questions.id) as question_count
    FROM exams
    LEFT JOIN courses ON courses.id = exams.course_id
    LEFT JOIN questions ON questions.exam_id = exams.id
    GROUP BY exams.id, courses.title
    ORDER BY exams.id
  `);
  res.json({ exams });
});

router.get("/:id", authMiddleware, memberOnly, async (req, res) => {
  const db = req.app.locals.db;
  const exam = await db.get("SELECT * FROM exams WHERE id = ?", req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  const latestResult = await db.get(
    "SELECT id, score, passed, created_at FROM exam_results WHERE exam_id = ? AND user_id = ?",
    req.params.id,
    req.user.id
  );
  const questions = await db.all(
    "SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE exam_id = ? ORDER BY id",
    req.params.id
  );
  res.json({ exam, questions, latestResult: latestResult || null });
});

router.get("/:id/admin", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const exam = await db.get("SELECT * FROM exams WHERE id = ?", req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  const questions = await db.all("SELECT * FROM questions WHERE exam_id = ? ORDER BY id", req.params.id);
  res.json({ exam, questions });
});

router.post("/", authMiddleware, adminOnly, async (req, res) => {
  const { course_id, title, passing_score = 75 } = req.body;
  const result = await req.app.locals.db.run(
    "INSERT INTO exams (course_id, title, passing_score) VALUES (?, ?, ?)",
    course_id || null,
    title,
    Number(passing_score) || 75
  );
  const exam = await req.app.locals.db.get("SELECT * FROM exams WHERE id = ?", result.lastID);
  res.status(201).json({ exam });
});

router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { course_id, title, passing_score = 75 } = req.body;
  const db = req.app.locals.db;
  await db.run(
    "UPDATE exams SET course_id = ?, title = ?, passing_score = ? WHERE id = ?",
    course_id || null,
    title,
    Number(passing_score) || 75,
    req.params.id
  );
  const exam = await db.get("SELECT * FROM exams WHERE id = ?", req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  res.json({ exam });
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  await req.app.locals.db.run("DELETE FROM exams WHERE id = ?", req.params.id);
  res.status(204).end();
});

router.post("/:id/questions", authMiddleware, adminOnly, async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  const db = req.app.locals.db;
  const exam = await db.get("SELECT id FROM exams WHERE id = ?", req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });
  const result = await db.run(
    "INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
    req.params.id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer
  );
  const createdQuestion = await db.get("SELECT * FROM questions WHERE id = ?", result.lastID);
  res.status(201).json({ question: createdQuestion });
});

router.put("/:id/questions/:questionId", authMiddleware, adminOnly, async (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  const db = req.app.locals.db;
  await db.run(
    "UPDATE questions SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_answer = ? WHERE id = ? AND exam_id = ?",
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    req.params.questionId,
    req.params.id
  );
  const updatedQuestion = await db.get("SELECT * FROM questions WHERE id = ? AND exam_id = ?", req.params.questionId, req.params.id);
  if (!updatedQuestion) return res.status(404).json({ message: "Question not found" });
  res.json({ question: updatedQuestion });
});

router.delete("/:id/questions/:questionId", authMiddleware, adminOnly, async (req, res) => {
  await req.app.locals.db.run("DELETE FROM questions WHERE id = ? AND exam_id = ?", req.params.questionId, req.params.id);
  res.status(204).end();
});

router.post("/:id/submit", authMiddleware, memberOnly, async (req, res) => {
  const { answers = {} } = req.body;
  const db = req.app.locals.db;
  const exam = await db.get("SELECT * FROM exams WHERE id = ?", req.params.id);
  if (!exam) return res.status(404).json({ message: "Exam not found" });

  const existingResult = await db.get(
    "SELECT id, score, passed, created_at FROM exam_results WHERE exam_id = ? AND user_id = ?",
    req.params.id,
    req.user.id
  );
  if (Number(existingResult?.passed) === 1) {
    return res.status(409).json({
      message: "You already passed this exam. Download the certificate from your result page.",
      resultId: existingResult.id,
      score: existingResult.score,
      passed: true,
      passingScore: exam.passing_score
    });
  }

  const questions = await db.all("SELECT id, correct_answer FROM questions WHERE exam_id = ?", req.params.id);
  if (!questions.length) return res.status(400).json({ message: "This exam has no questions yet" });
  const correct = questions.filter((question) => answers[question.id] === question.correct_answer).length;
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= exam.passing_score;

  await db.run(
    `
      INSERT INTO exam_results (user_id, exam_id, score, passed)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, exam_id) DO UPDATE SET
        score = excluded.score,
        passed = excluded.passed,
        created_at = CURRENT_TIMESTAMP
    `,
    req.user.id,
    req.params.id,
    score,
    passed ? 1 : 0
  );
  const savedResult = await db.get(
    "SELECT id FROM exam_results WHERE exam_id = ? AND user_id = ?",
    req.params.id,
    req.user.id
  );

  res.json({ resultId: savedResult.id, score, passed, passingScore: exam.passing_score, total: questions.length, correct });
});

export default router;
