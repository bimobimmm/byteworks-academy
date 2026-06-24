import { ImageUp, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const emptyCourse = { title: "", slug: "", description: "", level: "Beginner", duration: "4 weeks", is_published: true };
const emptyLesson = { title: "", content: "", order_number: 1 };
const emptyExam = { course_id: "", title: "", passing_score: 75 };
const emptyQuestion = { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A" };
const emptySeminar = { poster_data_url: "", poster_fit: "cover", home_hero_data_url: "", home_hero_fit: "cover", registration_url: "https://discord.gg/PHaqJTz9H" };

export default function AdminDashboard() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedExam, setSelectedExam] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [seminarForm, setSeminarForm] = useState(emptySeminar);
  const [seminarStatus, setSeminarStatus] = useState("");
  const [imageChanges, setImageChanges] = useState({ homeHero: false, poster: false });

  async function load() {
    const [courseData, examData, seminarData] = await Promise.all([
      api("/courses/admin/all"),
      api("/exams/admin/all"),
      api("/seminar")
    ]);
    setCourses(courseData.courses);
    setExams(examData.exams);
    setSeminarForm(seminarData.seminar || emptySeminar);
    setImageChanges({ homeHero: false, poster: false });

    if (!selectedCourseId && courseData.courses[0]) setSelectedCourseId(String(courseData.courses[0].id));
    if (!selectedExamId && examData.exams[0]) setSelectedExamId(String(examData.exams[0].id));
  }

  async function loadCourseDetail(courseId) {
    if (!courseId) return;
    const data = await api(`/courses/${courseId}/admin`);
    setSelectedCourse(data);
    setCourseForm({
      title: data.course.title,
      slug: data.course.slug,
      description: data.course.description,
      level: data.course.level,
      duration: data.course.duration,
      is_published: Boolean(data.course.is_published)
    });
    setLessonForm(emptyLesson);
    setEditingLessonId(null);
  }

  async function loadExamDetail(examId) {
    if (!examId) return;
    const data = await api(`/exams/${examId}/admin`);
    setSelectedExam(data);
    setExamForm({
      course_id: data.exam.course_id || "",
      title: data.exam.title,
      passing_score: data.exam.passing_score
    });
    setQuestionForm(emptyQuestion);
    setEditingQuestionId(null);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadCourseDetail(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    loadExamDetail(selectedExamId);
  }, [selectedExamId]);

  async function createCourse(event) {
    event.preventDefault();
    const data = await api("/courses", { method: "POST", body: JSON.stringify(courseForm) });
    setSelectedCourseId(String(data.course.id));
    await load();
  }

  async function saveCourse() {
    if (!selectedCourseId) return;
    await api(`/courses/${selectedCourseId}`, { method: "PUT", body: JSON.stringify(courseForm) });
    await load();
    await loadCourseDetail(selectedCourseId);
  }

  async function removeCourse(id) {
    await api(`/courses/${id}`, { method: "DELETE" });
    setSelectedCourseId("");
    setSelectedCourse(null);
    await load();
  }

  async function saveLesson(event) {
    event.preventDefault();
    if (!selectedCourseId) return;
    const path = editingLessonId ? `/courses/${selectedCourseId}/lessons/${editingLessonId}` : `/courses/${selectedCourseId}/lessons`;
    await api(path, { method: editingLessonId ? "PUT" : "POST", body: JSON.stringify(lessonForm) });
    await loadCourseDetail(selectedCourseId);
    await load();
  }

  async function removeLesson(lessonId) {
    await api(`/courses/${selectedCourseId}/lessons/${lessonId}`, { method: "DELETE" });
    await loadCourseDetail(selectedCourseId);
    await load();
  }

  async function createExam(event) {
    event.preventDefault();
    const data = await api("/exams", { method: "POST", body: JSON.stringify(examForm) });
    setSelectedExamId(String(data.exam.id));
    await load();
  }

  async function saveExam() {
    if (!selectedExamId) return;
    await api(`/exams/${selectedExamId}`, { method: "PUT", body: JSON.stringify(examForm) });
    await load();
    await loadExamDetail(selectedExamId);
  }

  async function removeExam(id) {
    await api(`/exams/${id}`, { method: "DELETE" });
    setSelectedExamId("");
    setSelectedExam(null);
    await load();
  }

  async function saveQuestion(event) {
    event.preventDefault();
    if (!selectedExamId) return;
    const path = editingQuestionId ? `/exams/${selectedExamId}/questions/${editingQuestionId}` : `/exams/${selectedExamId}/questions`;
    await api(path, { method: editingQuestionId ? "PUT" : "POST", body: JSON.stringify(questionForm) });
    await loadExamDetail(selectedExamId);
    await load();
  }

  async function removeQuestion(questionId) {
    await api(`/exams/${selectedExamId}/questions/${questionId}`, { method: "DELETE" });
    await loadExamDetail(selectedExamId);
    await load();
  }

  function handleImageUpload(event, fieldName, readyMessage) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSeminarStatus("Image must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSeminarForm((current) => ({ ...current, [fieldName]: reader.result }));
      setImageChanges((current) => ({ ...current, [fieldName === "home_hero_data_url" ? "homeHero" : "poster"]: true }));
      setSeminarStatus(readyMessage);
    };
    reader.readAsDataURL(file);
  }

  function handleSeminarPoster(event) {
    handleImageUpload(event, "poster_data_url", "Seminar poster is ready to save.");
  }

  function handleHomeHeroImage(event) {
    handleImageUpload(event, "home_hero_data_url", "Homepage hero image is ready to save.");
  }

  async function saveHomeHeroImage() {
    setSeminarStatus("Saving homepage hero image...");
    const payload = { home_hero_fit: seminarForm.home_hero_fit };
    if (imageChanges.homeHero) payload.home_hero_data_url = seminarForm.home_hero_data_url;
    const data = await api("/seminar", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    setSeminarForm(data.seminar);
    setImageChanges((current) => ({ ...current, homeHero: false }));
    setSeminarStatus("Homepage hero image updated.");
  }

  async function saveSeminar(event) {
    event.preventDefault();
    setSeminarStatus("Saving seminar page...");
    const payload = {
      poster_fit: seminarForm.poster_fit,
      registration_url: seminarForm.registration_url
    };
    if (imageChanges.poster) payload.poster_data_url = seminarForm.poster_data_url;
    const data = await api("/seminar", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    setSeminarForm(data.seminar);
    setImageChanges((current) => ({ ...current, poster: false }));
    setSeminarStatus("Seminar page updated.");
  }

  async function removeSeminarPoster() {
    setSeminarStatus("Removing poster...");
    const data = await api("/seminar", {
      method: "PUT",
      body: JSON.stringify({ registration_url: seminarForm.registration_url, remove_poster: true })
    });
    setSeminarForm(data.seminar);
    setImageChanges((current) => ({ ...current, poster: false }));
    setSeminarStatus("Poster removed.");
  }

  async function removeHomeHeroImage() {
    setSeminarStatus("Removing homepage hero image...");
    const data = await api("/seminar", {
      method: "PUT",
      body: JSON.stringify({ registration_url: seminarForm.registration_url, remove_home_hero: true })
    });
    setSeminarForm(data.seminar);
    setImageChanges((current) => ({ ...current, homeHero: false }));
    setSeminarStatus("Homepage hero image removed.");
  }

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Admin</p>
      <h1 className="mt-4 text-4xl font-black">Admin Dashboard</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-byte-graphite">
        Manage course metadata, learning material, certification exams, passing score, and exam questions.
      </p>

      <section className="panel mt-10 p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-2xl font-black">Public Page Images</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-byte-graphite">
              Upload the homepage hero image, seminar poster, and manage the registration link shown on the public seminar page.
            </p>
          </div>
          <a className="btn-secondary py-2" href="/seminar" target="_blank" rel="noreferrer">Open Seminar Page</a>
        </div>

        <form className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_0.72fr_1.1fr]" onSubmit={saveSeminar}>
          <div className="grid content-start gap-3">
            <h3 className="text-lg font-black">Homepage Hero Image</h3>
            <div className="overflow-hidden rounded-md border border-byte-line bg-byte-ash">
              {seminarForm.home_hero_data_url ? (
                <img className={`aspect-[4/3] w-full ${seminarForm.home_hero_fit === "contain" ? "object-contain" : "object-cover"}`} src={seminarForm.home_hero_data_url} alt="Preview homepage hero" />
              ) : (
                <div className="flex aspect-[4/3] min-h-60 flex-col items-center justify-center px-6 text-center">
                  <ImageUp className="text-byte-maroon" size={38} />
                  <p className="mt-4 text-sm font-bold text-byte-black">No hero image uploaded</p>
                </div>
              )}
            </div>
            <label className="grid gap-2 text-sm font-bold">
              Homepage hero
              <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleHomeHeroImage} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Hero image sizing
              <select className="field" value={seminarForm.home_hero_fit || "cover"} onChange={(event) => setSeminarForm({ ...seminarForm, home_hero_fit: event.target.value })}>
                <option value="cover">Fill frame</option>
                <option value="contain">Fit full image</option>
              </select>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn-primary" type="button" onClick={saveHomeHeroImage}><Save size={18} />Save Hero Image</button>
              <button className="btn-secondary" type="button" onClick={removeHomeHeroImage}><X size={18} />Remove Hero Image</button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-byte-line bg-byte-ash">
            {seminarForm.poster_data_url ? (
              <img className={`aspect-[4/5] w-full ${seminarForm.poster_fit === "contain" ? "object-contain" : "object-cover"}`} src={seminarForm.poster_data_url} alt="Preview poster seminar" />
            ) : (
              <div className="flex aspect-[4/5] min-h-72 flex-col items-center justify-center px-6 text-center">
                <ImageUp className="text-byte-maroon" size={38} />
                <p className="mt-4 text-sm font-bold text-byte-black">No poster uploaded</p>
              </div>
            )}
          </div>

          <div className="grid content-start gap-4">
            <h3 className="text-lg font-black">Seminar Page</h3>
            <label className="grid gap-2 text-sm font-bold">
              Seminar poster
              <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSeminarPoster} />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Poster image sizing
              <select className="field" value={seminarForm.poster_fit || "cover"} onChange={(event) => setSeminarForm({ ...seminarForm, poster_fit: event.target.value })}>
                <option value="cover">Fill frame</option>
                <option value="contain">Fit full image</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Registration link
              <input
                className="field"
                placeholder="https://discord.gg/PHaqJTz9H"
                value={seminarForm.registration_url}
                onChange={(event) => setSeminarForm({ ...seminarForm, registration_url: event.target.value })}
              />
            </label>
            {seminarStatus && <p className="text-sm font-semibold text-byte-maroon">{seminarStatus}</p>}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn-primary" type="submit"><Save size={18} />Save Seminar Page</button>
              <button className="btn-secondary" type="button" onClick={removeSeminarPoster}><X size={18} />Remove Poster</button>
            </div>
          </div>
        </form>
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section className="panel p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-black">Course Editor</h2>
            <select className="field md:w-72" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </div>

          <form className="mt-6 grid gap-3" onSubmit={createCourse}>
            <input className="field" placeholder="Course title" value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} />
            <input className="field" placeholder="Slug" value={courseForm.slug} onChange={(event) => setCourseForm({ ...courseForm, slug: event.target.value })} />
            <textarea className="field min-h-28" placeholder="Description" value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="field" value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <input className="field" placeholder="Duration, example: 5 weeks" value={courseForm.duration} onChange={(event) => setCourseForm({ ...courseForm, duration: event.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={courseForm.is_published} onChange={(event) => setCourseForm({ ...courseForm, is_published: event.target.checked })} />
              Published
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn-secondary" type="submit"><Plus size={18} />Create New Course</button>
              <button className="btn-primary" type="button" onClick={saveCourse}><Save size={18} />Save Selected Course</button>
            </div>
          </form>

          <div className="mt-8 border-t border-byte-line pt-6">
            <h3 className="text-xl font-black">Lessons</h3>
            <form className="mt-4 grid gap-3" onSubmit={saveLesson}>
              <input className="field" placeholder="Lesson title" value={lessonForm.title} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} />
              <textarea className="field min-h-28" placeholder="Lesson material/content" value={lessonForm.content} onChange={(event) => setLessonForm({ ...lessonForm, content: event.target.value })} />
              <input className="field" type="number" min="1" placeholder="Order number" value={lessonForm.order_number} onChange={(event) => setLessonForm({ ...lessonForm, order_number: event.target.value })} />
              <button className="btn-primary w-fit"><Save size={18} />{editingLessonId ? "Save Lesson" : "Add Lesson"}</button>
            </form>

            <div className="mt-5 grid gap-3">
              {selectedCourse?.lessons.map((lesson) => (
                <div key={lesson.id} className="border border-byte-line bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-byte-maroon">Module {lesson.order_number}</p>
                      <p className="font-bold">{lesson.title}</p>
                      <p className="mt-2 text-sm leading-6 text-byte-graphite">{lesson.content}</p>
                    </div>
                    <button className="text-byte-maroon" onClick={() => removeLesson(lesson.id)} aria-label="Delete lesson"><Trash2 size={18} /></button>
                  </div>
                  <button className="btn-secondary mt-4 py-2" onClick={() => {
                    setEditingLessonId(lesson.id);
                    setLessonForm({ title: lesson.title, content: lesson.content, order_number: lesson.order_number });
                  }}>Edit Lesson</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-byte-line pt-6">
            <h3 className="text-xl font-black">All Courses</h3>
            <div className="mt-4 grid gap-3">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center justify-between border border-byte-line p-3">
                  <button className="text-left" onClick={() => setSelectedCourseId(String(course.id))}>
                    <p className="font-bold">{course.title}</p>
                    <p className="text-sm text-byte-graphite">{course.level} / {course.duration} / {course.lesson_count} lessons</p>
                  </button>
                  <button className="text-byte-maroon" onClick={() => removeCourse(course.id)} aria-label="Delete course"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-black">Exam Editor</h2>
            <select className="field md:w-72" value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)}>
              <option value="">Select exam</option>
              {exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>
          </div>

          <form className="mt-6 grid gap-3" onSubmit={createExam}>
            <input className="field" placeholder="Exam title" value={examForm.title} onChange={(event) => setExamForm({ ...examForm, title: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <select className="field" value={examForm.course_id} onChange={(event) => setExamForm({ ...examForm, course_id: event.target.value })}>
                <option value="">No course link</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <input className="field" type="number" min="1" max="100" placeholder="Passing score" value={examForm.passing_score} onChange={(event) => setExamForm({ ...examForm, passing_score: event.target.value })} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="btn-secondary" type="submit"><Plus size={18} />Create New Exam</button>
              <button className="btn-primary" type="button" onClick={saveExam}><Save size={18} />Save Selected Exam</button>
            </div>
          </form>

          <div className="mt-8 border-t border-byte-line pt-6">
            <h3 className="text-xl font-black">Questions</h3>
            <form className="mt-4 grid gap-3" onSubmit={saveQuestion}>
              <textarea className="field min-h-24" placeholder="Question" value={questionForm.question} onChange={(event) => setQuestionForm({ ...questionForm, question: event.target.value })} />
              <input className="field" placeholder="Option A" value={questionForm.option_a} onChange={(event) => setQuestionForm({ ...questionForm, option_a: event.target.value })} />
              <input className="field" placeholder="Option B" value={questionForm.option_b} onChange={(event) => setQuestionForm({ ...questionForm, option_b: event.target.value })} />
              <input className="field" placeholder="Option C" value={questionForm.option_c} onChange={(event) => setQuestionForm({ ...questionForm, option_c: event.target.value })} />
              <input className="field" placeholder="Option D" value={questionForm.option_d} onChange={(event) => setQuestionForm({ ...questionForm, option_d: event.target.value })} />
              <select className="field" value={questionForm.correct_answer} onChange={(event) => setQuestionForm({ ...questionForm, correct_answer: event.target.value })}>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
              </select>
              <button className="btn-primary w-fit"><Save size={18} />{editingQuestionId ? "Save Question" : "Add Question"}</button>
            </form>

            <div className="mt-5 grid gap-3">
              {selectedExam?.questions.map((question) => (
                <div key={question.id} className="border border-byte-line bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{question.question}</p>
                      <p className="mt-2 text-sm text-byte-graphite">A. {question.option_a}</p>
                      <p className="text-sm text-byte-graphite">B. {question.option_b}</p>
                      <p className="text-sm text-byte-graphite">C. {question.option_c}</p>
                      <p className="text-sm text-byte-graphite">D. {question.option_d}</p>
                      <p className="mt-2 text-sm font-bold text-byte-maroon">Correct answer: {question.correct_answer}</p>
                    </div>
                    <button className="text-byte-maroon" onClick={() => removeQuestion(question.id)} aria-label="Delete question"><Trash2 size={18} /></button>
                  </div>
                  <button className="btn-secondary mt-4 py-2" onClick={() => {
                    setEditingQuestionId(question.id);
                    setQuestionForm({
                      question: question.question,
                      option_a: question.option_a,
                      option_b: question.option_b,
                      option_c: question.option_c,
                      option_d: question.option_d,
                      correct_answer: question.correct_answer
                    });
                  }}>Edit Question</button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-byte-line pt-6">
            <h3 className="text-xl font-black">All Exams</h3>
            <div className="mt-4 grid gap-3">
              {exams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between border border-byte-line p-3">
                  <button className="text-left" onClick={() => setSelectedExamId(String(exam.id))}>
                    <p className="font-bold">{exam.title}</p>
                    <p className="text-sm text-byte-graphite">{exam.course_title || "No course"} / pass {exam.passing_score} / {exam.question_count} questions</p>
                  </button>
                  <button className="text-byte-maroon" onClick={() => removeExam(exam.id)} aria-label="Delete exam"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
