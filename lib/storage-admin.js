import fs from "fs";
import path from "path";

export function storageFile(name) {
  return path.join(process.cwd(), "storage", `${name}.json`);
}

export function ensureStorageFile(name) {
  const file = storageFile(name);
  const dir = path.dirname(file);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]", "utf8");

  return file;
}

export function readStorageList(name) {
  const file = ensureStorageFile(name);

  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStorageList(name, data) {
  const file = ensureStorageFile(name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

export function slugify(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function splitContentIntoParagraphs(text = "") {
  return String(text)
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sortByPublishedAtDesc(items = []) {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt || b.date || 0) - new Date(a.publishedAt || a.date || 0)
  );
}

export function checkAdminPassword(password = "") {
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword) {
    return {
      ok: false,
      status: 500,
      error: "ADMIN_PASSWORD não configurado no servidor.",
    };
  }

  if (password !== adminPassword) {
    return {
      ok: false,
      status: 401,
      error: "Senha inválida.",
    };
  }

  return { ok: true };
}
