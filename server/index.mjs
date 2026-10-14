import { app } from "./app.mjs";
import express from "express";
import path from "node:path";
const production = process.env.NODE_ENV === "production";
let vite;
if (production) {
  app.use(express.static(path.resolve("dist"), { maxAge: "1h" }));
  app.use((req, res) => res.sendFile(path.resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT || 3002);
const server = app.listen(port, process.env.HOST || "127.0.0.1", (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log(
    `VASSEL ${production ? "production" : "development"} → http://localhost:${port}`,
  );
});
server.on("error", (e) => {
  console.error(e.message);
  process.exit(1);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    server.close();
    vite?.close();
    process.exit(0);
  });
