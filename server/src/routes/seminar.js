import express from "express";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const defaultRegistrationUrl = "https://discord.gg/PHaqJTz9H";
const maxPosterLength = 7_000_000;

function normalizeUrl(value) {
  return typeof value === "string" && value.trim() ? value.trim() : defaultRegistrationUrl;
}

function validatePosterDataUrl(value) {
  if (!value) return null;
  if (typeof value !== "string") {
    const error = new Error("Poster must be an image data URL");
    error.status = 400;
    throw error;
  }
  if (value.length > maxPosterLength) {
    const error = new Error("Poster image is too large. Please upload an image under 5 MB.");
    error.status = 400;
    throw error;
  }
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(value)) {
    const error = new Error("Poster must be PNG, JPG, JPEG, or WebP");
    error.status = 400;
    throw error;
  }
  return value;
}

async function getSeminarSettings(db) {
  const settings = await db.get("SELECT poster_data_url, registration_url FROM seminar_settings WHERE id = 1");
  return {
    poster_data_url: settings?.poster_data_url || "",
    registration_url: normalizeUrl(settings?.registration_url)
  };
}

router.get("/", async (req, res) => {
  const seminar = await getSeminarSettings(req.app.locals.db);
  res.json({ seminar });
});

router.put("/", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const current = await getSeminarSettings(db);
  const registrationUrl = normalizeUrl(req.body.registration_url);
  const posterDataUrl = req.body.remove_poster ? "" : validatePosterDataUrl(req.body.poster_data_url ?? current.poster_data_url);

  await db.run(
    "UPDATE seminar_settings SET poster_data_url = ?, registration_url = ? WHERE id = 1",
    posterDataUrl,
    registrationUrl
  );

  const seminar = await getSeminarSettings(db);
  res.json({ seminar });
});

export default router;
