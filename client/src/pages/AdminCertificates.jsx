import { Award, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, apiBlob } from "../lib/api.js";

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/users/certificates").then((data) => setCertificates(data.certificates));
  }, []);

  const filteredCertificates = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) return certificates;
    return certificates.filter((certificate) => (
      `${certificate.user_name} ${certificate.user_email} ${certificate.exam_title} ${certificate.certificate_id}`
        .toLowerCase()
        .includes(lowered)
    ));
  }, [certificates, query]);

  async function downloadCertificate(certificate) {
    const blob = await apiBlob(`/users/results/${certificate.id}/certificate`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificate.certificate_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="section py-16">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-byte-maroon">Admin</p>
      <h1 className="mt-4 text-4xl font-black">Member Certificates</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-byte-graphite">
        Review members who passed certification exams and download their issued certificates.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Issued certificates" value={certificates.length} />
        <Stat label="Certified members" value={new Set(certificates.map((item) => item.user_id)).size} />
        <Stat label="Average score" value={`${certificates.length ? Math.round(certificates.reduce((sum, item) => sum + item.score, 0) / certificates.length) : 0}%`} />
      </div>

      <div className="panel mt-6 p-5">
        <label className="relative block">
          <Search className="absolute left-3 top-3.5 text-byte-graphite" size={18} />
          <input
            className="field"
            style={{ paddingLeft: "2.75rem" }}
            placeholder="Search member, email, exam, or certificate ID"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="hidden grid-cols-[1.1fr_1.2fr_1.4fr_110px_160px_170px] border-b border-byte-line bg-byte-black px-4 py-3 text-xs font-bold uppercase tracking-wide text-white lg:grid">
          <span>Member</span>
          <span>Email</span>
          <span>Exam</span>
          <span>Score</span>
          <span>Certificate ID</span>
          <span>Action</span>
        </div>

        {filteredCertificates.map((certificate) => (
          <div key={certificate.id} className="grid gap-3 border-b border-byte-line px-4 py-4 last:border-b-0 lg:grid-cols-[1.1fr_1.2fr_1.4fr_110px_160px_170px] lg:items-center">
            <div>
              <p className="font-bold">{certificate.user_name}</p>
              <p className="text-xs text-byte-graphite">User ID: {certificate.user_id}</p>
            </div>
            <p className="text-sm text-byte-graphite">{certificate.user_email}</p>
            <div>
              <p className="text-sm font-semibold">{certificate.exam_title}</p>
              <p className="text-xs text-byte-graphite">{new Date(certificate.created_at).toLocaleString()}</p>
            </div>
            <p className="flex items-center gap-2 text-2xl font-black text-byte-maroon"><Award size={18} />{certificate.score}%</p>
            <p className="text-sm font-bold">{certificate.certificate_id}</p>
            <button className="btn-secondary w-fit py-2 text-xs" onClick={() => downloadCertificate(certificate)}>
              <Download size={15} />Certificate
            </button>
          </div>
        ))}

        {!filteredCertificates.length && <div className="p-6 text-sm text-byte-graphite">No passed exam certificates found.</div>}
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
