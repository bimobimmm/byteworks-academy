import { CheckCircle2, Coffee, Download, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ExamQuestionCard from "../components/ExamQuestionCard.jsx";
import { api, apiBlob } from "../lib/api.js";

export default function ExamDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(900);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/exams/${id}`).then(setData);
  }, [id]);

  useEffect(() => {
    if (!started || result) return undefined;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [started, result]);

  async function submit() {
    setError("");
    try {
      const response = await api(`/exams/${id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      setResult(response);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  async function downloadCertificate(resultId) {
    const blob = await apiBlob(`/results/${resultId}/certificate`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `byteworks-certificate-${resultId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!data) return <section className="section py-16">Loading exam...</section>;

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  const passedResult = Number(data.latestResult?.passed) === 1 ? data.latestResult : null;

  if (passedResult) {
    return (
      <section className="section flex min-h-[620px] items-center justify-center py-16">
        <div className="panel max-w-3xl p-8">
          <p className="eyebrow">Exam Completed</p>
          <h1 className="mt-4 text-4xl font-black">{data.exam.title}</h1>
          <p className="mt-4 text-byte-graphite">
            You already passed this exam with a score of {passedResult.score}%. Retaking is locked so your certificate history stays clean.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" type="button" onClick={() => downloadCertificate(passedResult.id)}><Download size={18} />Download Certificate</button>
            <Link className="btn-secondary" to="/dashboard">View Result</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!started && !result) {
    return (
      <section className="section flex min-h-[680px] items-center justify-center py-16">
        <div className="panel max-w-3xl p-8">
          <p className="eyebrow">Before You Start</p>
          <h1 className="mt-4 text-4xl font-black">{data.exam.title}</h1>
          <p className="mt-4 text-byte-graphite">
            Take a moment before the timer starts. Relax, prepare your notes mentally, and make sure you are ready to focus.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-byte-line bg-byte-ash p-5">
              <Coffee className="text-byte-maroon" size={26} />
              <p className="mt-4 font-bold">Drink first</p>
              <p className="mt-2 text-sm leading-6 text-byte-graphite">Grab water or coffee before the countdown begins.</p>
            </div>
            <div className="border border-byte-line bg-byte-ash p-5">
              <Timer className="text-byte-maroon" size={26} />
              <p className="mt-4 font-bold">15 minutes</p>
              <p className="mt-2 text-sm leading-6 text-byte-graphite">The exam timer starts only after you click start.</p>
            </div>
            <div className="border border-byte-line bg-byte-ash p-5">
              <ShieldCheck className="text-byte-maroon" size={26} />
              <p className="mt-4 font-bold">Passing score {data.exam.passing_score}</p>
              <p className="mt-2 text-sm leading-6 text-byte-graphite">Answer carefully. You can submit when finished.</p>
            </div>
          </div>

          <div className="mt-8 border-y border-byte-line py-5">
            {[
              `${data.questions.length} multiple-choice questions`,
              "Choose one answer for each question",
              "Exam results are saved after submit"
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 py-2 text-sm font-semibold">
                <CheckCircle2 className="text-byte-maroon" size={18} />
                {item}
              </p>
            ))}
          </div>

          <button className="btn-primary mt-8" onClick={() => setStarted(true)}>
            {data.latestResult ? "Retry Exam" : "Start Exam"}
          </button>
          {data.latestResult && (
            <p className="mt-4 text-sm font-semibold text-byte-graphite">
              Last attempt: {data.latestResult.score}% / Not passed / {new Date(data.latestResult.created_at).toLocaleString()}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="section py-16">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Online Exam</p>
          <h1 className="mt-3 text-4xl font-black">{data.exam.title}</h1>
        </div>
        <div className="flex items-center gap-2 border border-byte-line bg-white px-4 py-3 font-bold">
          <Timer size={18} /> {minutes}:{rest}
        </div>
      </div>

      <div className="grid gap-5">
        {data.questions.map((question) => (
          <ExamQuestionCard key={question.id} question={question} value={answers[question.id]} onChange={(questionId, value) => setAnswers({ ...answers, [questionId]: value })} />
        ))}
      </div>

      {result ? (
        <div className="panel mt-8 p-6">
          <h2 className="text-2xl font-black">Score: {result.score}%</h2>
          <p className="mt-2 font-semibold">{result.passed ? "Passed" : "Not passed"} / Passing score {result.passingScore}</p>
          {result.passed && (
            <button className="btn-primary mt-5" type="button" onClick={() => downloadCertificate(result.resultId)}><Download size={18} />Download Certificate</button>
          )}
        </div>
      ) : (
        <>
          {error && <p className="mt-6 text-sm font-semibold text-byte-maroon">{error}</p>}
          <button onClick={submit} className="btn-primary mt-8">Submit Answers</button>
        </>
      )}
    </section>
  );
}
