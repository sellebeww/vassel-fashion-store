import { tr, getLocale } from "./i18n";
import React, { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BarChart3,
  Box,
  ChartNoAxesCombined,
  ChevronLeft,
  FileImage,
  Heart,
  LayoutDashboard,
  Mail,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { api, money, date, statusName } from "./api";
import { useStore } from "./state";
import {
  Field,
  Select,
  Textarea,
  Busy,
  Message,
  Empty,
  Upload,
} from "./Common";
import type {
  AdminData,
  Product,
  Category,
  Coupon,
  Home,
  Order,
} from "./types";
const tabs = [
  ["dashboard", "Ringkasan", LayoutDashboard],
  ["products", "Produk & stok", Package],
  ["categories", "Kategori & koleksi", Tag],
  ["orders", "Pesanan", ShoppingBag],
  ["customers", "Pelanggan", Users],
  ["coupons", "Promo & kupon", Tag],
  ["content", "Halaman depan", FileImage],
  ["engagement", "Engagement", Heart],
  ["inventory", "Riwayat stok", Box],
] as const;
export default function Admin() {
  const { data: store, refresh, notify } = useStore();
  const [data, setData] = useState<AdminData | null>(null),
    [tab, setTab] = useState("dashboard"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState<Product | null>(null);
  const load = async () => {
    try {
      setData(await api("/admin/data"));
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };
  useEffect(() => {
    if (store.me?.role === "admin") load();
  }, [store.me?.id]);
  const save = async (path: string, method: string, body?: unknown) => {
    setBusy(true);
    try {
      await api(path, method, body);
      await load();
      await refresh();
      notify("Perubahan disimpan.");
      return true;
    } catch (e: any) {
      notify(e.message, true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (!store.me)
    return (
      <Empty
        title={tr("Masuk ke ruang pengelola.")}
        text={tr("Gunakan akun admin VASSEL untuk mengelola toko.")}
        href="/admin/login"
        action={tr("Login admin")}
      />
    );
  if (store.me.role !== "admin")
    return (
      <Empty
        title={tr("Akses khusus admin.")}
        text={tr("Akun pembeli tidak memiliki akses ke panel ini.")}
        href="/account"
        action={tr("Kembali ke akun")}
      />
    );
  if (!data)
    return (
      <div className="v-page">
        <Message message={tr(error)} error />
        {tr(
          error ? (
            <button className="v-button" onClick={load}>
              {tr("Coba lagi")}
            </button>
          ) : (
            <div className="v-skeleton" aria-label={tr("Memuat admin")} />
          ),
        )}
      </div>
    );
  const low = data.products.flatMap((p) =>
    p.variants
      .filter((v) => v.stock <= 5)
      .map((v) => ({ ...v, name: p.name, product: p })),
  );
  const paid = data.orders.filter((o) => !["baru", "batal"].includes(o.status));
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const sales = new Map<string, { name: string; count: number }>();
  for (const o of paid)
    for (const i of o.items) {
      const prev = sales.get(i.productId);
      sales.set(i.productId, {
        name: i.name,
        count: (prev?.count || 0) + i.quantity,
      });
    }
  const emptyProduct = (): Product => ({
    id: "",
    name: "VASSEL ",
    slug: "vassel-",
    sku: "VS-",
    category: data.categories[0]?.id || "",
    collection: "Signature",
    description: "",
    material: "",
    care: "",
    sizeGuide: "",
    price: 199000,
    comparePrice: 0,
    visible: false,
    featured: false,
    sortOrder: 1000,
    labels: [],
    images: ["/images/vassel-signature.webp", "/images/vassel-atelier.webp"],
    imageNote: "Visual referensi; sesuaikan dengan produk asli.",
    createdAt: new Date().toISOString(),
    variants: [
      {
        id: crypto.randomUUID(),
        sku: "VS-" + Date.now(),
        color: "Espresso",
        hex: "#3e3029",
        size: "M",
        stock: 10,
      },
    ],
  });
  return (
    <div className="v-admin">
      <aside className="v-admin-nav">
        <p className="v-kicker">{tr("VASSEL STUDIO")}</p>
        <h2>{tr("Ruang pengelola.")}</h2>
        <nav>
          {tr(
            tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => {
                  setTab(id);
                  setEdit(null);
                  setSearch("");
                }}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon size={18} />
                {tr(label)}{" "}
                {tr(
                  id === "orders" &&
                    data.orders.some((o) => o.status === "baru") && (
                      <span className="v-count">
                        {tr(
                          data.orders.filter((o) => o.status === "baru").length,
                        )}
                      </span>
                    ),
                )}
              </button>
            )),
          )}
        </nav>
        <a href="/">
          {tr("Lihat toko")}
          <ArrowUpRight size={16} />
        </a>
        <p className="v-note">
          {tr("Pembayaran, pengiriman, dan email masih mode lokal / demo.")}
        </p>
      </aside>
      <div className="v-admin-main">
        <header className="v-admin-heading">
          <div>
            <p className="v-kicker">{tr(date(new Date().toISOString()))}</p>
            <h1>{tr(tabs.find((t) => t[0] === tab)?.[1])}</h1>
          </div>
          <button
            className="v-outline"
            onClick={load}
            aria-label={tr("Muat ulang data")}
          >
            <RefreshCw size={16} />
            {tr("Perbarui")}
          </button>
        </header>
        <Message message={tr(error)} error />
        {tr(
          tab === "dashboard" && (
            <>
              <div className="v-stats">
                {tr(
                  [
                    ["Penjualan demo", money(revenue)],
                    [
                      "Pesanan baru",
                      data.orders.filter((o) => o.status === "baru").length,
                    ],
                    ["Varian stok ≤ 5", low.length],
                    ["Pengunjung unik", data.visitors],
                  ].map(([label, value]) => (
                    <div className="v-stat" key={label}>
                      <p>{tr(label)}</p>
                      <strong>{tr(value)}</strong>
                    </div>
                  )),
                )}
              </div>
              <div className="v-admin-columns">
                <section className="v-panel">
                  <div className="v-section-head">
                    <h2>{tr("Pesanan terbaru")}</h2>
                    <button onClick={() => setTab("orders")}>
                      {tr("Lihat semua")}
                    </button>
                  </div>
                  {tr(
                    data.orders.length ? (
                      data.orders.slice(0, 5).map((o) => (
                        <div className="v-list-row" key={o.id}>
                          <span>
                            <strong>{tr(o.customerName)}</strong>{" "}
                            <small>{tr(o.id)}</small>
                          </span>
                          <span>
                            {tr(money(o.total))}{" "}
                            <small>{tr(statusName[o.status])}</small>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p>
                        {tr(
                          "Belum ada pesanan. Selesaikan checkout untuk melihat data di sini.",
                        )}
                      </p>
                    ),
                  )}
                </section>
                <section className="v-panel">
                  <h2>{tr("Produk terlaris")}</h2>
                  {tr(
                    sales.size ? (
                      [...sales.values()]
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5)
                        .map((s) => (
                          <div className="v-list-row" key={s.name}>
                            <span>{tr(s.name)}</span>
                            <strong>
                              {tr(s.count)} {tr("pcs")}
                            </strong>
                          </div>
                        ))
                    ) : (
                      <p>
                        {tr(
                          "Statistik muncul setelah pesanan berstatus Dibayar.",
                        )}
                      </p>
                    ),
                  )}
                </section>
              </div>
              <section className="v-panel">
                <h2>{tr("Perlu perhatian")}</h2>
                <p>
                  {tr(low.filter((v) => v.stock === 0).length)}{" "}
                  {tr("varian habis dan")}
                  {tr(" ")}
                  {tr(low.filter((v) => v.stock > 0).length)}{" "}
                  {tr("varian menipis.")}
                </p>
                {tr(
                  low.slice(0, 6).map((v) => (
                    <div className="v-list-row" key={v.id}>
                      <span>
                        {tr(v.name)}{" "}
                        <small>
                          {tr(v.color)} {tr("/")} {tr(v.size)} {tr("·")}{" "}
                          {tr(v.sku)}
                        </small>
                      </span>
                      <span className="v-badge">
                        {tr("Sisa")} {tr(v.stock)}
                      </span>
                      <button
                        className="v-outline"
                        onClick={() => {
                          setTab("products");
                          setEdit(v.product);
                        }}
                      >
                        {tr("Atur stok")}
                      </button>
                    </div>
                  )),
                )}
              </section>
            </>
          ),
        )}{" "}
        {tr(
          tab === "products" &&
            (edit ? (
              <ProductEditor
                key={edit.id || "new"}
                product={edit}
                categories={data.categories}
                busy={busy}
                onCancel={() => setEdit(null)}
                onSave={async (p) => {
                  if (
                    await save(
                      "/admin/products" + (p.id ? "/" + p.id : ""),
                      p.id ? "PUT" : "POST",
                      p,
                    )
                  )
                    setEdit(null);
                }}
              />
            ) : (
              <>
                <div className="v-admin-toolbar">
                  <Field
                    label={tr("Cari produk atau SKU")}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={tr("Cari di seluruh katalog")}
                  />
                  <button
                    className="v-button"
                    onClick={() => setEdit(emptyProduct())}
                  >
                    <Plus size={17} />
                    {tr("Tambah produk")}
                  </button>
                </div>
                <p className="v-note">
                  {tr(data.products.length)}{" "}
                  {tr(
                    "produk · Foto dapat diganti dari editor. Harga dan stok tersimpan langsung ke database.",
                  )}
                </p>
                <div className="v-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr("Produk")}</th>
                        <th>{tr("Harga")}</th>
                        <th>{tr("Stok")}</th>
                        <th>{tr("Status")}</th>
                        <th>{tr("Aksi")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tr(
                        data.products
                          .filter((p) =>
                            (p.name + " " + p.sku)
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="v-table-product">
                                  <img
                                    src={p.images[0]}
                                    alt={tr("")}
                                    loading="lazy"
                                  />
                                  <span>
                                    <strong>{tr(p.name)}</strong>{" "}
                                    <small>
                                      {tr(p.sku)} {tr("·")}
                                      {tr(" ")}
                                      {tr(
                                        data.categories.find(
                                          (c) => c.id === p.category,
                                        )?.name,
                                      )}
                                    </small>
                                  </span>
                                </div>
                              </td>
                              <td>{tr(money(p.price))}</td>
                              <td>
                                {tr(
                                  p.variants.reduce((s, v) => s + v.stock, 0),
                                )}
                              </td>
                              <td>
                                <span className="v-badge">
                                  {tr(p.visible ? "Tampil" : "Tersembunyi")}
                                </span>
                              </td>
                              <td>
                                <div className="v-actions">
                                  <button
                                    className="v-outline"
                                    onClick={() => setEdit(p)}
                                  >
                                    {tr("Ubah")}
                                  </button>
                                  <button
                                    className="v-icon"
                                    disabled={busy}
                                    aria-label={tr("Hapus " + p.name)}
                                    onClick={() => {
                                      if (
                                        confirm(
                                          tr(
                                            `Hapus ${p.name}? Produk akan dihapus dari katalog.`,
                                          ),
                                        )
                                      )
                                        save(
                                          "/admin/products/" + p.id,
                                          "DELETE",
                                        );
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )),
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )),
        )}{" "}
        {tr(
          tab === "categories" && (
            <CategoryEditor data={data} save={save} busy={busy} />
          ),
        )}{" "}
        {tr(
          tab === "orders" && (
            <>
              <div className="v-admin-toolbar">
                <Field
                  label={tr("Cari pesanan / pelanggan")}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span>
                  {tr(data.orders.length)} {tr("pesanan")}
                </span>
              </div>
              {tr(
                data.orders.length ? (
                  data.orders
                    .filter((o) =>
                      (o.id + " " + o.customerName + " " + o.email)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((o) => (
                      <OrderEditor
                        key={o.id + o.status + o.tracking}
                        order={o}
                        save={save}
                        busy={busy}
                      />
                    ))
                ) : (
                  <p className="v-panel">{tr("Belum ada pesanan masuk.")}</p>
                ),
              )}
            </>
          ),
        )}{" "}
        {tr(
          tab === "customers" && (
            <div className="v-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{tr("Pelanggan")}</th>
                    <th>{tr("Kontak")}</th>
                    <th>{tr("Pesanan")}</th>
                    <th>{tr("Bergabung")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tr(
                    data.customers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          {tr(c.name)}{" "}
                          <small>
                            {tr(c.role === "admin" ? "Admin" : "Pembeli")}
                          </small>
                        </td>
                        <td>
                          {tr(c.email)}{" "}
                          <small>{tr(c.phone || "Nomor HP belum diisi")}</small>
                        </td>
                        <td>
                          {tr(
                            data.orders.filter((o) => o.userId === c.id).length,
                          )}
                        </td>
                        <td>{tr(date(c.createdAt))}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ),
        )}{" "}
        {tr(
          tab === "coupons" && (
            <CouponEditor
              key={data.coupons.map((c) => c.id + c.used).join()}
              coupons={data.coupons}
              save={save}
              busy={busy}
            />
          ),
        )}{" "}
        {tr(
          tab === "content" && (
            <ContentEditor
              home={data.home}
              products={data.products}
              save={save}
              busy={busy}
            />
          ),
        )}{" "}
        {tr(
          tab === "engagement" && (
            <Engagement data={data} save={save} busy={busy} />
          ),
        )}{" "}
        {tr(
          tab === "inventory" && (
            <>
              <p>
                {tr(
                  "Riwayat 200 perubahan terakhir: checkout, pembatalan, dan penyesuaian admin.",
                )}
              </p>
              <div className="v-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{tr("Waktu")}</th>
                      <th>{tr("Varian")}</th>
                      <th>{tr("Perubahan")}</th>
                      <th>{tr("Saldo")}</th>
                      <th>{tr("Keterangan")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tr(
                      data.stockLog.map((l) => (
                        <tr key={l.id}>
                          <td>
                            {tr(
                              new Date(l.createdAt).toLocaleString(getLocale()),
                            )}
                          </td>
                          <td>
                            {tr(
                              data.products
                                .flatMap((p) => p.variants)
                                .find((v) => v.id === l.variantId)?.sku ||
                                l.variantId,
                            )}
                          </td>
                          <td>
                            {tr(l.delta > 0 ? "+" : "")} {tr(l.delta)}
                          </td>
                          <td>{tr(l.balance)}</td>
                          <td>{tr(l.reason)}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
                {tr(
                  !data.stockLog.length && (
                    <p className="v-panel">
                      {tr("Belum ada perubahan stok setelah seed awal.")}
                    </p>
                  ),
                )}
              </div>
            </>
          ),
        )}
      </div>
    </div>
  );
}
type Save = (path: string, method: string, body?: unknown) => Promise<boolean>;
function ProductEditor({
  product,
  categories,
  busy,
  onSave,
  onCancel,
}: {
  product: Product;
  categories: Category[];
  busy: boolean;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState<Product>(structuredClone(product));
  const change = (key: keyof Product, value: any) =>
    setP((prev) => ({ ...prev, [key]: value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(p);
      }}
    >
      <div className="v-admin-toolbar">
        <button className="v-outline" type="button" onClick={onCancel}>
          <ChevronLeft size={16} />
          {tr("Daftar produk")}
        </button>
        <Busy busy={busy}>{tr("Simpan produk")}</Busy>
      </div>
      <div className="v-panel">
        <h2>{tr(p.id ? "Ubah produk" : "Produk baru")}</h2>
        <div className="v-form-grid">
          <Field
            label={tr("Nama produk")}
            required
            value={p.name}
            onChange={(e) => change("name", e.target.value)}
          />
          <Field
            label={tr("Slug / URL")}
            required
            pattern="[a-z0-9-]{3,160}"
            value={p.slug}
            onChange={(e) => change("slug", e.target.value)}
          />
          <Field
            label={tr("SKU produk")}
            required
            value={p.sku}
            onChange={(e) => change("sku", e.target.value)}
          />
          <Select
            label={tr("Kategori")}
            value={p.category}
            onChange={(e) => change("category", e.target.value)}
          >
            {tr(
              categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {tr(c.name)}
                </option>
              )),
            )}
          </Select>
          <Field
            label={tr("Koleksi")}
            value={p.collection}
            onChange={(e) => change("collection", e.target.value)}
          />
          <Field
            label={tr("Urutan tampil")}
            type="number"
            min="0"
            required
            value={p.sortOrder}
            onChange={(e) => change("sortOrder", Number(e.target.value))}
          />
          <Field
            label={tr("Harga (Rp)")}
            type="number"
            min="1000"
            step="1000"
            required
            value={p.price}
            onChange={(e) => change("price", Number(e.target.value))}
          />
          <Field
            label={tr("Harga coret (0 = tanpa diskon)")}
            type="number"
            min="0"
            step="1000"
            value={p.comparePrice}
            onChange={(e) => change("comparePrice", Number(e.target.value))}
          />
        </div>
        <Textarea
          label={tr("Deskripsi")}
          rows={4}
          required
          value={p.description}
          onChange={(e) => change("description", e.target.value)}
        />
        <Textarea
          label={tr("French product description")}
          rows={4}
          value={p.translations?.fr?.description || ""}
          onChange={(e) =>
            change("translations", { fr: { description: e.target.value } })
          }
        />
        <div className="v-form-grid">
          <Textarea
            label={tr("Bahan")}
            value={p.material}
            required
            onChange={(e) => change("material", e.target.value)}
          />
          <Textarea
            label={tr("Perawatan")}
            value={p.care}
            onChange={(e) => change("care", e.target.value)}
          />
        </div>
        <Textarea
          label={tr("Panduan ukuran")}
          value={p.sizeGuide}
          required
          onChange={(e) => change("sizeGuide", e.target.value)}
        />
        <div className="v-check-row">
          <label className="v-check">
            <input
              type="checkbox"
              checked={p.visible}
              onChange={(e) => change("visible", e.target.checked)}
            />
            {tr(" ")}
            {tr("Tampilkan produk")}
          </label>
          <label className="v-check">
            <input
              type="checkbox"
              checked={p.featured}
              onChange={(e) => change("featured", e.target.checked)}
            />
            {tr(" ")}
            {tr("Produk unggulan")}
          </label>
          {tr(
            ["Baru", "Terlaris", "Sale"].map((l) => (
              <label key={l} className="v-check">
                <input
                  type="checkbox"
                  checked={p.labels.includes(l)}
                  onChange={(e) =>
                    change(
                      "labels",
                      e.target.checked
                        ? [...p.labels, l]
                        : p.labels.filter((x) => x !== l),
                    )
                  }
                />
                {tr(l)}
              </label>
            )),
          )}
        </div>
      </div>
      <section className="v-panel">
        <h2>{tr("Galeri produk")}</h2>
        <p>
          {tr(
            "Minimal 2 foto. Foto pertama menjadi sampul; rasio tampilan 4:5.",
          )}
        </p>
        <div className="v-admin-gallery">
          {tr(
            p.images.map((src, i) => (
              <div key={i}>
                <img src={src} alt={tr("Foto " + (i + 1))} />
                <div className="v-actions">
                  <button
                    type="button"
                    className="v-icon"
                    disabled={i === 0}
                    aria-label={tr("Jadikan foto " + (i + 1) + " sampul")}
                    onClick={() =>
                      change("images", [
                        src,
                        ...p.images.filter((_, n) => n !== i),
                      ])
                    }
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="v-icon"
                    disabled={p.images.length <= 2}
                    aria-label={tr("Hapus foto " + (i + 1))}
                    onClick={() =>
                      change(
                        "images",
                        p.images.filter((_, n) => n !== i),
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <Upload
                  onUpload={(url) =>
                    change(
                      "images",
                      p.images.map((s, n) => (n === i ? url : s)),
                    )
                  }
                />
              </div>
            )),
          )}
        </div>
        {tr(
          p.images.length < 8 && (
            <Upload onUpload={(url) => change("images", [...p.images, url])} />
          ),
        )}
        <Field
          label={tr("Keterangan foto")}
          value={p.imageNote}
          onChange={(e) => change("imageNote", e.target.value)}
        />
      </section>
      <section className="v-panel">
        <div className="v-section-head">
          <h2>{tr("Varian & stok")}</h2>
          <button
            type="button"
            className="v-outline"
            onClick={() =>
              change(
                "variants",
                p.variants.map((v) => ({ ...v, stock: 0 })),
              )
            }
          >
            {tr("Tandai semua habis")}
          </button>
        </div>
        <div className="v-variant-list">
          {tr(
            p.variants.map((v, i) => {
              const field = (key: string, value: any) =>
                change(
                  "variants",
                  p.variants.map((v, n) =>
                    n === i ? { ...v, [key]: value } : v,
                  ),
                );
              return (
                <div className="v-variant-row" key={v.id}>
                  <Field
                    label={tr("SKU varian")}
                    required
                    value={v.sku}
                    onChange={(e) => field("sku", e.target.value)}
                  />
                  <Field
                    label={tr("Warna")}
                    required
                    value={v.color}
                    onChange={(e) => field("color", e.target.value)}
                  />
                  <Field
                    label={tr("Kode warna")}
                    type="color"
                    value={v.hex}
                    onChange={(e) => field("hex", e.target.value)}
                  />
                  <Field
                    label={tr("Ukuran")}
                    required
                    value={v.size}
                    onChange={(e) => field("size", e.target.value)}
                  />
                  <Field
                    label={tr("Stok")}
                    type="number"
                    min="0"
                    max="100000"
                    required
                    value={v.stock}
                    onChange={(e) => field("stock", Number(e.target.value))}
                  />
                  <button
                    className="v-icon"
                    type="button"
                    disabled={p.variants.length === 1}
                    aria-label={tr("Hapus varian " + v.sku)}
                    onClick={() =>
                      change(
                        "variants",
                        p.variants.filter((_, n) => n !== i),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            }),
          )}
        </div>
        <button
          type="button"
          className="v-outline"
          onClick={() =>
            change("variants", [
              ...p.variants,
              {
                id: crypto.randomUUID(),
                sku: p.sku + "-" + Date.now(),
                color: "Ivory",
                hex: "#eee5d6",
                size: "L",
                stock: 0,
              },
            ])
          }
        >
          <Plus size={16} />
          {tr("Tambah varian")}
        </button>
      </section>
      <Busy busy={busy}>{tr("Simpan produk")}</Busy>
    </form>
  );
}
function CategoryEditor({
  data,
  save,
  busy,
}: {
  data: AdminData;
  save: Save;
  busy: boolean;
}) {
  const [c, setC] = useState<Category>({
      id: "",
      name: "",
      description: "",
      image: "/images/vassel-signature.webp",
    }),
    [old, setOld] = useState(""),
    [next, setNext] = useState("");
  return (
    <>
      <div className="v-admin-categories">
        {tr(
          data.categories.map((x) => (
            <article className="v-panel" key={x.id}>
              <img src={x.image} alt={tr(x.name)} />
              <h3>{tr(x.name)}</h3>
              <p>
                {tr(data.products.filter((p) => p.category === x.id).length)}{" "}
                {tr("produk")}
              </p>
              <div className="v-actions">
                <button className="v-outline" onClick={() => setC(x)}>
                  {tr("Ubah")}
                </button>
                <button
                  className="v-icon"
                  aria-label={tr("Hapus kategori " + x.name)}
                  disabled={busy}
                  onClick={() => {
                    if (confirm(tr("Hapus kategori kosong ini?")))
                      save("/admin/categories/" + x.id, "DELETE");
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          )),
        )}
      </div>
      <form
        className="v-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await save("/admin/categories/" + c.id, "PUT", c))
            setC({
              id: "",
              name: "",
              description: "",
              image: "/images/vassel-signature.webp",
            });
        }}
      >
        <h2>
          {tr(data.categories.some((x) => x.id === c.id) ? "Ubah" : "Tambah")}
          {tr(" ")}
          {tr("kategori")}
        </h2>
        <div className="v-form-grid">
          <Field
            label={tr("ID kategori")}
            pattern="[a-z0-9-]{2,60}"
            required
            value={c.id}
            onChange={(e) => setC({ ...c, id: e.target.value })}
          />
          <Field
            label={tr("Nama kategori")}
            required
            value={c.name}
            onChange={(e) => setC({ ...c, name: e.target.value })}
          />
        </div>
        <Field
          label={tr("Deskripsi")}
          value={c.description}
          onChange={(e) => setC({ ...c, description: e.target.value })}
        />
        <Field
          label={tr("Gambar kategori")}
          value={c.image}
          required
          onChange={(e) => setC({ ...c, image: e.target.value })}
        />
        <Upload onUpload={(image) => setC({ ...c, image })} />
        <Busy busy={busy}>{tr("Simpan kategori")}</Busy>
      </form>
      <section className="v-panel">
        <h2>{tr("Koleksi")}</h2>
        <p>
          {tr(
            "Koleksi baru dibuat melalui kolom Koleksi di editor produk. Penggantian nama di sini memperbarui semua produk terkait.",
          )}
        </p>
        <form
          className="v-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            save("/admin/collections", "PUT", { oldName: old, newName: next });
          }}
        >
          <Select
            label={tr("Koleksi saat ini")}
            required
            value={old}
            onChange={(e) => setOld(e.target.value)}
          >
            <option value="">{tr("Pilih koleksi")}</option>
            {tr(
              [...new Set(data.products.map((p) => p.collection))].map((c) => (
                <option key={c} value={c}>
                  {tr(c)}
                </option>
              )),
            )}
          </Select>
          <Field
            label={tr("Nama baru")}
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <Busy busy={busy}>{tr("Ubah nama koleksi")}</Busy>
        </form>
      </section>
    </>
  );
}
function OrderEditor({
  order: o,
  save,
  busy,
}: {
  order: Order;
  save: Save;
  busy: boolean;
}) {
  const [status, setStatus] = useState(o.status),
    [tracking, setTracking] = useState(o.tracking);
  const options: Record<string, string[]> = {
    baru: ["baru", "dibayar", "batal"],
    dibayar: ["dibayar", "dikemas", "batal"],
    dikemas: ["dikemas", "dikirim", "batal"],
    dikirim: ["dikirim", "selesai"],
    selesai: ["selesai"],
    batal: ["batal"],
  };
  return (
    <details className="v-panel v-admin-order">
      <summary>
        <span>
          <strong>{tr(o.id)}</strong>{" "}
          <small>
            {tr(o.customerName)} {tr("·")} {tr(date(o.createdAt))}
          </small>
        </span>
        <span className="v-badge">{tr(statusName[o.status])}</span>
        <strong>{tr(money(o.total))}</strong>
      </summary>
      <div className="v-admin-columns">
        <div>
          {tr(
            o.items.map((i) => (
              <div className="v-order-item" key={i.variantId}>
                <img src={i.image} alt={tr("")} />
                <div>
                  <strong>{tr(i.name)}</strong>
                  <p>
                    {tr(i.color)} {tr("/")} {tr(i.size)} {tr("×")}{" "}
                    {tr(i.quantity)}
                  </p>
                  <small>{tr(i.sku)}</small>
                </div>
              </div>
            )),
          )}
          <p>
            {tr(o.email)}
            <br />
            {tr(o.address.name)} {tr("·")} {tr(o.address.phone)}
            <br />
            {tr(o.address.street)}
            <br />
            {tr(o.address.city)}
            {tr(",")} {tr(o.address.province)} {tr(o.address.postalCode)}
          </p>
          <p>
            {tr("Promo:")} {tr(o.coupon || "—")} {tr("· Ongkir:")}{" "}
            {tr(money(o.shipping))}
            <br />
            {tr("Pembayaran:")} {tr(o.paymentMethod)}
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save("/admin/orders/" + o.id, "PATCH", { status, tracking });
          }}
        >
          <Select
            label={tr("Status pesanan")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {tr(
              options[o.status].map((s) => (
                <option key={s} value={s}>
                  {tr(statusName[s])}
                </option>
              )),
            )}
          </Select>
          <Field
            label={tr("Nomor resi")}
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            required={status === "dikirim"}
          />
          <p className="v-note">
            {tr(
              "Pembatalan mengembalikan stok satu kali. Status Dibayar hanya untuk simulasi; tidak memproses dana.",
            )}
          </p>
          <Busy busy={busy}>{tr("Perbarui pesanan")}</Busy>
          <ol className="v-history">
            {tr(
              o.history.map((h, i) => (
                <li key={i}>
                  {tr(statusName[h.status])} {tr("·")} {tr(date(h.at))}
                </li>
              )),
            )}
          </ol>
        </form>
      </div>
    </details>
  );
}
function CouponEditor({
  coupons,
  save,
  busy,
}: {
  coupons: Coupon[];
  save: Save;
  busy: boolean;
}) {
  const blank = (): Coupon => ({
    id: crypto.randomUUID(),
    name: "",
    code: "",
    type: "percent",
    value: 10,
    minSpend: 0,
    maxDiscount: 100000,
    limit: 100,
    used: 0,
    active: true,
    start: new Date().toISOString().slice(0, 10),
    end: "2027-12-31",
  });
  const [c, setC] = useState(blank);
  const field = (key: keyof Coupon, value: any) => setC({ ...c, [key]: value });
  return (
    <>
      <div className="v-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{tr("Kode")}</th>
              <th>{tr("Penawaran")}</th>
              <th>{tr("Penggunaan")}</th>
              <th>{tr("Status")}</th>
              <th>{tr("Aksi")}</th>
            </tr>
          </thead>
          <tbody>
            {tr(
              coupons.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{tr(x.code)}</strong> <small>{tr(x.name)}</small>
                  </td>
                  <td>
                    {tr(
                      x.type === "percent"
                        ? x.value + "%"
                        : x.type === "shipping"
                          ? "Gratis ongkir"
                          : money(x.value),
                    )}
                  </td>
                  <td>
                    {tr(x.used)} {tr("/")} {tr(x.limit)}
                  </td>
                  <td>{tr(x.active ? "Aktif" : "Nonaktif")}</td>
                  <td>
                    <button className="v-outline" onClick={() => setC(x)}>
                      {tr("Ubah")}
                    </button>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <form
        className="v-panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await save("/admin/coupons/" + c.id, "PUT", c)) setC(blank());
        }}
      >
        <div className="v-section-head">
          <h2>
            {tr(
              coupons.some((x) => x.id === c.id) ? "Ubah kupon" : "Kupon baru",
            )}
          </h2>
          <button
            className="v-outline"
            type="button"
            onClick={() => setC(blank())}
          >
            {tr("Kupon baru")}
          </button>
        </div>
        <div className="v-form-grid">
          <Field
            label={tr("Nama promo")}
            required
            value={c.name}
            onChange={(e) => field("name", e.target.value)}
          />
          <Field
            label={tr("Kode promo")}
            required
            pattern="[A-Z0-9_-]{3,30}"
            value={c.code}
            onChange={(e) => field("code", e.target.value.toUpperCase())}
          />
          <Select
            label={tr("Jenis")}
            value={c.type}
            onChange={(e) => field("type", e.target.value)}
          >
            <option value="percent">{tr("Persentase")}</option>
            <option value="fixed">{tr("Potongan Rupiah")}</option>
            <option value="shipping">{tr("Potongan ongkir")}</option>
          </Select>
          {tr(
            (["value", "minSpend", "maxDiscount", "limit"] as const).map(
              (key, i) => (
                <Field
                  key={key}
                  label={tr(
                    [
                      "Nilai diskon (% / Rp)",
                      "Minimum belanja (Rp)",
                      "Maksimal potongan (Rp; 0 = tanpa batas)",
                      "Kuota penggunaan",
                    ][i],
                  )}
                  type="number"
                  min={key === "limit" ? 1 : 0}
                  required
                  value={c[key]}
                  onChange={(e) => field(key, Number(e.target.value))}
                />
              ),
            ),
          )}
          <Field
            label={tr("Mulai")}
            type="date"
            required
            value={c.start}
            onChange={(e) => field("start", e.target.value)}
          />
          <Field
            label={tr("Berakhir")}
            type="date"
            required
            value={c.end}
            onChange={(e) => field("end", e.target.value)}
          />
        </div>
        <label className="v-check">
          <input
            type="checkbox"
            checked={c.active}
            onChange={(e) => field("active", e.target.checked)}
          />
          {tr(" ")}
          {tr("Promo aktif")}
        </label>
        <Busy busy={busy}>{tr("Simpan kupon")}</Busy>
      </form>
    </>
  );
}
function ContentEditor({
  home,
  products,
  save,
  busy,
}: {
  home: Home;
  products: Product[];
  save: Save;
  busy: boolean;
}) {
  const [h, setH] = useState(structuredClone(home));
  const change = (key: keyof Home, value: any) => setH({ ...h, [key]: value });
  const labels: Record<string, string> = {
    categories: "Kategori",
    new: "Produk terbaru",
    bestseller: "Pilihan unggulan",
    promo: "Promo",
    testimonials: "Testimoni",
    newsletter: "Newsletter",
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save("/admin/home", "PUT", h);
      }}
    >
      <section className="v-panel">
        <h2>{tr("Kampanye pembuka")}</h2>
        <img
          className="v-content-preview"
          src={h.poster}
          alt={tr("Poster hero")}
        />
        {tr(
          (
            [
              "title",
              "subtitle",
              "description",
              "cta",
              "ctaLink",
              "announcement",
              "poster",
            ] as const
          ).map((key, i) => (
            <Field
              key={key}
              label={tr(
                [
                  "Judul hero",
                  "Subjudul",
                  "Deskripsi",
                  "Teks tombol",
                  "Tautan tombol",
                  "Pengumuman atas",
                  "URL poster",
                ][i],
              )}
              value={h[key]}
              required
              onChange={(e) => change(key, e.target.value)}
            />
          )),
        )}
        <div className="v-form-grid">
          <Upload onUpload={(url) => change("poster", url)} />
        </div>
        <h3>{tr("French homepage copy")}</h3>
        <p className="v-note">
          {tr("Edit the French text shown when visitors choose FR.")}
        </p>
        {tr(
          (
            [
              "title",
              "subtitle",
              "description",
              "cta",
              "announcement",
              "promoTitle",
              "promoText",
            ] as const
          ).map((key) => (
            <Field
              key={key}
              label={tr(
                "FR · " +
                  {
                    title: "Judul hero",
                    subtitle: "Subjudul",
                    description: "Deskripsi",
                    cta: "Teks tombol",
                    announcement: "Pengumuman atas",
                    promoTitle: "Judul promo",
                    promoText: "Isi promo",
                  }[key],
              )}
              value={h.translations?.fr?.[key] || ""}
              onChange={(e) =>
                change("translations", {
                  fr: { ...h.translations?.fr, [key]: e.target.value },
                })
              }
            />
          )),
        )}
      </section>
      <section className="v-panel">
        <h2>{tr("Banner promo")}</h2>
        <Field
          label={tr("Judul promo")}
          value={h.promoTitle}
          onChange={(e) => change("promoTitle", e.target.value)}
        />
        <Textarea
          label={tr("Isi promo")}
          value={h.promoText}
          onChange={(e) => change("promoText", e.target.value)}
        />
        <Field
          label={tr("Gambar promo")}
          value={h.promoImage}
          onChange={(e) => change("promoImage", e.target.value)}
        />
        <Upload onUpload={(url) => change("promoImage", url)} />
      </section>
      <section className="v-panel">
        <h2>{tr("Urutan section")}</h2>
        {tr(
          h.sections.map((s, i) => (
            <div className="v-list-row" key={s}>
              <label className="v-check">
                <input
                  type="checkbox"
                  checked={!h.hiddenSections.includes(s)}
                  onChange={(e) =>
                    change(
                      "hiddenSections",
                      e.target.checked
                        ? h.hiddenSections.filter((v) => v !== s)
                        : [...h.hiddenSections, s],
                    )
                  }
                />
                {tr(labels[s])}
              </label>
              <div className="v-actions">
                {tr(
                  [-1, 1].map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      className="v-icon"
                      aria-label={tr(
                        (dir < 0 ? "Naikkan " : "Turunkan ") + labels[s],
                      )}
                      disabled={i + dir < 0 || i + dir >= h.sections.length}
                      onClick={() => {
                        const sections = [...h.sections];
                        [sections[i], sections[i + dir]] = [
                          sections[i + dir],
                          sections[i],
                        ];
                        change("sections", sections);
                      }}
                    >
                      {tr(
                        dir < 0 ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        ),
                      )}
                    </button>
                  )),
                )}
              </div>
            </div>
          )),
        )}
      </section>
      <section className="v-panel">
        <h2>{tr("Produk unggulan")}</h2>
        <p>
          {tr(
            "Pilih hingga 12 produk; empat pilihan pertama tampil di beranda.",
          )}
        </p>
        <div className="v-featured-list">
          {tr(
            products.map((p) => (
              <label key={p.id} className="v-check">
                <input
                  type="checkbox"
                  checked={h.featuredIds.includes(p.id)}
                  onChange={(e) =>
                    change(
                      "featuredIds",
                      e.target.checked
                        ? [...h.featuredIds, p.id].slice(0, 12)
                        : h.featuredIds.filter((v) => v !== p.id),
                    )
                  }
                />
                {tr(p.name)} {tr(!p.visible ? " (tersembunyi)" : "")}
              </label>
            )),
          )}
        </div>
      </section>
      <section className="v-panel">
        <h2>{tr("Testimoni editorial")}</h2>
        <p>
          {tr(
            "Gunakan ulasan nyata dengan izin pelanggan sebelum peluncuran. Seed saat ini ditandai sebagai contoh.",
          )}
        </p>
        {tr(
          h.testimonials.map((t, i) => (
            <div className="v-form-grid" key={i}>
              <Field
                label={tr("Nama " + (i + 1))}
                value={t.name}
                onChange={(e) =>
                  change(
                    "testimonials",
                    h.testimonials.map((v, n) =>
                      n === i ? { ...v, name: e.target.value } : v,
                    ),
                  )
                }
              />
              <Textarea
                label={tr("Isi testimoni")}
                value={t.text}
                onChange={(e) =>
                  change(
                    "testimonials",
                    h.testimonials.map((v, n) =>
                      n === i ? { ...v, text: e.target.value } : v,
                    ),
                  )
                }
              />
            </div>
          )),
        )}
      </section>
      <Busy busy={busy}>{tr("Simpan halaman depan")}</Busy>
    </form>
  );
}
function Engagement({
  data,
  save,
  busy,
}: {
  data: AdminData;
  save: Save;
  busy: boolean;
}) {
  const [section, setSection] = useState("reviews");
  const names: Record<string, string> = {
    reviews: "Moderasi ulasan",
    wishlist: "Wishlist",
    cart: "Keranjang tersimpan",
    newsletter: "Subscriber",
    restock: "Permintaan stok",
    analytics: "View & klik",
  };
  const users = new Map(data.customers.map((u) => [u.id, u]));
  return (
    <>
      <div className="v-tabs">
        {tr(
          Object.entries(names).map(([k, v]) => (
            <button
              key={k}
              className={section === k ? "active" : ""}
              onClick={() => setSection(k)}
            >
              {tr(v)}
            </button>
          )),
        )}
      </div>
      {tr(
        section === "reviews" ? (
          data.reviews.length ? (
            data.reviews.map((r) => (
              <article className="v-panel" key={r.id}>
                <div className="v-section-head">
                  <strong>
                    {tr(r.name)} {tr("·")} {tr("★".repeat(r.rating))}
                  </strong>
                  <span className="v-badge">
                    {tr(
                      r.status === "pending"
                        ? "Menunggu"
                        : r.status === "approved"
                          ? "Tampil"
                          : "Ditolak",
                    )}
                  </span>
                </div>
                <p>
                  {tr(data.products.find((p) => p.id === r.productId)?.name)}
                </p>
                <blockquote>{tr(r.text)}</blockquote>
                <div className="v-actions">
                  <button
                    className="v-button"
                    disabled={busy}
                    onClick={() =>
                      save("/admin/reviews/" + r.id, "PATCH", {
                        status: "approved",
                      })
                    }
                  >
                    {tr("Tampilkan")}
                  </button>
                  <button
                    className="v-outline"
                    disabled={busy}
                    onClick={() =>
                      save("/admin/reviews/" + r.id, "PATCH", {
                        status: "rejected",
                      })
                    }
                  >
                    {tr("Tolak")}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="v-panel">
              {tr(
                "Belum ada ulasan. Pembeli bisa mengulas setelah pesanan selesai.",
              )}
            </p>
          )
        ) : section === "analytics" ? (
          <div className="v-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{tr("Produk")}</th>
                  <th>{tr("Dilihat")}</th>
                  <th>{tr("Ditambahkan ke keranjang")}</th>
                </tr>
              </thead>
              <tbody>
                {tr(
                  data.products
                    .filter((p) =>
                      data.events.some((e) => e.productId === p.id),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>{tr(p.name)}</td>
                        <td>
                          {tr(
                            data.events.find(
                              (e) => e.productId === p.id && e.kind === "view",
                            )?.count || 0,
                          )}
                        </td>
                        <td>
                          {tr(
                            data.events.find(
                              (e) => e.productId === p.id && e.kind === "click",
                            )?.count || 0,
                          )}
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <p className="v-note">
              {tr(
                section === "cart"
                  ? "Keranjang akun yang belum checkout. Keranjang dianggap ditinggalkan setelah 30 menit tanpa pembaruan."
                  : section === "newsletter" || section === "restock"
                    ? "Daftar tersimpan di database. Pengiriman email otomatis belum terhubung."
                    : "Favorit akun pembeli, disinkronkan antarperangkat saat login.",
              )}
            </p>
            {tr(
              data.engagement
                .filter(
                  (e) =>
                    e.kind === section &&
                    (section !== "cart" || e.data.length > 0),
                )
                .map((e) => (
                  <article className="v-panel" key={e.owner}>
                    <strong>
                      {tr(users.get(e.owner)?.name || e.data.email || e.owner)}
                    </strong>
                    <p>
                      {tr(users.get(e.owner)?.email || "")} {tr("·")}{" "}
                      {tr(date(e.updatedAt))}
                    </p>
                    {tr(
                      section === "wishlist" ? (
                        <ul>
                          {tr(
                            e.data.map((id: string) => (
                              <li key={id}>
                                {tr(
                                  data.products.find((p) => p.id === id)
                                    ?.name || "Produk dihapus",
                                )}
                              </li>
                            )),
                          )}
                        </ul>
                      ) : section === "cart" ? (
                        <>
                          <span className="v-badge">
                            {tr(
                              Date.now() - new Date(e.updatedAt).getTime() >
                                30 * 60e3
                                ? "Ditinggalkan"
                                : "Aktif",
                            )}
                          </span>
                          <ul>
                            {tr(
                              e.data.map((line: any) => {
                                const p = data.products.find((p) =>
                                  p.variants.some(
                                    (v) => v.id === line.variantId,
                                  ),
                                );
                                return (
                                  <li key={line.variantId}>
                                    {tr(p?.name || "Produk dihapus")} {tr("×")}{" "}
                                    {tr(line.quantity)}
                                  </li>
                                );
                              }),
                            )}
                          </ul>
                        </>
                      ) : section === "restock" ? (
                        <p>
                          {tr("Varian:")}
                          {tr(" ")}
                          {tr(
                            data.products
                              .flatMap((p) =>
                                p.variants.map((v) => ({ ...v, name: p.name })),
                              )
                              .find((v) => v.id === e.data.variantId)?.sku ||
                              e.data.variantId,
                          )}
                          {tr(" ")}
                          {tr("· Menunggu ketersediaan")}
                        </p>
                      ) : (
                        <p>
                          {tr("Persetujuan langganan:")}{" "}
                          {tr(date(e.data.consentAt))}
                        </p>
                      ),
                    )}
                  </article>
                )),
            )}{" "}
            {tr(
              !data.engagement.some(
                (e) =>
                  e.kind === section &&
                  (section !== "cart" || e.data.length > 0),
              ) && (
                <p className="v-panel">{tr("Belum ada data di bagian ini.")}</p>
              ),
            )}
          </>
        ),
      )}
    </>
  );
}
