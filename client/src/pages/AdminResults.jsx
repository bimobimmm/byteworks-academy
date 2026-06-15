import { Award, ChevronLeft, ChevronRight, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";

const pageSize = 10;

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api("/users").then((data) => setResults(data.results));
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    const reload = () => api("/users").then((data) => setResults(data.results));
    const channel = supabase
      .channel("admin-exam-results")
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_results" }, reload)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredResults = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return results.filter((result) => {
      const matchesQuery = !lowered || `${result.user_name} ${result.exam_title}`.toLowerCase().includes(lowered);
      const matchesStatus = statusFilter === "all" || (statusFilter === "passed" ? result.passed : !result.passed);
      return matchesQuery && matchesStatus;
    });
  }, [results, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / pageSize));
  const pageResults = filteredResults.slice((page - 1) * pageSize, page * pageSize);
  const passedCount = results.filter((result) => result.passed).length;
  const failedCount = results.length - passedCount;
  const averageScore = results.length ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length) : 0;

  function changeFilter(next) {
    next();
    setPage(1);
  }

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Admin</p>
      <h1 className="mt-4 text-4xl font-black">Member Exam Results</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-byte-graphite">Search, filter, and review certification exam attempts submitted by members.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat label="Total attempts" value={results.length} />
        <Stat label="Passed" value={passedCount} />
        <Stat label="Not passed" value={failedCount} />
        <Stat label="Average score" value={`${averageScore}%`} />
      </div>

      <div className="panel mt-6 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="relative block">
            <Search className="absolute left-3 top-3.5 text-byte-graphite" size={18} />
            <input
              className="field"
              style={{ paddingLeft: "2.75rem" }}
              placeholder="Search member or exam"
              value={query}
              onChange={(event) => changeFilter(() => setQuery(event.target.value))}
            />
          </label>
          <select className="field" value={statusFilter} onChange={(event) => changeFilter(() => setStatusFilter(event.target.value))}>
            <option value="all">All statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Not passed</option>
          </select>
        </div>
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="hidden grid-cols-[80px_1.2fr_1.5fr_120px_140px_180px] border-b border-byte-line bg-byte-black px-4 py-3 text-xs font-bold uppercase tracking-wide text-white lg:grid">
          <span>ID</span>
          <span>Member</span>
          <span>Exam</span>
          <span>Score</span>
          <span>Status</span>
          <span>Submitted</span>
        </div>

        {pageResults.map((result) => (
          <div key={result.id} className="grid gap-3 border-b border-byte-line px-4 py-4 last:border-b-0 lg:grid-cols-[80px_1.2fr_1.5fr_120px_140px_180px] lg:items-center">
            <p className="text-sm font-bold">#{result.id}</p>
            <div>
              <p className="font-bold">{result.user_name}</p>
              <p className="text-xs text-byte-graphite">User ID: {result.user_id}</p>
            </div>
            <p className="text-sm font-semibold">{result.exam_title}</p>
            <p className="text-2xl font-black text-byte-maroon">{result.score}%</p>
            <p className={`flex w-fit items-center gap-2 border border-byte-line px-3 py-1 text-xs font-bold uppercase ${result.passed ? "text-byte-maroon" : "text-byte-graphite"}`}>
              {result.passed ? <Award size={16} /> : <XCircle size={16} />}
              {result.passed ? "Passed" : "Failed"}
            </p>
            <p className="text-sm text-byte-graphite">{new Date(result.created_at).toLocaleString()}</p>
          </div>
        ))}

        {!pageResults.length && <div className="p-6 text-sm text-byte-graphite">No exam results match the current filter.</div>}
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-byte-graphite">Showing {pageResults.length} of {filteredResults.length} results</p>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-3 py-2" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button>
          <span className="px-3 text-sm font-bold">Page {page} / {totalPages}</span>
          <button className="btn-secondary px-3 py-2" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-3xl font-black text-byte-maroon">{value}</p>
      <p className="mt-1 text-sm font-semibold text-byte-graphite">{label}</p>
    </div>
  );
}
