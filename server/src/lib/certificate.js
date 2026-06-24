import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const certificateLogoPath = path.join(__dirname, "../assets/byteworks-logo-certificate.jpg");

export const defaultCertificateSettings = {
  issuer_name: "ByteWorks Academy",
  issuer_title: "Authorized Certification Issuer",
  certificate_prefix: "BW",
  logo_data_url: "",
  signature_data_url: ""
};

export function normalizeCertificateSettings(settings = {}) {
  const prefix = String(settings.certificate_prefix || defaultCertificateSettings.certificate_prefix)
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);

  return {
    issuer_name: String(settings.issuer_name || defaultCertificateSettings.issuer_name).trim().slice(0, 90) || defaultCertificateSettings.issuer_name,
    issuer_title: String(settings.issuer_title || defaultCertificateSettings.issuer_title).trim().slice(0, 90) || defaultCertificateSettings.issuer_title,
    certificate_prefix: prefix || defaultCertificateSettings.certificate_prefix,
    logo_data_url: settings.logo_data_url || "",
    signature_data_url: settings.signature_data_url || ""
  };
}

export async function getCertificateSettings(db) {
  const settings = await db.get("SELECT issuer_name, issuer_title, certificate_prefix, logo_data_url, signature_data_url FROM certificate_settings WHERE id = 1");
  return normalizeCertificateSettings(settings);
}

export function buildCertificateId(result, settings = defaultCertificateSettings) {
  const year = new Date(result.created_at).getFullYear();
  const normalized = normalizeCertificateSettings(settings);
  return `${normalized.certificate_prefix}-${year}-${String(result.id).padStart(6, "0")}`;
}

export function formatIssuedDate(date) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

export function createCertificatePdf({ result, certificateId, issuedDate, settings = defaultCertificateSettings }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 0 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawCertificate(doc, { result, certificateId, issuedDate, settings: normalizeCertificateSettings(settings) });
    doc.end();
  });
}

function imageSourceFromDataUrl(dataUrl) {
  const match = /^data:image\/(?:png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl || "");
  return match ? Buffer.from(match[1], "base64") : null;
}

function drawCertificate(doc, { result, certificateId, issuedDate, settings }) {
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

  const uploadedLogo = imageSourceFromDataUrl(settings.logo_data_url);
  if (uploadedLogo) {
    doc.image(uploadedLogo, width - 247, 82, { fit: [162, 112], align: "center", valign: "center" });
  } else if (fs.existsSync(certificateLogoPath)) {
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

  const uploadedSignature = imageSourceFromDataUrl(settings.signature_data_url);
  if (uploadedSignature) {
    doc.image(uploadedSignature, 398, 456, { fit: [162, 45], align: "left", valign: "center" });
  } else {
    doc.moveTo(402, 481).bezierCurveTo(420, 457, 436, 507, 454, 478).strokeColor(black).lineWidth(2).stroke();
    doc.moveTo(450, 480).bezierCurveTo(470, 455, 487, 507, 510, 474).stroke();
  }
  doc.fillColor(graphite).font("Helvetica").fontSize(15).text(settings.issuer_name, 398, 507, { width: 190 });
  doc.fillColor(graphite).fontSize(12).text(settings.issuer_title, 398, 529, { width: 190 });

  doc.fillColor(maroon).font("Helvetica-Bold").fontSize(12).text(`Score: ${result.score}%`, width - 206, 476, { width: 120 });
  doc.fillColor(black).font("Helvetica").fontSize(11).text(certificateId, width - 206, 510, { width: 145 });
  doc.fillColor(graphite).fontSize(9).text("Certificate ID", width - 206, 528, { width: 145 });
}
