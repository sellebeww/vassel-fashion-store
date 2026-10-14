import AxeBuilder from "@axe-core/playwright";
import { chromium, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
const tempDir = mkdtempSync(path.join(tmpdir(), "vassel-browser-"));
const port = 3187;
const origin = process.env.VASSEL_QA_URL || "http://127.0.0.1:" + port;
const server = process.env.VASSEL_QA_URL
  ? null
  : spawn(process.execPath, ["server/index.mjs"], {
      env: {
        ...process.env,
        PORT: String(port),
        VASSEL_DATA_DIR: tempDir,
        NODE_ENV: "production",
      },
      stdio: "ignore",
    });
if (server) {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(origin + "/api/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) {
    server.kill();
    throw new Error("Server pengujian belum siap.");
  }
}
process.on("exit", () => {
  server?.kill();
  rmSync(tempDir, { recursive: true, force: true });
});
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  admin = await adminContext.newPage();
const errors = [],
  passed = [],
  failures = [];
for (const p of [page, admin]) p.on("pageerror", (e) => errors.push(e.message));
const go = async (p, url) => {
  await p.goto(origin + url, { waitUntil: "domcontentloaded" });
  await p.locator(".site-header").waitFor();
};
async function check(name, fn) {
  try {
    await fn();
    passed.push(name);
    console.log("PASS " + name);
  } catch (e) {
    failures.push({ name, message: e.message });
    console.log("FAIL " + name + ": " + e.message);
  }
}
async function api(p, url, method = "GET", body) {
  return p.evaluate(
    async ({ url, method, body }) => {
      const r = await fetch("/api" + url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Vassel-Client": "web",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, data: await r.json() };
    },
    { url, method, body },
  );
}
mkdirSync("output/qa", { recursive: true });
let orderId, initialStock, product, updatedPrice;
await check("Original editorial homepage uses a static image", async () => {
  await go(page, "/");
  await expect(page.locator("h1")).toHaveText("Presence,without a word.");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.locator(".campaign-media")).toHaveAttribute(
    "src",
    "/images/vassel-campaign.webp",
  );
  await page.screenshot({ path: "output/qa/store-hero-desktop.png" });
});
await check(
  "Catalog search, category, filters, sorting and load more",
  async () => {
    await go(page, "/shop");
    await expect(page.locator(".v-product")).toHaveCount(20);
    await page.getByRole("button", { name: "Discover more" }).click();
    await expect(page.locator(".v-product")).toHaveCount(40);
    await page.getByRole("button", { name: /^Filter/ }).click();
    await page.getByLabel("Category", { exact: true }).selectOption("tas");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Handbags",
    );
    await page.getByLabel("Sort by").selectOption("low");
    const prices = await page.locator(".v-product .v-price").allTextContents();
    expect(prices[0]).toContain("499.000");
    await page.getByLabel("Availability").selectOption("empty");
    expect(await page.locator(".v-product").count()).toBeGreaterThan(0);
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page
      .getByRole("searchbox", { name: "Search creations" })
      .fill("tidak-ada-produk");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "No pieces found." }),
    ).toBeVisible();
  },
);
await check("Register through form, role cannot open admin", async () => {
  await go(page, "/register");
  await page.getByLabel("Full name").fill("Pembeli QA Vassel");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`browser-${Date.now()}@vassel.test`);
  await page.getByLabel("Password", { exact: true }).fill("VasselQA!2026");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account$/);
  await go(page, "/admin");
  await expect(
    page.getByRole("heading", { name: "Administrator access only." }),
  ).toBeVisible();
  expect((await api(page, "/admin/data")).status).toBe(403);
});
await check("Product gallery, exact variant, wishlist and cart", async () => {
  const d = await api(page, "/bootstrap");
  product = d.data.products.find((p) => p.id === "tas-01");
  initialStock = product.variants[0].stock;
  await go(page, "/products/" + product.slug);
  await page.getByRole("button", { name: "View image 2", exact: true }).click();
  await expect(page.locator(".v-main-photo")).toHaveAttribute(
    "src",
    product.images[1],
  );
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page
    .getByRole("button", { name: "Save this piece", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add to shopping bag", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("added");
  await go(page, "/cart");
  await expect(page.locator(".v-cart-line")).toHaveCount(1);
  await go(page, "/wishlist");
  await expect(page.locator(".v-product")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".v-product")).toHaveCount(1);
});
await check(
  "Checkout address, promo, order creation and inventory deduction",
  async () => {
    await go(page, "/checkout");
    for (const [label, value] of [
      ["Recipient name", "Pembeli QA Vassel"],
      ["Phone number", "081234567890"],
      ["Postal code", "12120"],
      ["Street address", "Jalan Melati nomor 20"],
      ["City", "Jakarta Selatan"],
      ["Province / region", "DKI Jakarta"],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByLabel("Promo code", { exact: true }).fill("VASSEL10");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.locator(".v-totals")).toContainText("49.900");
    await page
      .getByRole("button", { name: "Place demo order", exact: true })
      .click();
    await expect(page).toHaveURL(/\/orders\/VS-/);
    orderId = page.url().split("/").pop();
    await expect(page.locator("h1")).toContainText("Thank you");
    const d = await api(page, "/bootstrap");
    expect(
      d.data.products.find((p) => p.id === product.id).variants[0].stock,
    ).toBe(initialStock - 1);
    const o = (await api(page, "/orders/" + orderId)).data;
    expect(o.total).toBe(469100);
    await page.screenshot({
      animations: "disabled",
      path: "output/qa/store-order.png",
      fullPage: true,
    });
  },
);
await check("Admin login and order progression with tracking", async () => {
  await go(admin, "/admin/login");
  await admin.getByLabel("Email", { exact: true }).fill("admin@vassel.test");
  await admin.getByLabel("Password", { exact: true }).fill("VasselAdmin!2026");
  await admin.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(admin).toHaveURL(/\/admin$/);
  await admin
    .locator(".v-admin-nav")
    .getByRole("button", { name: /^Orders/ })
    .click();
  for (const status of ["dibayar", "dikemas", "dikirim", "selesai"]) {
    const order = admin
      .locator("details.v-admin-order")
      .filter({ hasText: orderId });
    await order.locator("summary").click();
    await order.getByLabel("Order status").selectOption(status);
    if (status === "dikirim" || status === "selesai")
      await order.getByLabel("Tracking number").fill("DEMO-VASSEL-001");
    await order.getByRole("button", { name: "Update order" }).click();
    await expect(order.locator("summary")).toContainText(
      {
        dibayar: "Paid",
        dikemas: "Being prepared",
        dikirim: "On its way",
        selesai: "Completed",
      }[status],
    );
  }
  await go(page, "/orders/" + orderId);
  await expect(page.locator(".v-timeline .done")).toHaveCount(5);
  await expect(
    page.getByText("DEMO-VASSEL-001", { exact: true }),
  ).toBeVisible();
});
await check(
  "Admin product price, visibility and stock reach the buyer",
  async () => {
    await admin
      .locator(".v-admin-nav")
      .getByRole("button", { name: "Products & inventory" })
      .click();
    await admin.getByLabel("Search products or SKU").fill(product.name);
    await admin.getByRole("button", { name: "Edit", exact: true }).click();
    await admin.getByLabel("Price (Rp)", { exact: true }).fill("529000");
    await admin.getByLabel("Stock", { exact: true }).first().fill("7");
    await admin.getByLabel("Show product").uncheck();
    await admin
      .getByRole("button", { name: "Save product", exact: true })
      .first()
      .click();
    await expect(admin.getByLabel("Search products or SKU")).toBeVisible();
    await go(page, "/products/" + product.slug);
    await expect(
      page.getByRole("heading", { name: "This piece could not be found." }),
    ).toBeVisible();
    await admin.getByRole("button", { name: "Edit", exact: true }).click();
    await admin.getByLabel("Show product").check();
    await admin
      .getByRole("button", { name: "Save product", exact: true })
      .first()
      .click();
    await expect(admin.getByLabel("Search products or SKU")).toBeVisible();
    await go(page, "/products/" + product.slug);
    await expect(page.locator(".v-price-large")).toContainText("529.000");
    await page.getByRole("button", { name: "S", exact: true }).click();
    await expect(page.locator(".v-stock")).toContainText("7");
  },
);
await check("Hero content update and restoration", async () => {
  await go(page, "/");
  await admin
    .locator(".v-admin-nav")
    .getByRole("button", { name: "Homepage" })
    .click();
  await admin
    .getByLabel("Hero headline", { exact: true })
    .fill("Kampanye VASSEL yang baru.");
  await admin.getByRole("button", { name: "Save homepage" }).click();
  await expect(admin.getByRole("status")).toContainText("Changes saved");
  await expect(page.locator("h1")).toHaveText("Kampanye VASSEL yang baru.");
  await admin
    .getByLabel("Hero headline", { exact: true })
    .fill("Presence, without a word.");
  await admin.getByRole("button", { name: "Save homepage" }).click();
  await expect(admin.getByRole("status")).toContainText("Changes saved");
  await expect(page.locator("h1")).toHaveText("Presence,without a word.");
});
await check(
  "Review moderated then displayed, newsletter and restock",
  async () => {
    await go(page, "/products/" + product.slug);
    await page
      .getByText("Write a review after your order is completed", {
        exact: true,
      })
      .click();
    await page
      .getByLabel("Your experience")
      .fill("Pilihan VASSEL terasa rapi dan alur pemesanannya mudah diikuti.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByRole("status")).toContainText("moderation");
    await admin
      .locator(".v-admin-nav")
      .getByRole("button", { name: "Engagement", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Refresh data", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Publish", exact: true })
      .first()
      .click();
    await expect(admin.getByRole("status")).toContainText("saved");
    await go(page, "/products/" + product.slug);
    await expect(page.locator(".v-reviews blockquote")).toHaveCount(1);
    await go(page, "/");
    await page
      .getByLabel("Email address", { exact: true })
      .fill("qa-newsletter@vassel.test");
    await page.getByRole("checkbox", { name: /I agree to receive/ }).check();
    await page
      .getByRole("button", { name: "Join the list", exact: true })
      .click();
    await expect(
      page.locator(".maison-newsletter [role=status]"),
    ).toContainText("Thank you");
    await go(page, "/products/vassel-tas-nara");
    await page.getByRole("button", { name: "S Sold out", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sold out", exact: true }),
    ).toBeDisabled();
    await page
      .getByLabel("Notify me when available")
      .fill("qa-restock@vassel.test");
    await page.getByRole("button", { name: "Save my request" }).click();
    await expect(page.getByRole("status")).toContainText("saved");
  },
);
await check("Admin sections, image upload and new product CRUD", async () => {
  for (const name of [
    "Categories & collections",
    "Customers",
    "Offers & coupons",
    "Stock history",
  ]) {
    await admin
      .locator(".v-admin-nav")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(admin.locator(".v-admin-heading h1")).toHaveText(name);
  }
  await admin
    .locator(".v-admin-nav")
    .getByRole("button", { name: "Products & inventory" })
    .click();
  await admin.getByRole("button", { name: "Add product", exact: true }).click();
  await admin
    .getByLabel("Product name", { exact: true })
    .fill("VASSEL QA Limited");
  await admin.getByLabel("Slug / URL").fill("vassel-qa-" + Date.now());
  await admin
    .getByLabel("Product SKU", { exact: true })
    .fill("VS-QA-" + Date.now());
  await admin
    .getByLabel("Description", { exact: true })
    .fill("Contoh produk untuk verifikasi editor admin.");
  await admin.getByLabel("Materials", { exact: true }).fill("Katun");
  await admin.getByLabel("Size guide", { exact: true }).fill("M: 100 cm");
  await admin
    .locator("input[type=file]")
    .first()
    .setInputFiles("public/images/vassel-signature.webp");
  await expect(admin.locator(".v-admin-gallery img").first()).toHaveAttribute(
    "src",
    /\/uploads\//,
  );
  await admin
    .getByRole("button", { name: "Save product", exact: true })
    .first()
    .click();
  await expect(admin.getByLabel("Search products or SKU")).toBeVisible();
  await admin.getByLabel("Search products or SKU").fill("VASSEL QA Limited");
  admin.once("dialog", (d) => d.accept());
  await admin
    .getByRole("button", { name: "Delete VASSEL QA Limited", exact: true })
    .click();
  await expect(admin.locator("tbody tr")).toHaveCount(0);
});
await check(
  "English and French persist across routes without changing cart or form values",
  async () => {
    await go(page, "/");
    await page.getByLabel("Language / Langue").selectOption("fr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1")).toHaveText("Une présence,sans un mot.");
    await page.reload();
    await expect(page.getByLabel("Language / Langue")).toHaveValue("fr");
    await go(page, "/shop");
    await page.getByRole("button", { name: "Filtres", exact: true }).click();
    await page.getByLabel("Catégorie", { exact: true }).selectOption("tas");
    await expect(page.locator("h1")).toHaveText("Sacs");
    await page.getByLabel("Couleur", { exact: true }).selectOption("Hitam");
    expect(await page.locator(".v-product").count()).toBeGreaterThan(0);
    await expect(page).toHaveURL(/color=Hitam/);
    await go(page, "/products/vassel-tas-senja");
    await page.getByRole("button", { name: "S", exact: true }).click();
    await page
      .getByRole("button", { name: "Ajouter au panier", exact: true })
      .click();
    await go(page, "/checkout");
    await page
      .getByLabel("Nom du destinataire", { exact: true })
      .fill("Vassel Bilingual");
    await page.getByLabel("Language / Langue").selectOption("en");
    await expect(
      page.getByLabel("Recipient name", { exact: true }),
    ).toHaveValue("Vassel Bilingual");
    await go(page, "/cart");
    await expect(page.locator(".v-cart-line")).toHaveCount(1);
    await go(page, "/");
    await page.getByLabel("Language / Langue").selectOption("fr");
    await admin
      .locator(".v-admin-nav")
      .getByRole("button", { name: "Homepage", exact: true })
      .click();
    await admin
      .getByLabel("FR · Hero headline", { exact: true })
      .fill("La nouvelle signature Vassel.");
    await admin
      .getByRole("button", { name: "Save homepage", exact: true })
      .click();
    await expect(page.locator("h1")).toHaveText(
      "La nouvelle signature Vassel.",
    );
    await admin
      .getByLabel("FR · Hero headline", { exact: true })
      .fill("Une présence, sans un mot.");
    await admin
      .getByRole("button", { name: "Save homepage", exact: true })
      .click();
    await expect(page.locator("h1")).toHaveText("Une présence,sans un mot.");
    await page.getByLabel("Language / Langue").selectOption("en");
    await expect(page.locator("h1")).toHaveText("Presence,without a word.");
    await admin.getByLabel("Language / Langue").selectOption("fr");
    await expect(admin.locator(".v-admin-heading h1")).toHaveText(
      "Page d’accueil",
    );
    await admin.getByLabel("Language / Langue").selectOption("en");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.getByLabel("Language / Langue").selectOption("fr");
      for (const route of [
        "/",
        "/shop",
        "/account",
        "/checkout",
        "/collections/signature",
      ]) {
        await go(page, route);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `French ${route} ${width}`,
        ).toBe(true);
      }
    }
    await page.getByLabel("Language / Langue").selectOption("en");
  },
);
await check(
  "Mobile and reduced motion use static poster; pages fit all widths",
  async () => {
    const routes = [
      "/",
      "/shop",
      "/products/" + product.slug,
      "/cart",
      "/checkout",
      "/account",
      "/maison",
      "/atelier",
      "/collections/signature",
      "/help",
      "/privacy",
      "/login",
      "/not-real",
    ];
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await go(page, route);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} width ${width}`,
        ).toBe(true);
        await expect(page.locator("h1, .v-empty h2").first()).toBeVisible();
        if (route === "/" && width < 768)
          await expect(page.locator("video")).toHaveCount(0);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await go(page, "/");
    await expect(page.locator("video")).toHaveCount(0);
    await page
      .locator("img")
      .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = "eager")));
    await page.waitForFunction(() =>
      [...document.images].every((i) => i.complete),
    );
    expect(
      await page
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.filter((i) => !i.naturalWidth).map((i) => i.src),
        ),
    ).toEqual([]);
    await page.screenshot({
      animations: "disabled",
      path: "output/qa/store-home-desktop.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 900 });
    await go(page, "/");
    await page
      .locator("img")
      .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = "eager")));
    await page.waitForFunction(() =>
      [...document.images].every((i) => i.complete),
    );
    await page.screenshot({
      animations: "disabled",
      path: "output/qa/store-home-mobile.png",
      fullPage: true,
    });
    await page.screenshot({ path: "output/qa/store-hero-mobile.png" });
    await admin.setViewportSize({ width: 390, height: 900 });
    for (const [id, name] of [
      ["dashboard", "Overview"],
      ["products", "Products & inventory"],
      ["content", "Homepage"],
      ["orders", "Orders"],
    ]) {
      await admin
        .locator(".v-admin-nav")
        .getByRole("button", { name: new RegExp("^" + name.replace("&", "&")) })
        .click();
      expect(
        await admin.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "admin " + id,
      ).toBe(true);
    }
    await admin.screenshot({
      path: "output/qa/store-admin-mobile.png",
      fullPage: true,
    });
  },
);
await check("Restored Maison and Atelier, French campaign and all local media", async()=>{
 await page.setViewportSize({width:1440,height:1000});
 await go(page,'/maison');await expect(page.locator('.brand-essay')).toBeVisible();
 await go(page,'/atelier');await expect(page.locator('.atelier-principles article')).toHaveCount(3);
 await go(page,'/');await page.getByLabel('Language / Langue').selectOption('fr');
 await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
 await page.screenshot({path:'output/qa/store-home-french.png',fullPage:true,animations:'disabled'});
 const body=await page.locator('body').innerText();expect(body).not.toMatch(/Elegan|Busana|Terlaris|Pilihan/);
 const boot=(await api(page,'/bootstrap')).data;
 const media=[...new Set([...boot.products.flatMap(p=>p.images),...boot.categories.map(c=>c.image),boot.home.poster,boot.home.promoImage,'/brand/vassel-original.webp'])];
 for(const image of media)expect((await page.request.get(origin+image)).status(),image).toBe(200);
 await page.getByLabel('Language / Langue').selectOption('en');
});
await check("Automated WCAG AA audit on storefront and admin", async () => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await admin.setViewportSize({ width: 1440, height: 1000 });
  for (const [target, route] of [
    [page, "/"],
    [page, "/shop"],
    [page, "/products/" + product.slug],
    [page, "/login"],
    [page, "/account"],
    [page, "/maison"],
    [page, "/atelier"],
    [page, "/collections/signature"],
    [admin, "/admin"],
  ]) {
    await go(target, route);
    const result = await new AxeBuilder({ page: target })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
      route,
    ).toEqual([]);
  }
});
await check(
  "Logout invalidates session and checkout requires login",
  async () => {
    await go(page, "/account");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(origin + "/");
    expect((await api(page, "/orders")).status).toBe(401);
    await go(page, "/checkout");
    await expect(
      page.getByRole("link", { name: "Sign in to checkout" }),
    ).toBeVisible();
  },
);
await browser.close();
server?.kill();
writeFileSync(
  "output/qa/store-results.json",
  JSON.stringify({ passed, failures, errors }, null, 2),
);
console.log(
  JSON.stringify({ passed: passed.length, failures, errors }, null, 2),
);
if (failures.length || errors.length) process.exitCode = 1;
