export default function DatabaseHero3D() {
  return (
    <div className="hero-db panel" aria-hidden="true">
      <div className="hero-db__glow" />
      <div className="hero-db__shadow" />
      <img className="db-logo db-logo--oracle" src="/img/oracle-cropped.png" alt="" />
      <img className="db-logo db-logo--mysql" src="/img/mysql-cropped.png" alt="" />
      <img className="db-logo db-logo--mssql" src="/img/sqlserver-cropped.png" alt="" />
      <img className="db-logo db-logo--postgres" src="/img/postgresql-cropped.png" alt="" />
      <div className="hero-db__object">
        <div className="hero-db__disk hero-db__disk--top" />
        <div className="hero-db__segment hero-db__segment--one" />
        <div className="hero-db__gap" />
        <div className="hero-db__segment hero-db__segment--two" />
        <div className="hero-db__gap" />
        <div className="hero-db__segment hero-db__segment--three" />
        <div className="hero-db__disk hero-db__disk--bottom" />
      </div>
      <div className="hero-db__ring hero-db__ring--one" />
      <div className="hero-db__ring hero-db__ring--two" />
    </div>
  );
}
