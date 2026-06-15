import { Award, BookOpen, LineChart } from "lucide-react";
import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard.jsx";
import ResultCard from "../components/ResultCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    api("/courses").then((data) => setCourses(data.courses));
    api("/results/me").then((data) => setResults(data.results));
  }, []);

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Member Dashboard</p>
      <h1 className="mt-4 text-4xl font-black">Welcome, {user?.name}</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="panel p-6"><BookOpen className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">{courses.length}</p><p className="text-sm text-byte-graphite">Available courses</p></div>
        <div className="panel p-6"><LineChart className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">35%</p><p className="text-sm text-byte-graphite">Dummy learning progress</p></div>
        <div className="panel p-6"><Award className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">Certificate</p><p className="text-sm text-byte-graphite">Placeholder ready</p></div>
      </div>
      <h2 className="mt-12 text-2xl font-black">Courses</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.slice(0, 3).map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
      <h2 className="mt-12 text-2xl font-black">Exam Result</h2>
      <div className="mt-5 grid gap-3">
        {results.length ? results.map((result) => <ResultCard key={result.id} result={result} />) : <div className="panel p-6 text-byte-graphite">No exam results yet.</div>}
      </div>
    </section>
  );
}
