import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "byteworks_dev_secret");
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function memberOnly(req, res, next) {
  if (!["member", "admin"].includes(req.user?.role)) return res.status(403).json({ message: "Member access required" });
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  next();
}
