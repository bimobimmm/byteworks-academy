import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certificateLogoPath = path.join(__dirname, "../assets/byteworks-logo-certificate.jpg");

export function buildCertificateId(result) {
  const year = new Date(result.created_at).getFullYear();
  return `BW-${year}-${String(result.id).padStart(6, "0")}`;
}

export function formatIssuedDate(date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function createCertificatePdf({ result, certificateId, issuedDate }) {
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

  if (fs.existsSync(certificateLogoPath)) {
    doc.image(certificateLogoPath, width - 247, 82, { fit: [162, 112], align: "center", valign: "center" });
  }

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
