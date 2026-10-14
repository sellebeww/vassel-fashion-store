import express from "express";
import multer from "multer";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  db,
  dataDir,
  id,
  now,
  doc,
  docs,
  put,
  tx,
  products,
  product,
  saveProduct,
  stockLog,
  engagement,
  getEngagement,
  hashPassword,
  checkPassword,
  publicUser,
} from "./database.mjs";
export const app = express();
const demo = process.env.DEMO_MODE !== "false";
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const text = (v, max = 500) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const email = (v) => text(v, 254).toLowerCase();
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const integer = (v, min = 0, max = 100000000) =>
  Number.isSafeInteger(v) && v >= min && v <= max;
const sha = (v) => createHash("sha256").update(v).digest("hex");
const media = (v) =>
  typeof v === "string" &&
  /^\/(images|brand|uploads)\/[a-zA-Z0-9_./-]+$/.test(v) &&
  !v.includes("..") &&
  /\.(webp|png|jpe?g)$/i.test(v) &&
  existsSync(
    v.startsWith("/uploads/")
      ? path.join(dataDir, v)
      : path.resolve("public", v.slice(1)),
  );
const cookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie || "").split(";").map((c) => c.trim().split("=")),
  );
const rateMap = new Map();
function limit(req, key, max = 12) {
  const k = req.ip + ":" + key;
  let item = rateMap.get(k);
  if (!item || item.until < Date.now()) {
    item = { until: Date.now() + 15 * 60e3, count: 0 };
    rateMap.set(k, item);
  }
  if (++item.count > max)
    throw fail("Terlalu banyak percobaan. Coba lagi dalam 15 menit.", 429);
  if (rateMap.size > 10000)
    for (const [k, v] of rateMap) if (v.until < Date.now()) rateMap.delete(k);
}
function user(req, res, next) {
  const token = cookies(req).vassel_session;
  const row =
    token &&
    db
      .prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id=sessions.userId WHERE sessions.token=? AND sessions.expires>?",
      )
      .get(sha(token), Date.now());
  req.user = row || null;
  next();
}
function required(req, res, next) {
  if (!req.user)
    return res.status(401).json({ error: "Silakan masuk untuk melanjutkan." });
  next();
}
function admin(req, res, next) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Halaman ini khusus admin VASSEL." });
  next();
}
function session(req, res, u) {
  const old = cookies(req).vassel_session;
  if (old) db.prepare("DELETE FROM sessions WHERE token=?").run(sha(old));
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    sha(token),
    u.id,
    Date.now() + 7 * 86400e3,
  );
  res.cookie("vassel_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 7 * 86400e3,
    path: "/",
  });
}
function address(a) {
  if (
    !a ||
    !text(a.name) ||
    !/^\+?[\d\s()-]{9,18}$/.test(text(a.phone)) ||
    text(a.street).length < 8 ||
    !text(a.city) ||
    !text(a.province) ||
    !/^\d{5}$/.test(text(a.postalCode))
  )
    throw fail(
      "Lengkapi nama, nomor HP, alamat, kota, provinsi, dan kode pos 5 digit.",
    );
  return {
    id: text(a.id) || id(),
    label: text(a.label, 40) || "Rumah",
    name: text(a.name, 100),
    phone: text(a.phone, 24),
    street: text(a.street, 400),
    city: text(a.city, 80),
    province: text(a.province, 80),
    postalCode: text(a.postalCode, 5),
  };
}
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
  });
  next();
});
app.use("/api", express.json({ limit: "256kb" }));
app.use("/api", (req, res, next) => {
  if (req.is("application/json") && (!req.body || Array.isArray(req.body)))
    return res
      .status(400)
      .json({ error: "Isi permintaan harus berupa objek." });
  req.body ??= {};
  next();
});
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.origin;
    const allowed =
      process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`;
    if (
      (origin && origin !== allowed) ||
      req.headers["x-vassel-client"] !== "web"
    )
      return res.status(403).json({ error: "Permintaan tidak diizinkan." });
  }
  next();
});
app.use("/api", user);
const listeners = new Set();
app.get("/api/live", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(": connected\n\n");
  listeners.add(res);
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    listeners.delete(res);
  });
});
app.use("/api", (req, res, next) => {
  if (
    !["GET", "HEAD"].includes(req.method) &&
    (req.path.startsWith("/admin/") || req.path === "/orders")
  )
    res.once("finish", () => {
      if (res.statusCode < 400)
        for (const client of listeners)
          client.write("event: catalog\ndata: changed\n\n");
    });
  next();
});
app.get("/api/health", (req, res) => res.json({ ok: true, demo }));
app.get("/api/bootstrap", (req, res) =>
  res.json({
    products: products(),
    categories: docs("category"),
    home: doc("settings", "homepage"),
    me: publicUser(req.user),
    demo,
  }),
);
app.get("/api/me", (req, res) =>
  res.json({
    user: publicUser(req.user),
    addresses: req.user ? getEngagement("addresses", req.user.id) : [],
    wishlist: req.user ? getEngagement("wishlist", req.user.id) : [],
    cart: req.user ? getEngagement("cart", req.user.id) : [],
  }),
);
app.post("/api/auth/register", (req, res) => {
  limit(req, "register", 10);
  const b = req.body,
    e = email(b.email),
    name = text(b.name, 100);
  if (
    !validEmail(e) ||
    name.length < 2 ||
    typeof b.password !== "string" ||
    b.password.length < 10 ||
    b.password.length > 128
  )
    throw fail("Isi nama, email valid, dan kata sandi minimal 10 karakter.");
  if (db.prepare("SELECT id FROM users WHERE email=?").get(e))
    throw fail(
      "Email sudah terdaftar. Silakan masuk atau reset kata sandi.",
      409,
    );
  const uid = id();
  db.prepare(
    "INSERT INTO users(id,email,name,password,role,createdAt) VALUES(?,?,?,?,?,?)",
  ).run(uid, e, name, hashPassword(b.password), "buyer", now());
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(uid);
  session(req, res, u);
  res.status(201).json({ user: publicUser(u) });
});
app.post("/api/auth/login", (req, res) => {
  limit(req, "login", 30);
  const b = req.body;
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(email(b.email));
  const valid =
    typeof b.password === "string" &&
    b.password.length <= 128 &&
    checkPassword(b.password, u?.password || dummyHash);
  if (!u || !valid || (b.admin && u.role !== "admin"))
    throw fail("Email atau kata sandi tidak sesuai.", 401);
  session(req, res, u);
  res.json({ user: publicUser(u) });
});
const dummyHash = hashPassword(randomBytes(24).toString("hex"));
app.post("/api/auth/logout", (req, res) => {
  const token = cookies(req).vassel_session;
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(sha(token));
  res.clearCookie("vassel_session", { path: "/" });
  res.json({ ok: true });
});
app.post("/api/auth/forgot", (req, res) => {
  limit(req, "forgot", 5);
  const e = email(req.body.email);
  if (!validEmail(e)) throw fail("Masukkan email yang valid.");
  const u = db.prepare("SELECT * FROM users WHERE email=?").get(e);
  if (u) {
    const token = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM resets WHERE userId=?").run(u.id);
    db.prepare("INSERT INTO resets VALUES(?,?,?)").run(
      sha(token),
      u.id,
      Date.now() + 30 * 60e3,
    );
    const url = `${process.env.PUBLIC_ORIGIN || `${req.protocol}://${req.get("host")}`}/reset-password?token=${token}`;
    const outbox = path.join(dataDir, "mail-outbox");
    mkdirSync(outbox, { recursive: true, mode: 0o700 });
    writeFileSync(
      path.join(outbox, `${Date.now()}-${id()}.json`),
      JSON.stringify(
        {
          to: e,
          subject: "Reset kata sandi VASSEL",
          url,
          expiresIn: "30 menit",
          delivery: "local-outbox",
        },
        null,
        2,
      ),
      { mode: 0o600 },
    );
  }
  res.json({
    message:
      "Jika email terdaftar, tautan reset telah dibuat. Pada versi lokal, tautan tersedia di mail-outbox server.",
    localOutbox: true,
  });
});
app.post("/api/auth/reset", (req, res) => {
  limit(req, "reset", 10);
  const { token, password } = req.body;
  if (
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 128
  )
    throw fail("Kata sandi harus 10–128 karakter.");
  const r = db
    .prepare("SELECT * FROM resets WHERE token=? AND expires>?")
    .get(sha(text(token, 200)), Date.now());
  if (!r) throw fail("Tautan reset tidak valid atau sudah kedaluwarsa.");
  tx(() => {
    db.prepare("UPDATE users SET password=? WHERE id=?").run(
      hashPassword(password),
      r.userId,
    );
    db.prepare("DELETE FROM resets WHERE userId=?").run(r.userId);
    db.prepare("DELETE FROM sessions WHERE userId=?").run(r.userId);
  });
  res.json({ ok: true });
});
app.patch("/api/me", required, (req, res) => {
  const name = text(req.body.name, 100),
    phone = text(req.body.phone, 24);
  if (name.length < 2 || (phone && !/^\+?[\d\s()-]{9,18}$/.test(phone)))
    throw fail("Periksa nama dan nomor HP.");
  db.prepare("UPDATE users SET name=?,phone=? WHERE id=?").run(
    name,
    phone,
    req.user.id,
  );
  res.json({
    user: publicUser(
      db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id),
    ),
  });
});
app.put("/api/me/addresses", required, (req, res) => {
  if (!Array.isArray(req.body.addresses) || req.body.addresses.length > 10)
    throw fail("Maksimal 10 alamat.");
  const rows = req.body.addresses.map(address);
  engagement("addresses", req.user.id, rows);
  res.json(rows);
});
app.put("/api/me/wishlist", required, (req, res) => {
  if (!Array.isArray(req.body.ids) || req.body.ids.length > 200)
    throw fail("Daftar favorit tidak valid.");
  const ids = [...new Set(req.body.ids)].filter(
    (v) => typeof v === "string" && doc("product", v),
  );
  engagement("wishlist", req.user.id, ids);
  res.json(ids);
});
function cleanCart(items, strict = false) {
  if (!Array.isArray(items) || items.length > 100)
    throw fail("Keranjang tidak valid.");
  const map = new Map();
  for (const item of items) {
    if (
      !item ||
      !integer(item.quantity, 1, 99) ||
      typeof item.variantId !== "string"
    )
      throw fail("Jumlah produk tidak valid.");
    const v = db
      .prepare("SELECT * FROM variants WHERE id=?")
      .get(item.variantId);
    if (!v || !product(v.productId)?.visible) {
      if (strict)
        throw fail(
          "Salah satu produk tidak lagi tersedia. Periksa keranjang.",
          409,
        );
      continue;
    }
    map.set(v.id, {
      variantId: v.id,
      quantity: Math.min(99, (map.get(v.id)?.quantity || 0) + item.quantity),
    });
  }
  return [...map.values()];
}
app.put("/api/me/cart", required, (req, res) => {
  const items = cleanCart(req.body.items);
  engagement("cart", req.user.id, items);
  res.json(items);
});
function quote(b) {
  const items = cleanCart(b.items, true);
  if (!items.length) throw fail("Keranjang masih kosong.");
  let subtotal = 0;
  const lines = items.map((item) => {
    const v = db
        .prepare("SELECT * FROM variants WHERE id=?")
        .get(item.variantId),
      p = product(v.productId);
    if (v.stock < item.quantity)
      throw fail(
        `Stok ${p.name} (${v.color}, ${v.size}) tersisa ${v.stock}.`,
        409,
      );
    subtotal += p.price * item.quantity;
    return {
      variantId: v.id,
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images[0],
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: p.price,
      quantity: item.quantity,
    };
  });
  const shippingMethod = b.shippingMethod || "reguler";
  if (!["reguler", "ekspres"].includes(shippingMethod))
    throw fail("Pilih metode pengiriman.");
  let shipping =
      shippingMethod === "ekspres" ? 35000 : subtotal >= 750000 ? 0 : 20000,
    discount = 0,
    coupon = null;
  if (text(b.coupon)) {
    coupon = docs("coupon").find(
      (c) => c.code === text(b.coupon).toUpperCase(),
    );
    const today = now().slice(0, 10);
    if (
      !coupon ||
      !coupon.active ||
      today < coupon.start ||
      today > coupon.end ||
      coupon.used >= coupon.limit
    )
      throw fail("Kode promo tidak berlaku atau kuotanya habis.");
    if (subtotal < coupon.minSpend)
      throw fail(
        `Minimum belanja promo Rp ${coupon.minSpend.toLocaleString("id-ID")}.`,
      );
    if (coupon.type === "shipping")
      shipping = Math.max(0, shipping - (coupon.maxDiscount || shipping));
    else
      discount = Math.min(
        subtotal,
        coupon.type === "percent"
          ? Math.floor((subtotal * coupon.value) / 100)
          : coupon.value,
        coupon.maxDiscount || subtotal,
      );
  }
  return {
    items: lines,
    subtotal,
    shipping,
    discount,
    total: subtotal + shipping - discount,
    shippingMethod,
    coupon: coupon?.code || "",
    couponId: coupon?.id,
  };
}
app.post("/api/checkout/quote", required, (req, res) =>
  res.json(quote(req.body)),
);
app.post("/api/orders", required, (req, res) => {
  const b = req.body,
    key = text(b.requestKey, 100);
  if (key.length < 10) throw fail("Kunci pesanan tidak valid.");
  const previous = db
    .prepare("SELECT data FROM orders WHERE userId=? AND requestKey=?")
    .get(req.user.id, key);
  if (previous) return res.json(JSON.parse(previous.data));
  const a = address(b.address);
  if (!["transfer-demo", "qris-demo"].includes(b.paymentMethod))
    throw fail("Pilih metode pembayaran demo.");
  const order = tx(() => {
    const q = quote(b);
    if (b.expectedTotal !== undefined && b.expectedTotal !== q.total)
      throw fail(
        "Total pesanan berubah. Periksa harga dan promo terbaru sebelum melanjutkan.",
        409,
      );
    const orderId = `VS-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    for (const line of q.items) {
      const result = db
        .prepare("UPDATE variants SET stock=stock-? WHERE id=? AND stock>=?")
        .run(line.quantity, line.variantId, line.quantity);
      if (result.changes !== 1)
        throw fail("Stok berubah. Silakan periksa keranjang lagi.", 409);
      const v = db
        .prepare("SELECT stock FROM variants WHERE id=?")
        .get(line.variantId);
      stockLog(
        line.variantId,
        -line.quantity,
        v.stock,
        `Pesanan ${orderId}`,
        req.user.id,
      );
    }
    for (const pid of new Set(q.items.map((i) => i.productId))) {
      const p = doc("product", pid);
      put("product", pid, { ...p, version: (p.version || 0) + 1 });
    }
    if (q.couponId) {
      const c = doc("coupon", q.couponId);
      put("coupon", c.id, { ...c, used: c.used + 1 });
    }
    const data = {
      ...q,
      id: orderId,
      userId: req.user.id,
      customerName: req.user.name,
      email: req.user.email,
      address: a,
      paymentMethod: b.paymentMethod,
      status: "baru",
      tracking: "",
      createdAt: now(),
      history: [
        {
          status: "baru",
          at: now(),
          note: "Pesanan dibuat. Stok dialokasikan; pembayaran dalam mode demo.",
        },
      ],
    };
    db.prepare("INSERT INTO orders VALUES(?,?,?,?)").run(
      orderId,
      req.user.id,
      key,
      JSON.stringify(data),
    );
    engagement("cart", req.user.id, []);
    return data;
  });
  res.status(201).json(order);
});
app.get("/api/orders", required, (req, res) =>
  res.json(
    db
      .prepare("SELECT data FROM orders WHERE userId=? ORDER BY rowid DESC")
      .all(req.user.id)
      .map((r) => JSON.parse(r.data)),
  ),
);
app.get("/api/orders/:id", required, (req, res) => {
  const row = db
    .prepare("SELECT data FROM orders WHERE id=? AND userId=?")
    .get(req.params.id, req.user.id);
  if (!row) throw fail("Pesanan tidak ditemukan.", 404);
  res.json(JSON.parse(row.data));
});
app.post("/api/newsletter", (req, res) => {
  limit(req, "newsletter", 20);
  const e = email(req.body.email);
  if (!validEmail(e) || req.body.consent !== true)
    throw fail("Isi email dan setujui langganan kabar VASSEL.");
  engagement("newsletter", e, { email: e, consentAt: now() });
  res.json({
    message: "Terima kasih. Emailmu sudah masuk daftar kabar VASSEL.",
  });
});
app.post("/api/restock", (req, res) => {
  limit(req, "restock", 20);
  const e = email(req.body.email),
    v = db
      .prepare("SELECT id FROM variants WHERE id=?")
      .get(text(req.body.variantId));
  if (!validEmail(e) || !v) throw fail("Periksa email dan varian produk.");
  engagement("restock", `${e}:${v.id}`, {
    email: e,
    variantId: v.id,
    status: "menunggu",
  });
  res.json({
    message: "Permintaan tersimpan. Tim VASSEL dapat melihatnya di admin.",
  });
});
app.get("/api/reviews/:productId", (req, res) =>
  res.json(
    docs("review").filter(
      (r) => r.productId === req.params.productId && r.status === "approved",
    ),
  ),
);
app.post("/api/reviews", required, (req, res) => {
  const b = req.body;
  if (
    !product(text(b.productId)) ||
    !integer(b.rating, 1, 5) ||
    text(b.text, 1000).length < 10
  )
    throw fail("Pilih rating dan tulis ulasan minimal 10 karakter.");
  const bought = db
    .prepare("SELECT data FROM orders WHERE userId=?")
    .all(req.user.id)
    .some((r) => {
      const o = JSON.parse(r.data);
      return (
        o.status === "selesai" &&
        o.items.some((i) => i.productId === b.productId)
      );
    });
  if (!bought)
    throw fail("Ulasan tersedia setelah pesanan produk ini selesai.");
  if (
    docs("review").some(
      (r) => r.userId === req.user.id && r.productId === b.productId,
    )
  )
    throw fail("Kamu sudah mengulas produk ini.");
  const r = {
    id: id(),
    productId: b.productId,
    userId: req.user.id,
    name: req.user.name,
    rating: b.rating,
    text: text(b.text, 1000),
    status: "pending",
    createdAt: now(),
  };
  put("review", r.id, r);
  res.status(201).json(r);
});
app.post("/api/events", (req, res) => {
  limit(req, "events", 500);
  const kind = req.body.kind;
  if (!["visit", "view", "click"].includes(kind))
    throw fail("Event tidak valid.");
  let visitor = cookies(req).vassel_visitor;
  if (!/^[a-f0-9]{32}$/.test(visitor || "")) {
    visitor = randomBytes(16).toString("hex");
    res.cookie("vassel_visitor", visitor, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: 30 * 86400e3,
    });
  }
  const pid = kind === "visit" ? "" : text(req.body.productId, 100);
  if (pid && !product(pid)) throw fail("Produk tidak ditemukan.");
  db.prepare(
    "INSERT INTO events(day,visitor,kind,productId) VALUES(?,?,?,?) ON CONFLICT(day,visitor,kind,productId) DO UPDATE SET count=count+1",
  ).run(now().slice(0, 10), visitor, kind, pid);
  res.json({ ok: true });
});
app.use("/api/admin", required, admin);
app.get("/api/admin/data", (req, res) => {
  const orders = db
    .prepare("SELECT data FROM orders ORDER BY rowid DESC")
    .all()
    .map((r) => JSON.parse(r.data));
  const rows = db
    .prepare("SELECT * FROM engagement ORDER BY updatedAt DESC")
    .all()
    .map((r) => ({ ...r, data: JSON.parse(r.data) }));
  res.json({
    products: products(true),
    categories: docs("category"),
    home: doc("settings", "homepage"),
    coupons: docs("coupon"),
    orders,
    customers: db
      .prepare(
        "SELECT id,name,email,phone,role,createdAt FROM users ORDER BY createdAt DESC",
      )
      .all(),
    engagement: rows,
    reviews: docs("review"),
    stockLog: db
      .prepare("SELECT * FROM stock_log ORDER BY rowid DESC LIMIT 200")
      .all(),
    events: db
      .prepare(
        "SELECT productId,kind,SUM(count) AS count FROM events GROUP BY productId,kind",
      )
      .all(),
    visitors: db
      .prepare("SELECT COUNT(DISTINCT visitor) AS total FROM events")
      .get().total,
  });
});
function validateProduct(b) {
  if (
    !b ||
    text(b.name, 160).length < 3 ||
    !doc("category", text(b.category)) ||
    !integer(b.price, 1000, 100000000) ||
    !integer(b.comparePrice || 0) ||
    (b.comparePrice && b.comparePrice <= b.price)
  )
    throw fail(
      "Periksa nama, kategori, harga, dan harga coret (harus lebih besar).",
    );
  if (
    !text(b.sku, 100) ||
    docs("product").some((p) => p.sku === b.sku && p.id !== b.id)
  )
    throw fail("SKU produk wajib diisi dan harus unik.");
  if (!/^[a-z0-9-]{3,160}$/.test(b.slug || ""))
    throw fail("Slug hanya boleh huruf kecil, angka, dan tanda hubung.");
  if (docs("product").some((p) => p.slug === b.slug && p.id !== b.id))
    throw fail("Slug sudah dipakai produk lain.");
  if (
    !Array.isArray(b.images) ||
    b.images.length < 2 ||
    b.images.length > 8 ||
    b.images.some((v) => !media(v))
  )
    throw fail("Gunakan 2–8 foto lokal / unggahan.");
  if (
    !Array.isArray(b.variants) ||
    !b.variants.length ||
    b.variants.length > 100
  )
    throw fail("Tambahkan minimal satu varian.");
  const combinations = new Set(),
    skus = new Set(),
    ids = new Set();
  const variants = b.variants.map((v) => {
    if (
      !text(v.color, 40) ||
      !text(v.size, 20) ||
      !/^#[a-f0-9]{6}$/i.test(v.hex) ||
      !integer(v.stock, 0, 100000) ||
      !text(v.sku, 100)
    )
      throw fail(
        "Varian perlu warna, kode hex, ukuran, SKU, dan stok yang valid.",
      );
    const key = v.color.toLowerCase() + ":" + v.size.toLowerCase();
    if (combinations.has(key) || skus.has(v.sku) || ids.has(v.id))
      throw fail("Warna + ukuran, ID, dan SKU varian harus unik.");
    combinations.add(key);
    skus.add(v.sku);
    ids.add(v.id);
    return {
      id: text(v.id, 100) || id(),
      sku: text(v.sku, 100),
      color: text(v.color, 40),
      hex: v.hex,
      size: text(v.size, 20),
      stock: v.stock,
    };
  });
  return {
    version: integer(b.version) ? b.version : 0,
    id: text(b.id, 100) || id(),
    slug: b.slug,
    name: text(b.name, 160),
    sku: text(b.sku, 100),
    category: b.category,
    collection: text(b.collection, 80),
    description: text(b.description, 3000),
    translations: {
      fr: { description: text(b.translations?.fr?.description, 3000) },
    },
    material: text(b.material, 1000),
    care: text(b.care, 1000),
    sizeGuide: text(b.sizeGuide, 2000),
    price: b.price,
    comparePrice: b.comparePrice || 0,
    visible: b.visible === true,
    featured: b.featured === true,
    sortOrder: integer(b.sortOrder, 0, 100000) ? b.sortOrder : 1000,
    labels: Array.isArray(b.labels)
      ? b.labels.filter((x) => ["Baru", "Terlaris", "Sale"].includes(x))
      : [],
    images: b.images,
    imageNote: text(b.imageNote, 250),
    createdAt: doc("product", b.id)?.createdAt || now(),
    variants,
  };
}
app.post("/api/admin/products", (req, res) => {
  const p = validateProduct({ ...req.body, id: id() });
  tx(() => saveProduct(p, req.user.id));
  res.status(201).json(product(p.id));
});
app.put("/api/admin/products/:id", (req, res) => {
  if (!product(req.params.id)) throw fail("Produk tidak ditemukan.", 404);
  const p = validateProduct({ ...req.body, id: req.params.id });
  const removed = product(p.id).variants.filter(
    (v) => !p.variants.some((n) => n.id === v.id),
  );
  if (
    removed.length &&
    db
      .prepare("SELECT data FROM orders")
      .all()
      .some((r) => {
        const o = JSON.parse(r.data);
        return (
          !["selesai", "batal"].includes(o.status) &&
          o.items.some((i) => removed.some((v) => v.id === i.variantId))
        );
      })
  )
    throw fail(
      "Varian terkait pesanan aktif tidak dapat dihapus. Ubah stok menjadi 0 untuk menghentikan penjualan.",
      409,
    );
  tx(() => saveProduct(p, req.user.id));
  res.json(product(p.id));
});
app.delete("/api/admin/products/:id", (req, res) => {
  const p = product(req.params.id);
  if (!p) throw fail("Produk tidak ditemukan.", 404);
  const active = db
    .prepare("SELECT data FROM orders")
    .all()
    .some((r) => {
      const o = JSON.parse(r.data);
      return (
        !["selesai", "batal"].includes(o.status) &&
        o.items.some((i) => i.productId === p.id)
      );
    });
  if (active)
    throw fail(
      "Produk memiliki pesanan aktif. Sembunyikan produk sampai pesanan selesai.",
      409,
    );
  tx(() => {
    db.prepare("DELETE FROM documents WHERE kind='product' AND id=?").run(p.id);
    db.prepare("DELETE FROM variants WHERE productId=?").run(p.id);
  });
  res.json({ ok: true });
});
app.put("/api/admin/categories/:id", (req, res) => {
  const b = req.body,
    key = req.params.id;
  if (!/^[a-z0-9-]{2,60}$/.test(key) || !text(b.name, 50) || !media(b.image))
    throw fail("Isi ID kategori, nama, dan gambar lokal.");
  const c = {
    id: key,
    name: text(b.name, 50),
    description: text(b.description, 200),
    image: b.image,
  };
  put("category", key, c);
  res.json(c);
});
app.delete("/api/admin/categories/:id", (req, res) => {
  if (products(true).some((p) => p.category === req.params.id))
    throw fail("Pindahkan atau hapus produk di kategori ini dahulu.");
  db.prepare("DELETE FROM documents WHERE kind='category' AND id=?").run(
    req.params.id,
  );
  res.json({ ok: true });
});
app.put("/api/admin/collections", (req, res) => {
  const oldName = text(req.body.oldName, 80),
    newName = text(req.body.newName, 80);
  if (!oldName || !newName) throw fail("Isi nama koleksi lama dan baru.");
  tx(() => {
    for (const p of docs("product").filter((p) => p.collection === oldName))
      put("product", p.id, { ...p, collection: newName });
  });
  res.json({ ok: true });
});
app.put("/api/admin/home", (req, res) => {
  const b = req.body;
  const allowed = [
    "categories",
    "new",
    "bestseller",
    "promo",
    "testimonials",
    "newsletter",
  ];
  if (
    !text(b.title, 100) ||
    !media(b.poster) ||
    !/^\/(?!\/)[a-zA-Z0-9/?=&_%.-]*$/.test(b.ctaLink) ||
    !Array.isArray(b.sections) ||
    b.sections.length !== 6 ||
    new Set(b.sections).size !== 6 ||
    b.sections.some((s) => !allowed.includes(s))
  )
    throw fail("Periksa judul, media, tautan CTA, dan urutan keenam section.");
  const h = {
    translations: {
      fr: Object.fromEntries(
        [
          "title",
          "subtitle",
          "description",
          "cta",
          "announcement",
          "promoTitle",
          "promoText",
        ]
          .map((key) => [
            key,
            text(b.translations?.fr?.[key], key === "promoText" ? 500 : 300),
          ])
          .filter(([, value]) => value),
      ),
    },
    title: text(b.title, 100),
    subtitle: text(b.subtitle, 100),
    description: text(b.description, 300),
    poster: b.poster,
    cta: text(b.cta, 60),
    ctaLink: b.ctaLink,
    announcement: text(b.announcement, 180),
    promoTitle: text(b.promoTitle, 100),
    promoText: text(b.promoText, 500),
    promoImage: media(b.promoImage) ? b.promoImage : b.poster,
    sections: b.sections,
    hiddenSections: Array.isArray(b.hiddenSections)
      ? b.hiddenSections.filter((s) => allowed.includes(s))
      : [],
    featuredIds: Array.isArray(b.featuredIds)
      ? b.featuredIds.filter((v) => product(v)).slice(0, 12)
      : [],
    testimonials: Array.isArray(b.testimonials)
      ? b.testimonials
          .slice(0, 6)
          .map((t) => ({ name: text(t.name, 100), text: text(t.text, 500) }))
      : [],
  };
  put("settings", "homepage", h);
  res.json(h);
});
app.put("/api/admin/coupons/:id", (req, res) => {
  const b = req.body,
    key = req.params.id;
  if (
    !/^[A-Z0-9_-]{3,30}$/.test(b.code || "") ||
    !["percent", "fixed", "shipping"].includes(b.type) ||
    !integer(b.value, 0, b.type === "percent" ? 100 : 10000000) ||
    !integer(b.minSpend) ||
    !integer(b.maxDiscount) ||
    !integer(b.limit, 1, 1000000) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(b.end) ||
    b.start > b.end
  )
    throw fail("Periksa kode, nilai, kuota, dan tanggal promo.");
  if (docs("coupon").some((c) => c.code === b.code && c.id !== key))
    throw fail("Kode promo sudah digunakan.");
  const c = {
    id: key,
    name: text(b.name, 100),
    code: b.code,
    type: b.type,
    value: b.value,
    minSpend: b.minSpend,
    maxDiscount: b.maxDiscount,
    limit: b.limit,
    used: doc("coupon", key)?.used || 0,
    active: b.active === true,
    start: b.start,
    end: b.end,
  };
  put("coupon", key, c);
  res.json(c);
});
app.patch("/api/admin/orders/:id", (req, res) => {
  const row = db
    .prepare("SELECT data FROM orders WHERE id=?")
    .get(req.params.id);
  if (!row) throw fail("Pesanan tidak ditemukan.", 404);
  const o = JSON.parse(row.data),
    next = req.body.status,
    tracking = text(req.body.tracking, 100);
  const allowed = {
    baru: ["dibayar", "batal"],
    dibayar: ["dikemas", "batal"],
    dikemas: ["dikirim", "batal"],
    dikirim: ["selesai"],
    selesai: [],
    batal: [],
  };
  if (next !== o.status && !allowed[o.status]?.includes(next))
    throw fail("Urutan status pesanan tidak valid.");
  if (next === "dikirim" && !tracking)
    throw fail("Isi nomor resi sebelum mengirim pesanan.");
  tx(() => {
    if (next === "batal" && o.status !== "batal") {
      for (const item of o.items) {
        db.prepare("UPDATE variants SET stock=stock+? WHERE id=?").run(
          item.quantity,
          item.variantId,
        );
        const v = db
          .prepare("SELECT stock FROM variants WHERE id=?")
          .get(item.variantId);
        if (!v)
          throw fail("Varian pesanan telah dihapus; hubungi pengelola.", 409);
        stockLog(
          item.variantId,
          item.quantity,
          v.stock,
          `Pembatalan ${o.id}`,
          req.user.id,
        );
      }
      for (const pid of new Set(o.items.map((i) => i.productId))) {
        const p = doc("product", pid);
        put("product", pid, { ...p, version: (p.version || 0) + 1 });
      }
      if (o.couponId) {
        const c = doc("coupon", o.couponId);
        if (c) put("coupon", c.id, { ...c, used: Math.max(0, c.used - 1) });
      }
    }
    if (next !== o.status)
      o.history.push({
        status: next,
        at: now(),
        note: "Diperbarui admin VASSEL",
      });
    o.status = next;
    o.tracking = tracking;
    db.prepare("UPDATE orders SET data=? WHERE id=?").run(
      JSON.stringify(o),
      o.id,
    );
  });
  res.json(o);
});
app.patch("/api/admin/reviews/:id", (req, res) => {
  const r = doc("review", req.params.id);
  if (!r) throw fail("Ulasan tidak ditemukan.", 404);
  if (!["approved", "rejected", "pending"].includes(req.body.status))
    throw fail("Status ulasan tidak valid.");
  put("review", r.id, { ...r, status: req.body.status });
  res.json({ ok: true });
});
const uploadDir = path.join(dataDir, "uploads");
mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
app.post("/api/admin/upload", upload.single("file"), (req, res) => {
  const f = req.file;
  if (!f) throw fail("Pilih file gambar.");
  const b = f.buffer;
  let ext = "";
  if (b.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ext = "jpg";
  else if (
    b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    ext = "png";
  else if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    ext = "webp";
  if (!ext) throw fail("Gunakan JPG, PNG, atau WebP maksimal 5 MB.");
  const name = id() + "." + ext;
  writeFileSync(path.join(uploadDir, name), b);
  res.status(201).json({
    url: "/uploads/" + name,
    type: "image",
  });
});
app.use(
  "/uploads",
  express.static(uploadDir, {
    maxAge: "1y",
    immutable: true,
    dotfiles: "deny",
  }),
);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint tidak ditemukan." }),
);
app.use((err, req, res, next) => {
  if (!req.path.startsWith("/api")) return next(err);
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  if (status === 500) console.error(err.message);
  res.status(status).json({
    error:
      status === 500
        ? "Permintaan tidak dapat disimpan. Periksa duplikasi SKU atau coba lagi."
        : err.code === "LIMIT_FILE_SIZE"
          ? "File maksimal 5 MB."
          : err.message,
  });
});
