import { FileCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Exams() {
  const [exams, setExams] = useState([]);

  useEffect(() => {
    api("/exams").then((data) => setExams(data.exams));
  }, []);

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
            <Link className="btn-primary mt-6" to={`/exams/${exam.id}`}>Start Exam</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
