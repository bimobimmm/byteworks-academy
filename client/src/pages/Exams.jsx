import { Download, FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiBlob } from "../lib/api.js";

export default function Exams() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api("/exams").then((data) => setExams(data.exams));
  }, []);

  async function downloadCertificate(exam) {
    const blob = await apiBlob(`/results/${exam.latest_result_id}/certificate`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `byteworks-certificate-${exam.latest_result_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Exams</p>
      <h1 className="mt-4 text-4xl font-black">Certification-style Exam</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {exams.map((exam) => (
          <article key={exam.id} className="panel p-6">
            <FileCheck className="text-byte-maroon" size={28} />
            <h2 className="mt-5 text-xl font-bold">{exam.title}</h2>
            <p className="mt-2 text-sm text-byte-graphite">{exam.course_title}</p>
            <p className="mt-4 text-sm font-semibold">Passing score: {exam.passing_score}</p>
            {Number(exam.latest_passed) === 1 ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button className="btn-primary" type="button" onClick={() => downloadCertificate(exam)}><Download size={18} />Download Certificate</button>
                <Link className="btn-secondary" to={`/exams/${exam.id}`}>View Result</Link>
              </div>
            ) : (
              <Link className="btn-primary mt-6" to={`/exams/${exam.id}`}>{exam.latest_result_id ? "Retry Exam" : "Start Exam"}</Link>
            )}
            {exam.latest_result_id && (
              <p className="mt-4 text-xs font-semibold text-byte-graphite">
                Last result: {exam.latest_score}% / {Number(exam.latest_passed) === 1 ? "Passed" : "Not passed"}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
