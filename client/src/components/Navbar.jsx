import { BookOpen, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  ["Home", "/"],
  ["About", "/about"],
  ["Courses", "/courses"],
  ["Seminar", "/seminar"],
  ["Exams", "/exams"]
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-byte-line bg-white/90 backdrop-blur-xl">
      <div className="section flex min-h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-bold tracking-wide">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-byte-black text-white shadow-sm sm:h-10 sm:w-10">
            <BookOpen size={18} />
          </span>
          <span className="text-base sm:text-lg">ByteWorks Academy</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map(([label, href]) => (
            <NavLink key={href} to={href} className={({ isActive }) => `text-sm font-semibold ${isActive ? "text-byte-maroon" : "text-byte-graphite"}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="btn-secondary py-2"><UserRound size={16} />Dashboard</Link>
              <button onClick={handleLogout} className="btn-primary py-2"><LogOut size={16} />Logout</button>
              {user.role === "admin" && (
                <div className="relative">
                  <button
                    className="btn-secondary px-3 py-2"
                    onClick={() => setAdminMenuOpen((value) => !value)}
                    aria-label="Open admin menu"
                  >
                    <Menu size={20} />
                  </button>
                  {adminMenuOpen && (
                    <div className="absolute right-0 top-12 w-56 border border-byte-line bg-white p-2 shadow-enterprise">
                      <Link className="block px-3 py-2 text-sm font-semibold hover:bg-byte-ash" to="/admin" onClick={() => setAdminMenuOpen(false)}>Dashboard Editor</Link>
                      <Link className="block px-3 py-2 text-sm font-semibold hover:bg-byte-ash" to="/admin/members" onClick={() => setAdminMenuOpen(false)}>Members</Link>
                      <Link className="block px-3 py-2 text-sm font-semibold hover:bg-byte-ash" to="/admin/results" onClick={() => setAdminMenuOpen(false)}>Exam Results</Link>
                      <Link className="block px-3 py-2 text-sm font-semibold hover:bg-byte-ash" to="/admin/certificates" onClick={() => setAdminMenuOpen(false)}>Certificates</Link>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-2">Login</Link>
              <Link to="/register" className="btn-primary py-2"><ShieldCheck size={16} />Register</Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-byte-line bg-white md:hidden">
          <div className="section flex flex-col gap-3 py-4">
            {navItems.map(([label, href]) => <Link key={href} to={href} onClick={() => setOpen(false)}>{label}</Link>)}
            {user && <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>}
            {user?.role === "admin" && (
              <>
                <Link to="/admin" onClick={() => setOpen(false)}>Admin Dashboard Editor</Link>
                <Link to="/admin/members" onClick={() => setOpen(false)}>Admin Members</Link>
                <Link to="/admin/results" onClick={() => setOpen(false)}>Admin Exam Results</Link>
                <Link to="/admin/certificates" onClick={() => setOpen(false)}>Admin Certificates</Link>
              </>
            )}
            {user ? <button className="btn-primary" onClick={handleLogout}>Logout</button> : <Link className="btn-primary" to="/login">Login</Link>}
          </div>
        </div>
      )}
    </header>
  );
}
