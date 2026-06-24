import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

export async function initDb() {
  if (process.env.DATABASE_URL) {
    const db = createPostgresDb(process.env.DATABASE_URL);
    await migratePostgres(db);
    await seed(db);
    return db;
  }

  const databaseFile = process.env.DATABASE_FILE || "./data/byteworks.sqlite";
  const resolved = path.resolve(databaseFile);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  const sqlite3 = (await import("sqlite3")).default;
  const { open } = await import("sqlite");
  const db = await open({
    filename: resolved,
    driver: sqlite3.Database
  });

  await db.exec("PRAGMA foreign_keys = ON");
  await migrateSqlite(db);
  await seed(db);

  return db;
}

function createPostgresDb(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
  });

  function convertPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => `$${++index}`);
  }

  async function query(sql, params = []) {
    return pool.query(convertPlaceholders(sql), params);
  }

  return {
    async exec(sql) {
      await pool.query(sql);
    },
    async all(sql, ...params) {
      const result = await query(sql, params);
      return result.rows;
    },
    async get(sql, ...params) {
      const result = await query(sql, params);
      return result.rows[0];
    },
    async run(sql, ...params) {
      const statement = /^\s*insert\s+/i.test(sql) && !/\breturning\b/i.test(sql) ? `${sql} RETURNING id` : sql;
      const result = await query(statement, params);
      return { lastID: result.rows[0]?.id, changes: result.rowCount };
    }
  };
}

async function migrateSqlite(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_number INTEGER NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER,
      title TEXT NOT NULL,
      passing_score INTEGER NOT NULL DEFAULT 75,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      checked_json TEXT NOT NULL DEFAULT '{}',
      saved INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, lesson_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS seminar_settings (
      id INTEGER PRIMARY KEY,
      poster_data_url TEXT NOT NULL DEFAULT '',
      poster_fit TEXT NOT NULL DEFAULT 'cover',
      home_hero_data_url TEXT NOT NULL DEFAULT '',
      home_hero_fit TEXT NOT NULL DEFAULT 'cover',
      registration_url TEXT NOT NULL DEFAULT 'https://discord.gg/PHaqJTz9H'
    );
  `);

  await ensureColumn(db, "seminar_settings", "home_hero_data_url", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "seminar_settings", "poster_fit", "TEXT NOT NULL DEFAULT 'cover'");
  await ensureColumn(db, "seminar_settings", "home_hero_fit", "TEXT NOT NULL DEFAULT 'cover'");
  await db.run("INSERT OR IGNORE INTO seminar_settings (id) VALUES (1)");
}

async function migratePostgres(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      passing_score INTEGER NOT NULL DEFAULT 75
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      notes TEXT NOT NULL DEFAULT '',
      checked_json TEXT NOT NULL DEFAULT '{}',
      saved INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS seminar_settings (
      id INTEGER PRIMARY KEY,
      poster_data_url TEXT NOT NULL DEFAULT '',
      poster_fit TEXT NOT NULL DEFAULT 'cover',
      home_hero_data_url TEXT NOT NULL DEFAULT '',
      home_hero_fit TEXT NOT NULL DEFAULT 'cover',
      registration_url TEXT NOT NULL DEFAULT 'https://discord.gg/PHaqJTz9H'
    );
  `);

  await ensureColumn(db, "seminar_settings", "home_hero_data_url", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "seminar_settings", "poster_fit", "TEXT NOT NULL DEFAULT 'cover'");
  await ensureColumn(db, "seminar_settings", "home_hero_fit", "TEXT NOT NULL DEFAULT 'cover'");
  await db.run("INSERT INTO seminar_settings (id) VALUES (?) ON CONFLICT (id) DO NOTHING", 1);
}

async function ensureColumn(db, tableName, columnName, columnDefinition) {
  try {
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  } catch (error) {
    const message = String(error?.message || "");
    if (!/duplicate column|already exists/i.test(message)) throw error;
  }
}

