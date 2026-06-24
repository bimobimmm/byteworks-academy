import express from "express";
import { buildCertificateId, createCertificatePdf, getCertificateSettings, normalizeCertificateSettings } from "../lib/certificate.js";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

const router = express.Router();

function validateOptionalImageDataUrl(value, label) {
  if (!value) return "";
  if (typeof value !== "string" || !/^data:image\/(png|jpe?g|webp);base64,/i.test(value)) {
    return { error: `${label} must be a PNG, JPG, or WebP image` };
  }
  if (value.length > 2_500_000) {
    return { error: `${label} is too large. Please upload an image below 2 MB.` };
  }
  return value;
}

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
  const db = req.app.locals.db;
  const settings = await getCertificateSettings(db);
  const certificates = await db.all(`
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
      certificate_id: buildCertificateId(certificate, settings)
    }))
  });
});

router.get("/certificate-settings", authMiddleware, adminOnly, async (req, res) => {
  const settings = await getCertificateSettings(req.app.locals.db);
  res.json({ settings });
});

router.put("/certificate-settings", authMiddleware, adminOnly, async (req, res) => {
  const logoDataUrl = validateOptionalImageDataUrl(req.body?.logo_data_url, "Certificate logo");
  if (logoDataUrl?.error) return res.status(400).json({ message: logoDataUrl.error });
  const signatureDataUrl = validateOptionalImageDataUrl(req.body?.signature_data_url, "Signature image");
  if (signatureDataUrl?.error) return res.status(400).json({ message: signatureDataUrl.error });

  const settings = normalizeCertificateSettings({
    ...(req.body || {}),
    logo_data_url: logoDataUrl,
    signature_data_url: signatureDataUrl
  });
  const db = req.app.locals.db;
  await db.run(
    `
      UPDATE certificate_settings
      SET issuer_name = ?, issuer_title = ?, certificate_prefix = ?, logo_data_url = ?, signature_data_url = ?
      WHERE id = 1
    `,
    settings.issuer_name,
    settings.issuer_title,
    settings.certificate_prefix,
    settings.logo_data_url,
    settings.signature_data_url
  );
  res.json({ settings: await getCertificateSettings(db) });
});

router.get("/results/:id/certificate", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const result = await db.get(`
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

  const settings = await getCertificateSettings(db);
  const certificateId = buildCertificateId(result, settings);
  const pdfBuffer = await createCertificatePdf({ result, certificateId, issuedDate: new Date(result.created_at), settings });

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
