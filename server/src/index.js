import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { initDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import examRoutes from "./routes/exams.js";
import userRoutes from "./routes/users.js";
import resultRoutes from "./routes/results.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

const db = await initDb();
app.locals.db = db;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ByteWorks Academy API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/users", userRoutes);
app.use("/api/results", resultRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

app.listen(port, () => {
  console.log(`ByteWorks Academy API running on http://localhost:${port}`);
});
