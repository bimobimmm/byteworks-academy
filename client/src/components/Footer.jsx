export default function Footer() {
  return (
    <footer className="border-t border-byte-line bg-byte-black py-10 text-white">
      <div className="section flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-lg font-bold">ByteWorks Academy</p>
          <p className="mt-2 max-w-xl text-sm text-white/70">Structured database and enterprise IT education for operators, DBAs, and engineers.</p>
        </div>
        <p className="text-sm text-white/60">© 2026 ByteWorks Academy. All rights reserved.</p>
      </div>
    </footer>
  );
}
