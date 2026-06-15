import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard.jsx";
import { api } from "../lib/api.js";

export default function Courses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api("/courses").then((data) => setCourses(data.courses));
  }, []);

  return (
    <section className="section py-16">
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-byte-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Courses</p>
          <h1 className="mt-4 text-4xl font-black">DBA Learning Paths</h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-byte-graphite">Guest users can browse the catalog. Full course lessons are reserved for ByteWorks members; certification exams are available from the Exams menu.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </section>
  );
}
