import { ArrowUpRight, CalendarDays, ImageUp, MessagesSquare, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const discordInviteUrl = "https://discord.gg/PHaqJTz9H";
const posterPath = "/img/seminar-poster.png";

export default function Seminar() {
  const [seminar, setSeminar] = useState({ poster_data_url: posterPath, registration_url: discordInviteUrl });
  const [posterReady, setPosterReady] = useState(true);
  const registrationUrl = seminar.registration_url || discordInviteUrl;
  const posterUrl = seminar.poster_data_url || posterPath;

  useEffect(() => {
    api("/seminar")
      .then((data) => {
        setSeminar(data.seminar);
        setPosterReady(Boolean(data.seminar.poster_data_url));
      })
      .catch(() => setPosterReady(true));
  }, []);

  return (
    <>
      <section className="bg-white">
        <div className="section grid gap-10 py-12 sm:py-16 lg:min-h-[620px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-20">
          <div>
            <p className="eyebrow mb-5">ByteWorks Academy Seminar</p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight text-byte-black sm:text-4xl md:text-6xl">
              Daftar Seminar ByteWorks Academy
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-byte-graphite">
              Ikuti update seminar, materi, dan arahan pendaftaran langsung melalui komunitas Discord ByteWorks Academy.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="btn-primary w-full sm:w-auto" href={registrationUrl} target="_blank" rel="noreferrer">
                Join Discord <ArrowUpRight size={18} />
              </a>
              {posterReady && (
                <a className="btn-secondary w-full sm:w-auto" href={posterUrl} target="_blank" rel="noreferrer">
                  Lihat Poster
                </a>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ["Informasi seminar", CalendarDays],
                ["Diskusi peserta", MessagesSquare],
                ["Komunitas DBA", UsersRound]
              ].map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-3 rounded-md border border-byte-line bg-byte-ash px-4 py-3 text-sm font-bold">
                  <Icon className="text-byte-maroon" size={17} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="panel overflow-hidden">
            {posterReady ? (
              <img
                src={posterUrl}
                alt="Poster seminar ByteWorks Academy"
                className="aspect-[4/5] h-full w-full bg-byte-ash object-cover"
                onError={() => setPosterReady(false)}
              />
            ) : (
              <div className="flex aspect-[4/5] min-h-[420px] flex-col items-center justify-center bg-byte-ash px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-md bg-white text-byte-maroon shadow-sm">
                  <ImageUp size={30} />
                </span>
                <h2 className="mt-6 text-2xl font-black text-byte-black">Upload poster seminar</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-byte-graphite">
                  Buka dashboard admin untuk mengunggah poster seminar agar tampil otomatis di halaman ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section py-14">
        <div className="border-t border-byte-line pt-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">Registration</p>
              <h2 className="mt-3 text-3xl font-bold">Pendaftaran diarahkan ke Discord</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-byte-graphite">
                Peserta dapat bergabung ke server Discord untuk mendapatkan informasi jadwal, pengumuman, dan instruksi lanjutan.
              </p>
            </div>
            <a className="btn-primary w-full md:w-auto" href={registrationUrl} target="_blank" rel="noreferrer">
              Daftar via Discord <ArrowUpRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
