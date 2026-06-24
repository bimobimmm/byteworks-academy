import express from "express";
import PDFDocument from "pdfkit";
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

function buildCertificateId(result) {
  const year = new Date(result.created_at).getFullYear();
  return `BW-${year}-${String(result.id).padStart(6, "0")}`;
}

function formatIssuedDate(date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function createCertificatePdf({ result, certificateId, issuedDate }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 0 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawCertificate(doc, { result, certificateId, issuedDate });
    doc.end();
  });
}

function drawCertificate(doc, { result, certificateId, issuedDate }) {
  const width = doc.page.width;
  const height = doc.page.height;
  const maroon = "#7a1018";
  const red = "#a01824";
  const black = "#111111";
  const graphite = "#5f5b57";

  doc.rect(0, 0, width, height).fill("#ffffff");
  doc.roundedRect(50, 44, width - 100, height - 88, 26).lineWidth(16).stroke("#f4f4f2");
  doc.roundedRect(62, 56, width - 124, height - 112, 18).lineWidth(1.5).stroke("#dedbd6");

  doc.save();
  doc.rect(62, 56, width - 124, height - 112).clip();
  doc.strokeColor("#eeece8").lineWidth(0.7);
  for (let x = 70; x < width - 80; x += 26) {
    doc.moveTo(x, 70).lineTo(x + 80, height - 80).stroke();
    doc.moveTo(x + 12, 70).lineTo(x - 68, height - 80).stroke();
  }
  doc.restore();

  doc.fillColor(red).font("Helvetica-Bold").fontSize(23).text("BYTEWORKS", 112, 92, { continued: true });
  doc.fillColor(black).text(" ACADEMY");
  doc.fillColor(graphite).font("Helvetica").fontSize(15).text("Database Administrator Academy", 112, 121);

  doc.circle(width - 150, 128, 52).lineWidth(10).stroke("#dedbd6");
  doc.circle(width - 150, 128, 42).lineWidth(2).stroke(maroon);
  doc.fillColor(red).font("Helvetica-Bold").fontSize(13).text("BYTEWORKS", width - 194, 108, { width: 88, align: "center" });
  doc.fillColor(black).font("Helvetica").fontSize(10).text("Certified", width - 194, 130, { width: 88, align: "center" });
  doc.fillColor(black).font("Helvetica-Bold").fontSize(13).text("Associate", width - 194, 149, { width: 88, align: "center" });

  doc.fillColor(black).font("Times-Bold").fontSize(34).text("ByteWorks Certified Associate", 112, 188);
  doc.font("Times-Bold").fontSize(25).text("Certificate of Recognition", 112, 231);

  doc.fillColor(black).font("Helvetica").fontSize(18).text(result.user_name, 112, 305);
  doc.fontSize(17).text(result.exam_title || "Certification Exam", 112, 349);
  doc.fillColor(black).fontSize(16).text(
    "This certifies that the above named has successfully completed the certification assessment by ByteWorks Academy.",
    112,
    414,
    { width: width - 224 }
  );

  doc.fillColor(black).font("Helvetica").fontSize(17).text(formatIssuedDate(issuedDate), 112, 476);
  doc.fillColor(graphite).fontSize(14).text("Date", 112, 507);

  doc.moveTo(402, 481).bezierCurveTo(420, 457, 436, 507, 454, 478).strokeColor(black).lineWidth(2).stroke();
  doc.moveTo(450, 480).bezierCurveTo(470, 455, 487, 507, 510, 474).stroke();
  doc.fillColor(graphite).font("Helvetica").fontSize(15).text("ByteWorks Academy", 398, 507, { width: 190 });
  doc.fillColor(graphite).fontSize(12).text("Authorized Certification Issuer", 398, 529, { width: 190 });

  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(12).text(`Score: ${result.score}%`, width - 206, 476, { width: 120 });
  doc.fillColor(black).font("Helvetica").fontSize(11).text(certificateId, width - 206, 510, { width: 145 });
  doc.fillColor(graphite).fontSize(9).text("Certificate ID", width - 206, 528, { width: 145 });
}

export default router;
