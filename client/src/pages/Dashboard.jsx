import { ArrowRight, Award, BookOpen, CheckCircle2, ClipboardCheck, LineChart, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CourseCard from "../components/CourseCard.jsx";
import ResultCard from "../components/ResultCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState({ totalCourses: 0, totalLessons: 0, completedLessons: 0, learningProgress: 0 });

  useEffect(() => {
    api("/courses").then((data) => setCourses(data.courses));
    api("/results/me").then((data) => setResults(data.results));
    api("/courses/progress/me").then((data) => setProgress(data.progress));
  }, []);

  const passedExamIds = new Set(results.filter((result) => Boolean(result.passed)).map((result) => result.exam_id));

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Member Dashboard</p>
      <h1 className="mt-4 text-4xl font-black">Welcome, {user?.name}</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="panel p-6"><BookOpen className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">{courses.length}</p><p className="text-sm text-byte-graphite">Available courses</p></div>
        <div className="panel p-6"><LineChart className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">{progress.learningProgress}%</p><p className="text-sm text-byte-graphite">{progress.completedLessons}/{progress.totalLessons} lessons completed</p></div>
        <div className="panel p-6"><Award className="text-byte-maroon" /><p className="mt-4 text-2xl font-black">{passedExamIds.size}</p><p className="text-sm text-byte-graphite">Certificates earned</p></div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-50 text-byte-maroon">
              <PlayCircle size={23} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-byte-maroon">Recommended Next Step</p>
              <h2 className="mt-2 text-2xl font-black">{progress.recommendation?.title || "Continue Learning"}</h2>
              <p className="mt-3 text-sm leading-6 text-byte-graphite">{progress.recommendation?.description || "Open a course to start tracking your learning progress."}</p>
              <ContinueAction recommendation={progress.recommendation} courses={courses} />
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <InfoPanel
            icon={BookOpen}
            title="Last Opened Course"
            primary={progress.lastOpenedCourse?.course_title || "No course opened yet"}
            secondary={progress.lastOpenedCourse?.lesson_title ? `Module ${progress.lastOpenedCourse.lesson_order} - ${progress.lastOpenedCourse.lesson_title}` : "Open a course to start here"}
            to={progress.lastOpenedCourse?.course_id ? `/courses/${progress.lastOpenedCourse.course_id}` : null}
          />
          <InfoPanel
            icon={CheckCircle2}
            title="Last Completed Lesson"
            primary={progress.lastCompletedLesson?.course_title || "No completed lessons yet"}
            secondary={progress.lastCompletedLesson?.lesson_title ? `Module ${progress.lastCompletedLesson.lesson_order} - ${progress.lastCompletedLesson.lesson_title}` : "Complete a lesson to update this card"}
            to={progress.lastCompletedLesson?.course_id ? `/courses/${progress.lastCompletedLesson.course_id}` : null}
          />
        </section>
      </div>

      <section className="panel mt-8 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-red-50 text-byte-maroon">
              <ClipboardCheck size={23} />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-byte-maroon">Latest Exam</p>
              <h2 className="mt-2 text-2xl font-black">{progress.latestExam?.exam_title || "No exam attempts yet"}</h2>
              <p className="mt-2 text-sm text-byte-graphite">
                {progress.latestExam ? `${progress.latestExam.score}% / ${progress.latestExam.passed ? "Passed" : "Not passed"} / ${new Date(progress.latestExam.created_at).toLocaleString()}` : "Take an exam when you are ready for certification assessment."}
              </p>
            </div>
          </div>
          {progress.latestExam && <Link className="btn-secondary w-full md:w-auto" to="/exams">View Exams <ArrowRight size={16} /></Link>}
        </div>
      </section>

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

function ContinueAction({ recommendation, courses }) {
  if (recommendation?.type === "lesson" && recommendation.course_id) {
    return <Link className="btn-primary mt-5 w-full sm:w-auto" to={`/courses/${recommendation.course_id}`}>{recommendation.action_label}<ArrowRight size={16} /></Link>;
  }

  if (recommendation?.type === "exam" && recommendation.exam_id) {
    return <Link className="btn-primary mt-5 w-full sm:w-auto" to={`/exams/${recommendation.exam_id}`}>{recommendation.action_label}<ArrowRight size={16} /></Link>;
  }

  const firstCourse = courses[0];
  return firstCourse ? (
    <Link className="btn-primary mt-5 w-full sm:w-auto" to={`/courses/${firstCourse.id}`}>Start Learning <ArrowRight size={16} /></Link>
  ) : (
    <Link className="btn-secondary mt-5 w-full sm:w-auto" to="/courses">Explore Courses <ArrowRight size={16} /></Link>
  );
}

function InfoPanel({ icon: Icon, title, primary, secondary, to }) {
  const content = (
    <div className="panel p-5 transition hover:border-byte-maroon">
      <Icon className="text-byte-maroon" size={24} />
      <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-byte-maroon">{title}</p>
      <h3 className="mt-2 text-lg font-black">{primary}</h3>
      <p className="mt-2 text-sm leading-6 text-byte-graphite">{secondary}</p>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}