async function seed(db) {
  const userCount = await db.get("SELECT COUNT(*) as count FROM users");
  if (Number(userCount.count) === 0) {
    await db.run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      "ByteWorks Admin",
      "admin@byteworks.local",
      await bcrypt.hash("Admin12345", 10),
      "admin"
    );
    await db.run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      "Demo Member",
      "member@byteworks.local",
      await bcrypt.hash("Member12345", 10),
      "member"
    );
  }

  const courseCount = await db.get("SELECT COUNT(*) as count FROM courses");
  if (Number(courseCount.count) > 0) return;

  const courses = [
    ["Oracle DBA Fundamental", "oracle-dba-fundamental", "Oracle architecture, users, schemas, tablespaces, backup basics, and daily DBA operations.", "Beginner", "6 weeks"],
    ["MySQL DBA Administration", "mysql-dba-administration", "Install, secure, backup, replicate, monitor, and operate MySQL database environments.", "Beginner", "5 weeks"],
    ["Microsoft SQL Server DBA", "microsoft-sql-server-dba", "Manage SQL Server instances, databases, security, jobs, backups, and operational checks.", "Intermediate", "5 weeks"],
    ["PostgreSQL DBA Administration", "postgresql-dba-administration", "Operate PostgreSQL clusters, roles, schemas, backups, vacuum, replication, and monitoring.", "Intermediate", "5 weeks"],
    ["Database Backup and Recovery", "database-backup-and-recovery", "Design backup strategy and recovery validation for Oracle, MySQL, SQL Server, and PostgreSQL.", "Intermediate", "5 weeks"],
    ["Database Performance Tuning", "database-performance-tuning", "Analyze slow queries, indexes, execution plans, waits, locks, memory, and database baselines.", "Advanced", "6 weeks"]
  ];

  for (const [title, slug, description, level, duration] of courses) {
    const result = await db.run(
      "INSERT INTO courses (title, slug, description, level, duration, is_published) VALUES (?, ?, ?, ?, ?, 1)",
      title,
      slug,
      description,
      level,
      duration
    );
    await seedLessons(db, result.lastID, title);
  }

  const examTitles = [
    ["Oracle DBA Fundamental Exam", "oracle-dba-fundamental"],
    ["MySQL DBA Basic Exam", "mysql-dba-administration"],
    ["SQL Server DBA Exam", "microsoft-sql-server-dba"],
    ["PostgreSQL DBA Exam", "postgresql-dba-administration"]
  ];

  for (const [title, slug] of examTitles) {
    const course = await db.get("SELECT id FROM courses WHERE slug = ?", slug);
    const exam = await db.run("INSERT INTO exams (course_id, title, passing_score) VALUES (?, ?, 75)", course?.id, title);
    await seedQuestions(db, exam.lastID, title);
  }
}

async function seedLessons(db, courseId, courseTitle) {
  const lessons = [
    ["DBA Platform Overview", `Understand the architecture, service components, and daily administration scope of ${courseTitle}.`],
    ["Operational DBA Concepts", `Learn users, roles, storage, backup flow, monitoring indicators, and maintenance routines for ${courseTitle}.`],
    ["Production DBA Practice", `Practice production-style checks, change documentation, troubleshooting notes, and recovery validation.`]
  ];

  for (let i = 0; i < lessons.length; i += 1) {
    await db.run(
      "INSERT INTO lessons (course_id, title, content, order_number) VALUES (?, ?, ?, ?)",
      courseId,
      lessons[i][0],
      lessons[i][1],
      i + 1
    );
  }
}

async function seedQuestions(db, examId, examTitle) {
  const questions = [
    ["What should a DBA do before changing production database configuration?", "Apply the change immediately", "Document the plan and prepare rollback", "Disable monitoring permanently", "Delete historical logs", "B"],
    ["Which practice improves database recovery confidence?", "Never testing backups", "Keeping only screenshots", "Running restore validation", "Relying only on memory", "C"],
    ["What does least privilege mean for database users?", "Every user gets DBA rights", "Users receive only required permissions", "Passwords are shared by teams", "Auditing is disabled", "B"],
    ["Which signal is useful during database performance analysis?", "Execution plan and wait time", "Wallpaper size", "Keyboard layout", "Monitor brightness", "A"],
    ["What should a DBA record after resolving a database incident?", "Nothing if service is back", "Only the user complaint", "Root cause, timeline, and prevention action", "A random query sample", "C"]
  ];

  for (const [question, a, b, c, d, answer] of questions) {
    await db.run(
      "INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)",
      examId,
      `${examTitle}: ${question}`,
      a,
      b,
      c,
      d,
      answer
    );
  }
}
