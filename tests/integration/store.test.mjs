import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  rmSync,
  readdirSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
process.env.VASSEL_DATA_DIR = mkdtempSync(path.join(tmpdir(), "vassel-api-"));
process.env.DEMO_MODE = "true";
const { app } = await import("../../server/app.mjs");
const { db, product } = await import("../../server/database.mjs");
let server, origin;
before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  origin = "http://127.0.0.1:" + server.address().port;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(process.env.VASSEL_DATA_DIR, { recursive: true, force: true });
});
function client() {
  let cookie = "";
  return async (endpoint, method = "GET", body, custom = {}) => {
    const res = await fetch(origin + "/api" + endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Vassel-Client": "web",
        Cookie: cookie,
        ...custom,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.headers.get("set-cookie"))
      cookie = res.headers.get("set-cookie").split(";")[0];
    return { status: res.status, body: await res.json() };
  };
}
const admin = client(),
  buyer = client(),
  guest = client();
let selected, variant, initial, order;
const address = {
  label: "Rumah",
  name: "QA Vassel",
  phone: "081234567890",
  street: "Jalan Melati nomor 20",
  city: "Jakarta Selatan",
  province: "DKI Jakarta",
  postalCode: "12120",
};
test("Seed: 25 per category, unique SKU, 3 images, variant availability", async () => {
  const r = await guest("/bootstrap");
  assert.equal(r.status, 200);
  assert.equal(r.body.products.length, 120);
  assert.equal(r.body.categories.length, 5);
  for (const p of r.body.products) {
    assert.equal(p.images.length, 3);
    for (const image of p.images)
      assert.ok(existsSync("public" + image), image);
    assert.ok(p.price >= 129000);
    assert.ok(p.name.startsWith("VASSEL"));
  }
  assert.equal(
    new Set(r.body.products.flatMap((p) => p.variants.map((v) => v.sku))).size,
    r.body.products.flatMap((p) => p.variants).length,
  );
  assert.ok(
    r.body.products.some((p) => p.variants.every((v) => v.stock === 0)),
  );
  assert.ok(r.body.products.some((p) => p.variants.some((v) => v.stock === 3)));
});
test("Authentication, forged roles, guest checkout and buyer admin access rejected", async () => {
  assert.equal((await guest("/orders", "POST", {})).status, 401);
  assert.equal((await guest("/admin/data")).status, 401);
  let r = await buyer("/auth/register", "POST", {
    name: "QA Buyer",
    email: "qa@vassel.test",
    password: "QualityVassel!2026",
    role: "admin",
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, "buyer");
  assert.equal((await buyer("/admin/data")).status, 403);
  assert.equal(
    (
      await buyer("/auth/login", "POST", {
        email: "qa@vassel.test",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await guest("/auth/login", "POST", {
        email: "qa@vassel.test",
        password: "QualityVassel!2026",
        admin: true,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await admin("/auth/login", "POST", {
        email: "admin@vassel.test",
        password: "VasselAdmin!2026",
        admin: true,
      })
    ).status,
    200,
  );
  const d = (await admin("/admin/data")).body;
  assert.equal(d.products.length, 125);
  selected = d.products.find((p) => p.id === "tas-01");
  variant = selected.variants[0];
  initial = variant.stock;
});
test("CSRF and invalid address are rejected", async () => {
  assert.equal(
    (
      await buyer(
        "/me",
        "PATCH",
        { name: "Hijack" },
        { Origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  assert.equal(
    (await buyer("/me", "PATCH", { name: "Hijack" }, { "X-Vassel-Client": "" }))
      .status,
    403,
  );
  assert.equal(
    (
      await buyer("/me/addresses", "PUT", {
        addresses: [{ name: "Incomplete" }],
      })
    ).status,
    400,
  );
  assert.equal(
    (await buyer("/me/addresses", "PUT", { addresses: [address] })).status,
    200,
  );
});
test("Wishlist and cart persist on server", async () => {
  assert.equal(
    (await buyer("/me/wishlist", "PUT", { ids: [selected.id] })).status,
    200,
  );
  assert.equal(
    (
      await buyer("/me/cart", "PUT", {
        items: [{ variantId: variant.id, quantity: 2 }],
      })
    ).status,
    200,
  );
  const r = await buyer("/me");
  assert.deepEqual(r.body.wishlist, [selected.id]);
  assert.equal(r.body.cart[0].quantity, 2);
});
test("Server-authoritative quote, coupon, checkout, stock and idempotency", async () => {
  const body = {
    requestKey: "integration-order-0001",
    items: [{ variantId: variant.id, quantity: 2, price: 1 }],
    address,
    shippingMethod: "reguler",
    paymentMethod: "qris-demo",
    coupon: "VASSEL10",
    total: 1,
  };
  const q = await buyer("/checkout/quote", "POST", body);
  assert.equal(q.status, 200);
  assert.equal(q.body.subtotal, selected.price * 2);
  assert.equal(q.body.discount, Math.min(selected.price * 0.2, 100000));
  const r = await buyer("/orders", "POST", body);
  assert.equal(r.status, 201);
  order = r.body;
  assert.equal(order.total, q.body.total);
  assert.equal(product(selected.id).variants[0].stock, initial - 2);
  const again = await buyer("/orders", "POST", body);
  assert.equal(again.body.id, order.id);
  assert.equal(product(selected.id).variants[0].stock, initial - 2);
  assert.equal((await buyer("/me")).body.cart.length, 0);
});
test("Stale admin inventory cannot overwrite a newer purchase", async () => {
  const r = await admin("/admin/products/" + selected.id, "PUT", selected);
  assert.equal(r.status, 409);
  assert.equal(product(selected.id).variants[0].stock, initial - 2);
});
test("Order privacy, valid lifecycle, resi required, review moderation", async () => {
  const other = client();
  await other("/auth/login", "POST", {
    email: "pembeli@vassel.test",
    password: "VasselBelanja!2026",
  });
  assert.equal((await other("/orders/" + order.id)).status, 404);
  assert.equal(
    (await admin("/admin/orders/" + order.id, "PATCH", { status: "selesai" }))
      .status,
    400,
  );
  for (const status of ["dibayar", "dikemas"])
    assert.equal(
      (
        await admin("/admin/orders/" + order.id, "PATCH", {
          status,
          tracking: "",
        })
      ).status,
      200,
    );
  assert.equal(
    (
      await admin("/admin/orders/" + order.id, "PATCH", {
        status: "dikirim",
        tracking: "",
      })
    ).status,
    400,
  );
  for (const status of ["dikirim", "selesai"])
    assert.equal(
      (
        await admin("/admin/orders/" + order.id, "PATCH", {
          status,
          tracking: "DEMO-001",
        })
      ).status,
      200,
    );
  const r = await buyer("/reviews", "POST", {
    productId: selected.id,
    rating: 5,
    text: "Produk demo sesuai pilihan dan alur belanja mudah.",
  });
  assert.equal(r.status, 201);
  assert.equal((await guest("/reviews/" + selected.id)).body.length, 0);
  await admin("/admin/reviews/" + r.body.id, "PATCH", { status: "approved" });
  assert.equal((await guest("/reviews/" + selected.id)).body.length, 1);
});
test("Last-stock concurrency allows one order, cancellation restores exactly once", async () => {
  let p = product(selected.id);
  p.variants[1].stock = 1;
  assert.equal((await admin("/admin/products/" + p.id, "PUT", p)).status, 200);
  const make = (key) =>
    buyer("/orders", "POST", {
      requestKey: key,
      items: [{ variantId: p.variants[1].id, quantity: 1 }],
      address,
      paymentMethod: "transfer-demo",
    });
  const results = await Promise.all([
    make("last-unit-order-A"),
    make("last-unit-order-B"),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const bought = results.find((r) => r.status === 201).body;
  assert.equal(product(p.id).variants[1].stock, 0);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await admin("/admin/orders/" + bought.id, "PATCH", { status: "batal" }))
        .status,
      200,
    );
  assert.equal(product(p.id).variants[1].stock, 1);
});
test("Admin changes propagate; hidden products cannot be purchased", async () => {
  let p = product(selected.id);
  p.price = 599000;
  p.comparePrice = 799000;
  p.visible = false;
  assert.equal((await admin("/admin/products/" + p.id, "PUT", p)).status, 200);
  assert.ok(
    !(await guest("/bootstrap")).body.products.some((x) => x.id === p.id),
  );
  assert.equal(
    (
      await buyer("/checkout/quote", "POST", {
        items: [{ variantId: p.variants[0].id, quantity: 1 }],
      })
    ).status,
    409,
  );
  p = product(p.id);
  p.visible = true;
  await admin("/admin/products/" + p.id, "PUT", p);
  assert.equal(
    (await guest("/bootstrap")).body.products.find((x) => x.id === p.id).price,
    599000,
  );
  const home = (await guest("/bootstrap")).body.home;
  home.title = "Kampanye QA VASSEL";
  await admin("/admin/home", "PUT", home);
  assert.equal((await guest("/bootstrap")).body.home.title, home.title);
});
test("Newsletter, restock, analytics, and low-stock history persist", async () => {
  assert.equal(
    (
      await guest("/newsletter", "POST", {
        email: "subscriber@vassel.test",
        consent: true,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await guest("/restock", "POST", {
        email: "subscriber@vassel.test",
        variantId: variant.id,
      })
    ).status,
    200,
  );
  await guest("/events", "POST", { kind: "view", productId: selected.id });
  const d = (await admin("/admin/data")).body;
  assert.ok(d.stockLog.length >= 4);
  assert.ok(d.engagement.some((e) => e.kind === "newsletter"));
  assert.ok(d.engagement.some((e) => e.kind === "restock"));
  assert.ok(d.events.some((e) => e.kind === "view"));
});
test("Invalid price approval, nonexistent media and duplicate SKUs are rejected", async () => {
  const p = product(selected.id);
  const stock = p.variants[0].stock;
  const r = await buyer("/orders", "POST", {
    requestKey: "unexpected-price-order",
    items: [{ variantId: p.variants[0].id, quantity: 1 }],
    address,
    paymentMethod: "transfer-demo",
    expectedTotal: 1,
  });
  assert.equal(r.status, 409);
  assert.equal(product(p.id).variants[0].stock, stock);
  assert.equal(
    (
      await admin("/admin/products/" + p.id, "PUT", {
        ...p,
        images: ["/images/missing.webp", p.images[1]],
      })
    ).status,
    400,
  );
  const other = (await admin("/admin/data")).body.products.find(
    (x) => x.id !== p.id,
  );
  assert.equal(
    (await admin("/admin/products/" + p.id, "PUT", { ...p, sku: other.sku }))
      .status,
    400,
  );
});
test("Password reset token is private, single-use, and invalidates sessions", async () => {
  const r = await buyer("/auth/forgot", "POST", { email: "qa@vassel.test" });
  assert.equal(r.status, 200);
  assert.ok(!JSON.stringify(r.body).includes("token="));
  const files = readdirSync(
    path.join(process.env.VASSEL_DATA_DIR, "mail-outbox"),
  );
  const mail = JSON.parse(
    readFileSync(
      path.join(process.env.VASSEL_DATA_DIR, "mail-outbox", files[0]),
    ),
  );
  const token = new URL(mail.url).searchParams.get("token");
  assert.equal(
    (await guest("/auth/reset", "POST", { token, password: "NewVassel!2026" }))
      .status,
    200,
  );
  assert.equal((await buyer("/orders")).status, 401);
  assert.equal(
    (await guest("/auth/reset", "POST", { token, password: "NewVassel!2026" }))
      .status,
    400,
  );
  assert.equal(
    (
      await buyer("/auth/login", "POST", {
        email: "qa@vassel.test",
        password: "NewVassel!2026",
      })
    ).status,
    200,
  );
  await buyer("/auth/logout", "POST");
  assert.equal((await buyer("/orders")).status, 401);
});
test("Bilingual homepage and product copy survive admin updates; video is not stored", async () => {
  const original = (await guest("/bootstrap")).body.home;
  const home = {
    ...original,
    title: "The Vassel edit",
    translations: {
      fr: {
        title: "La sélection Vassel",
        description: "Une nouvelle perspective.",
      },
    },
    video: "/video/removed.mp4",
  };
  const saved = await admin("/admin/home", "PUT", home);
  assert.equal(saved.status, 200);
  const publicHome = (await guest("/bootstrap")).body.home;
  assert.equal(publicHome.title, home.title);
  assert.equal(publicHome.translations.fr.title, home.translations.fr.title);
  assert.equal("video" in publicHome, false);
  const p = product(selected.id);
  const stock = p.variants.map((v) => v.stock);
  p.translations = {
    fr: { description: "Une pièce Vassel au caractère singulier." },
  };
  const edited = await admin("/admin/products/" + p.id, "PUT", p);
  assert.equal(edited.status, 200);
  assert.equal(
    product(p.id).translations.fr.description,
    p.translations.fr.description,
  );
  assert.deepEqual(
    product(p.id).variants.map((v) => v.stock),
    stock,
  );
  await admin("/admin/home", "PUT", original);
});
test("Hero upload accepts images and rejects obsolete video content", async () => {
  const login = await fetch(origin + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Vassel-Client": "web" },
    body: JSON.stringify({
      email: "admin@vassel.test",
      password: "VasselAdmin!2026",
      admin: true,
    }),
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  for (const [name, body, status] of [
    [
      "test.mp4",
      Buffer.from([0, 0, 0, 20, 102, 116, 121, 112, 105, 115, 111, 109]),
      400,
    ],
    ["test.webp", readFileSync("public/images/vassel-campaign.webp"), 201],
  ]) {
    const form = new FormData();
    form.append("file", new Blob([body]), name);
    const res = await fetch(origin + "/api/admin/upload", {
      method: "POST",
      headers: { Cookie: cookie, "X-Vassel-Client": "web" },
      body: form,
    });
    assert.equal(res.status, status);
    if (status === 201) assert.equal((await res.json()).type, "image");
  }
});
