import { Award, Download, ImageUp, Save, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, apiBlob } from "../lib/api.js";

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState({
    issuer_name: "ByteWorks Academy",
    issuer_title: "Authorized Certification Issuer",
    certificate_prefix: "BW",
    logo_data_url: "",
    signature_data_url: ""
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    Promise.all([
      api("/users/certificates"),
      api("/users/certificate-settings")
    ]).then(([certificateData, settingsData]) => {
      setCertificates(certificateData.certificates);
      setSettings(settingsData.settings);
    });
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

  function readImageFile(file, field) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSettings((current) => ({ ...current, [field]: reader.result }));
    reader.readAsDataURL(file);
  }

  async function saveSettings(event) {
    event.preventDefault();
    setStatus("Saving certificate settings...");
    const data = await api("/users/certificate-settings", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
    setSettings(data.settings);
    const certificateData = await api("/users/certificates");
    setCertificates(certificateData.certificates);
    setStatus("Certificate settings saved.");
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

      <form className="panel mt-6 grid gap-6 p-6 lg:grid-cols-[1fr_1fr]" onSubmit={saveSettings}>
        <div className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black">Certificate Settings</h2>
            <p className="mt-2 text-sm leading-6 text-byte-graphite">Customize the issuer, certificate ID prefix, logo, and signature used in generated member certificates.</p>
          </div>
          <label className="grid gap-2 text-sm font-bold">
            Issuer name
            <input className="field" value={settings.issuer_name} onChange={(event) => setSettings({ ...settings, issuer_name: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Issuer title
            <input className="field" value={settings.issuer_title} onChange={(event) => setSettings({ ...settings, issuer_title: event.target.value })} />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Certificate prefix
            <input className="field" value={settings.certificate_prefix} onChange={(event) => setSettings({ ...settings, certificate_prefix: event.target.value })} />
          </label>
          {status && <p className="text-sm font-semibold text-byte-maroon">{status}</p>}
          <button className="btn-primary w-fit" type="submit"><Save size={18} />Save Certificate Settings</button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <ImageSetting
            label="Certificate logo"
            image={settings.logo_data_url}
            emptyText="Using default ByteWorks logo"
            onUpload={(file) => readImageFile(file, "logo_data_url")}
            onRemove={() => setSettings({ ...settings, logo_data_url: "" })}
          />
          <ImageSetting
            label="Signature image"
            image={settings.signature_data_url}
            emptyText="Using generated signature line"
            onUpload={(file) => readImageFile(file, "signature_data_url")}
            onRemove={() => setSettings({ ...settings, signature_data_url: "" })}
          />
        </div>
      </form>

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

function ImageSetting({ label, image, emptyText, onUpload, onRemove }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md border border-byte-line bg-byte-ash p-4">
        {image ? (
          <img className="max-h-full max-w-full object-contain" src={image} alt={label} />
        ) : (
          <div className="text-center text-sm font-semibold text-byte-graphite">
            <ImageUp className="mx-auto mb-3 text-byte-maroon" size={32} />
            {emptyText}
          </div>
        )}
      </div>
      <input className="field" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onUpload(event.target.files?.[0])} />
      <button className="btn-secondary w-fit py-2 text-xs" type="button" onClick={onRemove}><X size={15} />Remove</button>
    </div>
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
