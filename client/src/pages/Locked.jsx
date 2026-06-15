import { LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";

export default function Locked() {
  return (
    <section className="section flex min-h-[620px] items-center justify-center py-16">
      <div className="panel max-w-2xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-byte-black text-white">
          <LockKeyhole size={30} />
        </div>
        <h1 className="mt-6 text-3xl font-black">This content is for ByteWorks Members</h1>
        <p className="mt-4 text-byte-graphite">Create an account or login to access full learning material and exams.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="btn-secondary" to="/login">Login</Link>
          <Link className="btn-primary" to="/register">Register</Link>
        </div>
      </div>
    </section>
  );
}
