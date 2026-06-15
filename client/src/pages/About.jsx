const focus = [
  "Oracle DBA",
  "MySQL DBA",
  "Microsoft SQL Server DBA",
  "PostgreSQL DBA",
  "Backup & Recovery",
  "Replication & High Availability",
  "Performance Tuning",
  "Database Monitoring"
];

export default function About() {
  return (
    <section className="section py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">About</p>
        <h1 className="mt-4 text-4xl font-black">ByteWorks Academy</h1>
        <p className="mt-6 text-lg leading-8 text-byte-graphite">
          ByteWorks Academy is a premium learning platform focused on Database Administrator skills. The curriculum covers Oracle, MySQL, Microsoft SQL Server, and PostgreSQL administration with real operational discipline: clear concepts, repeatable procedures, backup and recovery, monitoring awareness, performance tuning, and exam-based validation.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {focus.map((item) => <div key={item} className="panel p-5 text-sm font-bold transition hover:border-byte-maroon">{item}</div>)}
      </div>
    </section>
  );
}
