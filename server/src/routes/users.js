import express from "express";
import { buildCertificateId, createCertificatePdf } from "../lib/certificate.js";
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

router.get("/certificates", authMiddleware, adminOnly, async (req, res) => {
  const certificates = await req.app.locals.db.all(`
    SELECT
      exam_results.*,
      users.name as user_name,
      users.email as user_email,
      exams.title as exam_title,
      courses.title as course_title
    FROM exam_results
    JOIN users ON users.id = exam_results.user_id
    JOIN exams ON exams.id = exam_results.exam_id
    LEFT JOIN courses ON courses.id = exams.course_id
    WHERE exam_results.passed = 1
    ORDER BY exam_results.created_at DESC
  `);

  res.json({
    certificates: certificates.map((certificate) => ({
      ...certificate,
      certificate_id: buildCertificateId(certificate)
    }))
  });
});

router.get("/results/:id/certificate", authMiddleware, adminOnly, async (req, res) => {
  const result = await req.app.locals.db.get(`
    SELECT
      exam_results.*,
      users.name as user_name,
      users.email as user_email,
      exams.title as exam_title,
      courses.title as course_title
    FROM exam_results
    JOIN users ON users.id = exam_results.user_id
    JOIN exams ON exams.id = exam_results.exam_id
    LEFT JOIN courses ON courses.id = exams.course_id
    WHERE exam_results.id = ? AND exam_results.passed = 1
  `, req.params.id);

  if (!result) return res.status(404).json({ message: "Certificate not found" });

  const certificateId = buildCertificateId(result);
  const pdfBuffer = await createCertificatePdf({ result, certificateId, issuedDate: new Date(result.created_at) });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${certificateId}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  res.send(pdfBuffer);
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
