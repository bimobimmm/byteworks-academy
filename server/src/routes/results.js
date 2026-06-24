import express from "express";
import { buildCertificateId, createCertificatePdf } from "../lib/certificate.js";
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

router.get("/:id/certificate", authMiddleware, memberOnly, async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.get(`
    SELECT
      exam_results.*,
      users.name as user_name,
      exams.title as exam_title,
      courses.title as course_title
    FROM exam_results
    JOIN users ON users.id = exam_results.user_id
    JOIN exams ON exams.id = exam_results.exam_id
    LEFT JOIN courses ON courses.id = exams.course_id
    WHERE exam_results.id = ? AND exam_results.user_id = ?
  `, req.params.id, req.user.id);

  if (!result) return res.status(404).json({ message: "Certificate result not found" });
  if (!Number(result.passed)) return res.status(403).json({ message: "Certificate is only available for passed exams" });

  const certificateId = buildCertificateId(result);
  const issuedDate = new Date(result.created_at);
  const pdfBuffer = await createCertificatePdf({ result, certificateId, issuedDate });
  const filename = `${certificateId}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  res.send(pdfBuffer);
});

export default router;
