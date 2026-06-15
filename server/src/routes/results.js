import express from "express";
import { authMiddleware, memberOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", authMiddleware, memberOnly, async (req, res) => {
  const results = await req.app.locals.db.all(`
    SELECT exam_results.*, exams.title as exam_title
    FROM exam_results
    JOIN exams ON exams.id = exam_results.exam_id
    WHERE exam_results.user_id = ?
    ORDER BY exam_results.created_at DESC
  `, req.user.id);
  res.json({ results });
});

export default router;
