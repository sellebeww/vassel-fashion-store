// Explicit operator command. Never exposed as an API endpoint.
process.env.DEMO_MODE = "false";
const { db, id, now, hashPassword } = await import("./database.mjs");
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  name = (process.env.ADMIN_NAME || "Admin VASSEL").trim(),
  password = process.env.ADMIN_PASSWORD || "";
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  password.length < 14 ||
  password.length > 128
) {
  console.error("Isi ADMIN_EMAIL dan ADMIN_PASSWORD (14–128 karakter).");
  process.exitCode = 1;
} else if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) {
  console.error("Email sudah terdaftar. Perintah ini tidak menimpa akun.");
  process.exitCode = 1;
} else {
  db.prepare(
    "INSERT INTO users(id,email,name,password,role,createdAt) VALUES(?,?,?,?,?,?)",
  ).run(id(), email, name, hashPassword(password), "admin", now());
  console.log("Akun admin berhasil dibuat.");
}
db.close();
