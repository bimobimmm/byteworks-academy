import { Award, XCircle } from "lucide-react";

export default function ResultCard({ result }) {
  const passed = Boolean(result.passed);
  return (
    <div className="flex items-center justify-between border border-byte-line bg-white p-4">
      <div>
        <p className="font-semibold">{result.exam_title || "Exam Result"}</p>
        <p className="text-sm text-byte-graphite">{new Date(result.created_at).toLocaleString()}</p>
      </div>
      <div className={`flex items-center gap-2 text-sm font-bold ${passed ? "text-byte-maroon" : "text-byte-graphite"}`}>
        {passed ? <Award size={18} /> : <XCircle size={18} />}
        {result.score}%
      </div>
    </div>
  );
}
