import { ArrowRight, BadgeCheck, ImageUp, LockKeyhole, Server, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

const paths = ["Oracle DBA", "MySQL DBA", "Microsoft SQL Server DBA", "PostgreSQL DBA"];

export default function Home() {
  const [homeHero, setHomeHero] = useState({ image: "", fit: "cover" });

  useEffect(() => {
    api("/seminar")
      .then((data) => setHomeHero({
        image: data.seminar?.home_hero_data_url || "",
        fit: data.seminar?.home_hero_fit || "cover",
        position: data.seminar?.home_hero_position || "center"
      }))
      .catch(() => setHomeHero({ image: "", fit: "cover", position: "center" }));
  }, []);

  return (
    <>
      <section className="overflow-hidden bg-white">
        <div className="section grid items-center gap-10 py-12 sm:py-16 lg:min-h-[680px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-20">
          <div>
            <p className="eyebrow mb-5">Database Administrator Academy</p>
            <h1 className="max-w-4xl text-3xl font-black leading-tight text-byte-black sm:text-4xl md:text-6xl">
              Build Production-Ready DBA Skills
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-byte-graphite">
              Master Oracle, MySQL, Microsoft SQL Server, and PostgreSQL administration through structured material, practical course work, and certification-style exams.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary w-full sm:w-auto" to="/register">Start Learning <ArrowRight size={18} /></Link>
              <Link className="btn-secondary w-full sm:w-auto" to="/courses">Explore Courses</Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {paths.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-byte-line bg-byte-ash px-4 py-3 text-sm font-bold">
                  <ShieldCheck className="text-byte-maroon" size={17} />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="panel overflow-hidden">
            {homeHero.image ? (
              <img
                src={homeHero.image}
                alt="ByteWorks Academy homepage hero"
                className={`aspect-[4/3] h-full w-full bg-byte-ash ${homeHero.fit === "contain" ? "object-contain" : "object-cover"} lg:aspect-[1.07/1]`}
                style={{ objectPosition: homeHero.position || "center" }}
              />
            ) : (
              <div className="flex aspect-[4/3] min-h-[360px] flex-col items-center justify-center bg-byte-ash px-8 text-center lg:aspect-[1.07/1] lg:min-h-[520px]">
                <span className="flex h-16 w-16 items-center justify-center rounded-md bg-white text-byte-maroon shadow-sm">
                  <ImageUp size={30} />
                </span>
                <h2 className="mt-6 text-2xl font-black text-byte-black">Upload the homepage hero image</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-byte-graphite">
                  Use the admin dashboard to publish the image shown in this homepage hero area.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Why ByteWorks", "Structured paths for DBA fundamentals, operational routines, and exam readiness.", Server],
            ["Learning Paths", "Progress through practical modules designed around real database administration tasks.", BadgeCheck],
            ["Certification-style Exam", "Measure readiness with timed multiple-choice exams and saved results.", LockKeyhole]
          ].map(([title, copy, Icon]) => (
            <div key={title} className="panel p-7 transition hover:-translate-y-1 hover:border-byte-maroon">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-byte-maroon">
                <Icon size={24} />
              </span>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-byte-graphite">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-byte-black py-16 text-white">
        <div className="section flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-bold">Become a ByteWorks member</h2>
            <p className="mt-3 max-w-2xl text-white/70">Unlock DBA lessons, database platform exams, result history, and certificate placeholders from your member dashboard.</p>
          </div>
          <Link className="btn-primary bg-white text-byte-black hover:bg-byte-line" to="/register">Create Account</Link>
        </div>
      </section>
    </>
  );
}
