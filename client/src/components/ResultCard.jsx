import { Award, Download, XCircle } from "lucide-react";
import { apiBlob } from "../lib/api.js";

export default function ResultCard({ result }) {
  const passed = Boolean(result.passed);

  async function downloadCertificate() {
    const blob = await apiBlob(`/results/${result.id}/certificate`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `byteworks-certificate-${result.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col justify-between gap-4 border border-byte-line bg-white p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-semibold">{result.exam_title || "Exam Result"}</p>
        <p className="text-sm text-byte-graphite">{new Date(result.created_at).toLocaleString()}</p>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <div className={`flex items-center gap-2 text-sm font-bold ${passed ? "text-byte-maroon" : "text-byte-graphite"}`}>
          {passed ? <Award size={18} /> : <XCircle size={18} />}
          {result.score}%
        </div>
        {passed && (
          <button className="btn-secondary py-2 text-xs" onClick={downloadCertificate}>
            <Download size={15} />Download Certificate
          </button>
        )}
      </div>
    </div>
  );
}
