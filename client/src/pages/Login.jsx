import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="section flex min-h-[620px] items-center justify-center py-16">
      <form onSubmit={submit} className="panel w-full max-w-md p-7">
        <h1 className="text-3xl font-black">Login</h1>
        <p className="mt-2 text-sm text-byte-graphite">Access ByteWorks member content and exams.</p>
        <div className="mt-7 grid gap-4">
          <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-byte-maroon">{error}</p>}
        <button className="btn-primary mt-6 w-full">Login</button>
        <p className="mt-5 text-sm">No account? <Link className="font-bold text-byte-maroon" to="/register">Register</Link></p>
      </form>
    </section>
  );
}
