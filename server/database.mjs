import { english } from "./copy.mjs";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";
import { categories, homepage, seedProducts, seedCoupons } from "./seed.mjs";
export const dataDir = path.resolve(process.env.VASSEL_DATA_DIR || "data");
mkdirSync(dataDir, { recursive: true });
export const db = new DatabaseSync(path.join(dataDir, "vassel.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS documents (kind TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY,productId TEXT NOT NULL,sku TEXT NOT NULL UNIQUE,color TEXT NOT NULL,hex TEXT NOT NULL,size TEXT NOT NULL,stock INTEGER NOT NULL CHECK(stock>=0));
CREATE INDEX IF NOT EXISTS variants_product ON variants(productId);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','buyer')),phone TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS resets (token TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES users(id),requestKey TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(userId,requestKey));
CREATE TABLE IF NOT EXISTS stock_log (id TEXT PRIMARY KEY,variantId TEXT NOT NULL,delta INTEGER NOT NULL,balance INTEGER NOT NULL,reason TEXT NOT NULL,actor TEXT NOT NULL,createdAt TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS engagement (kind TEXT NOT NULL,owner TEXT NOT NULL,data TEXT NOT NULL,updatedAt TEXT NOT NULL,PRIMARY KEY(kind,owner));
CREATE TABLE IF NOT EXISTS events (day TEXT NOT NULL,visitor TEXT NOT NULL,kind TEXT NOT NULL,productId TEXT NOT NULL DEFAULT '',count INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(day,visitor,kind,productId));
`);
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function checkPassword(password, hash) {
  const [salt, stored] = hash.split(":");
  const computed = scryptSync(password, salt, 64);
  return timingSafeEqual(computed, Buffer.from(stored, "hex"));
}
export function doc(kind, key) {
  const row = db
    .prepare("SELECT data FROM documents WHERE kind=? AND id=?")
    .get(kind, key);
  return row ? JSON.parse(row.data) : null;
}
export function docs(kind) {
  return db
    .prepare("SELECT data FROM documents WHERE kind=? ORDER BY rowid")
    .all(kind)
    .map((r) => JSON.parse(r.data));
}
export function put(kind, key, data) {
  db.prepare(
    "INSERT INTO documents(kind,id,data) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
  ).run(kind, key, JSON.stringify(data));
}
export function tx(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function products(all = false) {
  const vars = db.prepare("SELECT * FROM variants").all();
  return docs("product")
    .filter((p) => all || p.visible)
    .map((p) => ({ ...p, variants: vars.filter((v) => v.productId === p.id) }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
export function product(key) {
  const p = doc("product", key);
  return p
    ? {
        ...p,
        variants: db
          .prepare("SELECT * FROM variants WHERE productId=?")
          .all(key),
      }
    : null;
}
export function saveProduct(p, actor = "seed") {
  const current = doc("product", p.id);
  if (
    current &&
    actor !== "seed" &&
    (p.version || 0) !== (current.version || 0)
  )
    throw Object.assign(
      new Error(
        "Produk berubah sejak editor dibuka. Muat ulang data sebelum menyimpan agar stok terbaru tidak tertimpa.",
      ),
      { status: 409 },
    );
  const { variants, ...rest } = p;
  put("product", p.id, { ...rest, version: (current?.version || 0) + 1 });
  for (const v of variants) {
    const old = db
      .prepare("SELECT stock,productId FROM variants WHERE id=?")
      .get(v.id);
    if (old && old.productId !== p.id)
      throw new Error("ID varian sudah dipakai produk lain.");
    db.prepare(
      `INSERT INTO variants(id,productId,sku,color,hex,size,stock) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET sku=excluded.sku,color=excluded.color,hex=excluded.hex,size=excluded.size,stock=excluded.stock`,
    ).run(v.id, p.id, v.sku, v.color, v.hex, v.size, v.stock);
    if (old && old.stock !== v.stock)
      stockLog(v.id, v.stock - old.stock, v.stock, "Penyesuaian admin", actor);
  }
  // Keep variant identifiers stable for historical orders; retired variants cannot be sold.
  const keep = new Set(variants.map((v) => v.id));
  for (const v of db
    .prepare("SELECT id,stock FROM variants WHERE productId=?")
    .all(p.id)) {
    if (!keep.has(v.id)) {
      db.prepare("DELETE FROM variants WHERE id=?").run(v.id);
      if (v.stock) stockLog(v.id, -v.stock, 0, "Varian dihapus", actor);
    }
  }
}
export function stockLog(variantId, delta, balance, reason, actor) {
  db.prepare("INSERT INTO stock_log VALUES(?,?,?,?,?,?,?)").run(
    id(),
    variantId,
    delta,
    balance,
    reason,
    actor,
    now(),
  );
}
export function engagement(kind, owner, data) {
  db.prepare(
    `INSERT INTO engagement VALUES(?,?,?,?) ON CONFLICT(kind,owner) DO UPDATE SET data=excluded.data,updatedAt=excluded.updatedAt`,
  ).run(kind, owner, JSON.stringify(data), now());
}
export function getEngagement(kind, owner, fallback = []) {
  const row = db
    .prepare("SELECT data FROM engagement WHERE kind=? AND owner=?")
    .get(kind, owner);
  return row ? JSON.parse(row.data) : fallback;
}
export function publicUser(u) {
  return u
    ? {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        phone: u.phone,
        createdAt: u.createdAt,
      }
    : null;
}
if (!doc("meta", "seed"))
  tx(() => {
    for (const c of categories) put("category", c.id, c);
    for (const p of seedProducts()) saveProduct(p);
    put("settings", "homepage", homepage);
    for (const c of seedCoupons) put("coupon", c.id, c);
    put("meta", "seed", { version: 1, createdAt: now() });
  });
// One-time presentation migration: preserve user accounts, orders, prices and stock.
if (!doc("meta", "editorial-en-fr-v1"))
  tx(() => {
    const home = doc("settings", "homepage");
    if (home) {
      if (home.title === "Elegan, tanpa banyak kata.")
        Object.assign(home, {
          title: homepage.title,
          subtitle: homepage.subtitle,
          description: homepage.description,
          cta: homepage.cta,
          announcement: homepage.announcement,
          hiddenSections: homepage.hiddenSections,
          translations: homepage.translations,
        });
      delete home.video;
      for (const key of ["promoTitle", "promoText"])
        home[key] = english(home[key]);
      home.testimonials = home.testimonials.map((t) => ({
        name: english(t.name),
        text: english(t.text),
      }));
      put("settings", "homepage", home);
    }
    const defaults = new Map(seedProducts().map((p) => [p.id, p]));
    for (const p of docs("product")) {
      const seed = defaults.get(p.id);
      if (
        seed &&
        p.description?.includes(
          "Ini adalah data contoh; foto merupakan referensi visual",
        )
      ) {
        p.description = seed.description;
        p.translations = seed.translations;
      }
      for (const key of ["material", "care", "sizeGuide", "imageNote"])
        p[key] = english(p[key]);
      put("product", p.id, p);
    }
    for (const c of docs("category")) {
      c.name = english(c.name);
      c.description = english(c.description);
      put("category", c.id, c);
    }
    for (const c of docs("coupon")) {
      c.name = english(c.name);
      put("coupon", c.id, c);
    }
    put("meta", "editorial-en-fr-v1", { appliedAt: now() });
  });
if (process.env.DEMO_MODE !== "false") {
  for (const u of [
    {
      email: "admin@vassel.test",
      name: "Admin VASSEL",
      role: "admin",
      password: "VasselAdmin!2026",
    },
    {
      email: "pembeli@vassel.test",
      name: "Nadia Vassel",
      role: "buyer",
      password: "VasselBelanja!2026",
    },
  ]) {
    if (!db.prepare("SELECT id FROM users WHERE email=?").get(u.email))
      db.prepare(
        "INSERT INTO users(id,email,name,password,role,createdAt) VALUES(?,?,?,?,?,?)",
      ).run(id(), u.email, u.name, hashPassword(u.password), u.role, now());
  }
}
