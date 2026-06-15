import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="section flex min-h-[620px] items-center justify-center py-16">
      <form onSubmit={submit} className="panel w-full max-w-md p-7">
        <h1 className="text-3xl font-black">Register</h1>
        <p className="mt-2 text-sm text-byte-graphite">Default role is member.</p>
        <div className="mt-7 grid gap-4">
          <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="mt-4 text-sm font-semibold text-byte-maroon">{error}</p>}
        <button className="btn-primary mt-6 w-full">Create Account</button>
        <p className="mt-5 text-sm">Already registered? <Link className="font-bold text-byte-maroon" to="/login">Login</Link></p>
      </form>
    </section>
  );
}
