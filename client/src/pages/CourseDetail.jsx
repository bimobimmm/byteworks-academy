import { BookOpenCheck, CheckCircle2, ClipboardCheck, PlayCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function CourseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [lessonWork, setLessonWork] = useState({});

  useEffect(() => {
    api(`/courses/${id}`).then((response) => {
      setData(response);
      setActiveLessonId(response.lessons[0]?.id || null);
      const saved = localStorage.getItem(`byteworks_course_work_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setLessonWork(parsed.lessonWork || {});
        setCompletedLessons(parsed.completedLessons || []);
      }
    });
  }, [id]);

  if (!data) return <section className="section py-16">Loading course...</section>;

  const activeLesson = data.lessons.find((lesson) => lesson.id === activeLessonId) || data.lessons[0];
  const currentWork = lessonWork[activeLesson.id] || { notes: "", checked: {}, saved: false };
  const progress = data.lessons.length ? Math.round((completedLessons.length / data.lessons.length) * 100) : 0;
  const practiceTasks = getPracticeTasks(data.course.title, activeLesson);
  const checkedCount = practiceTasks.filter((task) => currentWork.checked?.[task]).length;
  const canComplete = currentWork.saved && currentWork.notes.trim().length >= 20 && checkedCount === practiceTasks.length;

  function persist(nextLessonWork, nextCompletedLessons = completedLessons) {
    localStorage.setItem(
      `byteworks_course_work_${id}`,
      JSON.stringify({ lessonWork: nextLessonWork, completedLessons: nextCompletedLessons })
    );
  }

  function updateCurrentWork(nextWork) {
    const nextLessonWork = { ...lessonWork, [activeLesson.id]: nextWork };
    setLessonWork(nextLessonWork);
    persist(nextLessonWork);
  }

  function toggleTask(task) {
    updateCurrentWork({
      ...currentWork,
      saved: false,
      checked: {
        ...currentWork.checked,
        [task]: !currentWork.checked?.[task]
      }
    });
  }

  function saveWork() {
    updateCurrentWork({ ...currentWork, saved: true });
  }

  function markComplete() {
    if (!activeLesson || completedLessons.includes(activeLesson.id) || !canComplete) return;
    const nextCompletedLessons = [...completedLessons, activeLesson.id];
    setCompletedLessons(nextCompletedLessons);
    persist(lessonWork, nextCompletedLessons);
  }

  return (
    <section className="section py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">{data.course.level} / {data.course.duration}</p>
          <h1 className="mt-4 text-4xl font-black">{data.course.title}</h1>
          <p className="mt-5 text-lg leading-8 text-byte-graphite">{data.course.description}</p>

          <div className="panel mt-10 p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-bold text-byte-maroon">Module {activeLesson.order_number}</p>
                <h2 className="mt-2 text-2xl font-black">{activeLesson.title}</h2>
              </div>
              {completedLessons.includes(activeLesson.id) && (
                <span className="flex items-center gap-2 text-sm font-bold text-byte-maroon">
                  <CheckCircle2 size={18} /> Completed
                </span>
              )}
            </div>
            <div className="mt-6 border-y border-byte-line py-6">
              <p className="text-base leading-8 text-byte-graphite">{activeLesson.content}</p>
              <p className="mt-5 text-sm leading-6 text-byte-graphite">
                Study the concept, take notes, and repeat the operational steps until you can explain the DBA workflow clearly. Certification exams are available separately from the Exams menu after you finish learning.
              </p>
            </div>

            <div className="mt-7 grid gap-6">
              <div>
                <h3 className="text-lg font-black">Practice Checklist</h3>
                <div className="mt-4 grid gap-3">
                  {practiceTasks.map((task) => (
                    <label key={task} className="flex cursor-pointer items-start gap-3 border border-byte-line bg-byte-ash p-4">
                      <input
                        className="mt-1"
                        type="checkbox"
                        checked={Boolean(currentWork.checked?.[task])}
                        onChange={() => toggleTask(task)}
                      />
                      <span className="text-sm leading-6">{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black">Your DBA Notes</h3>
                <textarea
                  className="field mt-4 min-h-40"
                  placeholder="Tulis hasil belajar, langkah operasional, command/query penting, atau rencana troubleshooting dari module ini."
                  value={currentWork.notes}
                  onChange={(event) => updateCurrentWork({ ...currentWork, saved: false, notes: event.target.value })}
                />
                <p className="mt-2 text-xs text-byte-graphite">Minimal 20 karakter dan semua checklist harus selesai sebelum module bisa ditandai complete.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-byte-line pt-6 sm:flex-row">
              <button className="btn-secondary" onClick={saveWork}>
                <Save size={18} /> Save Work
              </button>
              <button className={`btn-primary ${canComplete ? "" : "cursor-not-allowed opacity-50"}`} onClick={markComplete} disabled={!canComplete}>
                <BookOpenCheck size={18} /> Mark Lesson Complete
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {data.lessons.map((lesson) => {
              const isActive = lesson.id === activeLesson.id;
              const isCompleted = completedLessons.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  className={`border p-5 text-left transition ${isActive ? "border-byte-maroon bg-white shadow-enterprise" : "border-byte-line bg-white hover:border-byte-maroon"}`}
                  onClick={() => setActiveLessonId(lesson.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-byte-maroon">Module {lesson.order_number}</p>
                    {isCompleted ? <CheckCircle2 className="text-byte-maroon" size={18} /> : <PlayCircle className="text-byte-graphite" size={18} />}
                  </div>
                  <h3 className="mt-2 text-lg font-bold">{lesson.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-byte-graphite">{lesson.content}</p>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="panel h-fit p-6">
          <ClipboardCheck className="text-byte-maroon" size={30} />
          <h2 className="mt-5 text-xl font-bold">Learning Progress</h2>
          <div className="mt-5 h-3 bg-byte-line">
            <div className="h-3 bg-byte-maroon" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold">{progress}% completed</p>
          <div className="mt-6 border-t border-byte-line pt-5">
            <p className="text-sm font-bold">Course mode</p>
            <p className="mt-2 text-sm leading-6 text-byte-graphite">
              Work through the checklist and notes for each module. Use the Exams menu only when you are ready for certification assessment.
            </p>
          </div>
          <div className="mt-5 border-t border-byte-line pt-5">
            <p className="text-sm font-bold">Active module work</p>
            <p className="mt-2 text-sm text-byte-graphite">{checkedCount}/{practiceTasks.length} checklist done</p>
            <p className="mt-1 text-sm text-byte-graphite">{currentWork.notes.trim().length} note characters</p>
            <p className="mt-1 text-sm text-byte-graphite">{currentWork.saved ? "Saved" : "Not saved yet"}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function getPracticeTasks(courseTitle, lesson) {
  const platform = courseTitle.replace(" Administration", "").replace(" Fundamental", "");

  if (lesson.order_number === 1) {
    return [
      `Identify the main services or processes used by ${platform}.`,
      "Write the default connection method, admin tool, or client utility.",
      "List three daily checks a DBA should perform before business hours."
    ];
  }

  if (lesson.order_number === 2) {
    return [
      "Map the user, role, schema, and storage concepts from this module.",
      "Write one backup command, maintenance command, or operational query you would verify.",
      "Define one monitoring metric that indicates database health."
    ];
  }

  return [
    "Create a short incident scenario related to this database platform.",
    "Write the first three troubleshooting steps you would perform.",
    "Write the recovery or prevention action you would document after resolution."
  ];
}
