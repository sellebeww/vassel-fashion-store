// Vercel entry: only /tmp is writable there.
// shortcut: SQLite in /tmp resets on every cold start (demo data only), move to a hosted DB for real orders.
process.env.VASSEL_DATA_DIR ||= "/tmp/vassel";
process.env.COOKIE_SECURE ||= "true";
const { app } = await import("../server/app.mjs");
// Behind Vercel's proxy, so req.protocol is https for the origin check.
app.set("trust proxy", 1);
export default app;
