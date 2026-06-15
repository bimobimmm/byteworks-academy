import { ArrowRight, Lock, ServerCog, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function CourseCard({ course }) {
  const { user } = useAuth();
  return (
    <article className="panel group flex min-h-[290px] flex-col justify-between overflow-hidden p-6 transition hover:-translate-y-1 hover:border-byte-maroon">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-byte-maroon"><ServerCog size={20} /></span>
          <span className="rounded-full border border-byte-line px-3 py-1 text-xs font-bold uppercase text-byte-graphite">{course.level}</span>
        </div>
        <h3 className="text-xl font-bold">{course.title}</h3>
        <p className="mt-3 text-sm leading-6 text-byte-graphite">{course.description}</p>
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-byte-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-byte-graphite">{course.duration}</span>
        {user ? (
          <Link className="btn-primary py-2" to={`/courses/${course.id}`}><Unlock size={16} />Open Material</Link>
        ) : (
          <Link className="btn-secondary py-2" to="/locked"><Lock size={16} />Join to Unlock <ArrowRight size={15} /></Link>
        )}
      </div>
    </article>
  );
}
