import express from "express";
import { adminOnly, authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const defaultRegistrationUrl = "https://discord.gg/PHaqJTz9H";
const maxImageLength = 7_000_000;

function normalizeUrl(value) {
  return typeof value === "string" && value.trim() ? value.trim() : defaultRegistrationUrl;
}

function validateImageDataUrl(value, label) {
  if (!value) return null;
  if (typeof value !== "string") {
    const error = new Error(`${label} must be an image data URL`);
    error.status = 400;
    throw error;
  }
  if (value.length > maxImageLength) {
    const error = new Error(`${label} is too large. Please upload an image under 5 MB.`);
    error.status = 400;
    throw error;
  }
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(value)) {
    const error = new Error(`${label} must be PNG, JPG, JPEG, or WebP`);
    error.status = 400;
    throw error;
  }
  return value;
}

async function getSeminarSettings(db) {
  const settings = await db.get("SELECT poster_data_url, home_hero_data_url, registration_url FROM seminar_settings WHERE id = 1");
  return {
    poster_data_url: settings?.poster_data_url || "",
    home_hero_data_url: settings?.home_hero_data_url || "",
    registration_url: normalizeUrl(settings?.registration_url)
  };
}

router.get("/", async (req, res) => {
  const seminar = await getSeminarSettings(req.app.locals.db);
  res.json({ seminar });
});

router.put("/", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const updates = [];
  const params = [];

  if (req.body.registration_url !== undefined) {
    updates.push("registration_url = ?");
    params.push(normalizeUrl(req.body.registration_url));
  }

  if (req.body.remove_poster) {
    updates.push("poster_data_url = ?");
    params.push("");
  } else if (req.body.poster_data_url !== undefined) {
    updates.push("poster_data_url = ?");
    params.push(validateImageDataUrl(req.body.poster_data_url, "Seminar poster"));
  }

  if (req.body.remove_home_hero) {
    updates.push("home_hero_data_url = ?");
    params.push("");
  } else if (req.body.home_hero_data_url !== undefined) {
    updates.push("home_hero_data_url = ?");
    params.push(validateImageDataUrl(req.body.home_hero_data_url, "Homepage hero image"));
  }

  if (updates.length > 0) {
    await db.run(`UPDATE seminar_settings SET ${updates.join(", ")} WHERE id = 1`, ...params);
  }

  const seminar = await getSeminarSettings(db);
  res.json({ seminar });
});

export default router;
