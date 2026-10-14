import { tr } from "./i18n";
import { getLanguage } from "./i18n";
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "./state";
import { api, money, report } from "./api";
import {
  ProductCard,
  Field,
  Select,
  Empty,
  Busy,
  Message,
  Textarea,
} from "./Common";
import type { Review } from "./types";
export function Catalog({ favorites = false }: { favorites?: boolean }) {
  const { data, wishlist, path, navigate } = useStore();
  const params = new URLSearchParams(path.split("?")[1]);
  const [filters, setFilters] = useState(false),
    [count, setCount] = useState(20);
  const get = (k: string) => params.get(k) || "";
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(params);
    v ? q.set(k, v) : q.delete(k);
    navigate((favorites ? "/wishlist" : "/shop") + (q.size ? "?" + q : ""));
  };
  useEffect(() => setCount(20), [path]);
  const result = useMemo(() => {
    let items = data.products.filter(
      (p) =>
        (!favorites || wishlist.includes(p.id)) &&
        (!get("q") ||
          `${p.name} ${p.description} ${p.translations?.fr?.description || ""} ${p.sku}`
            .toLowerCase()
            .includes(get("q").trim().toLowerCase())) &&
        (!get("category") || p.category === get("category")) &&
        (get("group") !== "ready-to-wear" ||
          ["kemeja", "jaket", "celana"].includes(p.category)) &&
        (!get("collection") || p.collection === get("collection")) &&
        (!get("label") || p.labels.includes(get("label"))) &&
        (!get("min") || p.price >= Number(get("min"))) &&
        (!get("max") || p.price <= Number(get("max"))) &&
        p.variants.some(
          (v) =>
            (!get("size") || v.size === get("size")) &&
            (!get("color") || v.color === get("color")) &&
            (!get("stock") ||
              (get("stock") === "available"
                ? v.stock > 0
                : p.variants.every((v) => v.stock === 0))),
        ),
    );
    if (get("sort") === "low") items.sort((a, b) => a.price - b.price);
    if (get("sort") === "high") items.sort((a, b) => b.price - a.price);
    if (get("sort") === "new")
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  }, [data.products, path, wishlist]);
  return (
    <div className="v-page">
      <div className="v-page-heading">
        <p className="v-kicker">
          {tr(favorites ? "DISIMPAN UNTUKMU" : "THE VASSEL EDIT")}
        </p>
        <h1>
          {tr(
            favorites
              ? "Pilihan favoritmu."
              : data.categories.find((c) => c.id === get("category"))?.name ||
                  "Koleksi VASSEL",
          )}
        </h1>
        <p>
          {tr(
            "Garis yang bersih. Warna yang tenang. Pilihan yang terasa personal.",
          )}
        </p>
      </div>
      <form
        className="v-search"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", new FormData(e.currentTarget).get("query") as string);
        }}
      >
        <Search size={19} />
        <input
          key={get("q")}
          name="query"
          type="search"
          aria-label={tr("Cari produk")}
          placeholder={tr("Cari nama produk, koleksi, atau SKU…")}
          defaultValue={get("q")}
        />
        <button type="submit">{tr("Cari")}</button>
      </form>
      <div className="v-catalog-bar">
        <button onClick={() => setFilters(!filters)} aria-expanded={filters}>
          <SlidersHorizontal size={17} />
          {tr("Filter")}
          {tr(" ")}
          {tr(
            params.size > 0 && (
              <span className="v-count">{tr(params.size)}</span>
            ),
          )}
        </button>
        <span aria-live="polite">
          {tr(result.length)} {tr("pilihan")}
        </span>
        <Select
          label={tr("Urutkan")}
          value={get("sort")}
          onChange={(e) => set("sort", e.target.value)}
        >
          <option value="">{tr("Pilihan VASSEL")}</option>
          <option value="new">{tr("Terbaru")}</option>
          <option value="low">{tr("Harga terendah")}</option>
          <option value="high">{tr("Harga tertinggi")}</option>
        </Select>
      </div>
      {tr(
        filters && (
          <div className="v-filters">
            <Select
              label={tr("Kategori")}
              value={get("category")}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">{tr("Semua kategori")}</option>
              {tr(
                data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tr(c.name)}
                  </option>
                )),
              )}
            </Select>
            <Select
              label={tr("Koleksi")}
              value={get("collection")}
              onChange={(e) => set("collection", e.target.value)}
            >
              <option value="">{tr("Semua koleksi")}</option>
              {tr(
                [...new Set(data.products.map((p) => p.collection))].map(
                  (c) => (
                    <option key={c} value={c}>
                      {tr(c)}
                    </option>
                  ),
                ),
              )}
            </Select>
            <Select
              label={tr("Ukuran")}
              value={get("size")}
              onChange={(e) => set("size", e.target.value)}
            >
              <option value="">{tr("Semua ukuran")}</option>
              {tr(
                [
                  ...new Set(
                    data.products.flatMap((p) => p.variants.map((v) => v.size)),
                  ),
                ].map((s) => (
                  <option key={s} value={s}>
                    {tr(s)}
                  </option>
                )),
              )}
            </Select>
            <Select
              label={tr("Warna")}
              value={get("color")}
              onChange={(e) => set("color", e.target.value)}
            >
              <option value="">{tr("Semua warna")}</option>
              {tr(
                [
                  ...new Set(
                    data.products.flatMap((p) =>
                      p.variants.map((v) => v.color),
                    ),
                  ),
                ].map((s) => (
                  <option key={s} value={s}>
                    {tr(s)}
                  </option>
                )),
              )}
            </Select>
            <Field
              label={tr("Harga minimum")}
              type="number"
              min="0"
              step="1000"
              value={get("min")}
              onChange={(e) => set("min", e.target.value)}
            />
            <Field
              label={tr("Harga maksimum")}
              type="number"
              min="0"
              step="1000"
              value={get("max")}
              onChange={(e) => set("max", e.target.value)}
            />
            <Select
              label={tr("Ketersediaan")}
              value={get("stock")}
              onChange={(e) => set("stock", e.target.value)}
            >
              <option value="">{tr("Semua stok")}</option>
              <option value="available">{tr("Tersedia")}</option>
              <option value="empty">{tr("Habis")}</option>
            </Select>
            <button
              className="v-outline"
              onClick={() => navigate(favorites ? "/wishlist" : "/shop")}
            >
              {tr("Reset filter")}
              <X size={15} />
            </button>
          </div>
        ),
      )}{" "}
      {tr(
        result.length ? (
          <>
            <div className="v-product-grid">
              {tr(
                result
                  .slice(0, count)
                  .map((p) => <ProductCard p={p} key={p.id} />),
              )}
            </div>
            <div className="v-load">
              <p>
                {tr(Math.min(count, result.length))} {tr("dari")}{" "}
                {tr(result.length)} {tr("produk")}
              </p>
              {tr(
                count < result.length && (
                  <button
                    className="v-outline"
                    onClick={() => setCount((c) => c + 20)}
                  >
                    {tr("Muat lebih banyak")}
                  </button>
                ),
              )}
            </div>
          </>
        ) : (
          <Empty
            title={tr(
              favorites
                ? "Belum ada pilihan di sini."
                : "Belum menemukan yang sesuai.",
            )}
            text={tr(
              favorites
                ? "Simpan produk dengan tombol hati untuk menemukannya kembali."
                : "Coba kata kunci lain atau hapus beberapa filter.",
            )}
            action={tr("Lihat semua produk")}
          />
        ),
      )}
    </div>
  );
}
export function ProductDetail({ slug }: { slug: string }) {
  const { data, add, wishlist, toggleWish, notify } = useStore();
  const p = data.products.find((p) => p.slug === slug);
  const [color, setColor] = useState(""),
    [size, setSize] = useState(""),
    [photo, setPhoto] = useState(0),
    [qty, setQty] = useState(1),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [reviews, setReviews] = useState<Review[]>([]),
    [reviewText, setReviewText] = useState(""),
    [rating, setRating] = useState("5");
  useEffect(() => {
    setColor(p?.variants[0]?.color || "");
    setSize("");
    setPhoto(0);
    setQty(1);
    if (p) {
      report("view", p.id);
      api<Review[]>("/reviews/" + p.id)
        .then(setReviews)
        .catch(() => {});
    }
  }, [slug]);
  if (!p)
    return (
      <Empty
        title={tr("Produk tidak ditemukan.")}
        text={tr(
          "Produk ini mungkin sedang disembunyikan atau sudah tidak tersedia.",
        )}
      />
    );
  const colors = [...new Map(p.variants.map((v) => [v.color, v])).values()],
    variants = p.variants.filter((v) => v.color === color),
    v = variants.find((v) => v.size === size),
    total = p.variants.reduce((s, v) => s + v.stock, 0);
  const related = data.products
    .filter((x) => x.category === p.category && x.id !== p.id)
    .slice(0, 4);
  return (
    <>
      <div className="v-page">
        <nav className="v-breadcrumb">
          <a href="/shop">{tr("Koleksi")}</a>
          <span>{tr("/")}</span>
          <a href={"/shop?category=" + p.category}>
            {tr(data.categories.find((c) => c.id === p.category)?.name)}
          </a>
          <span>{tr("/")}</span>
          <span>{tr(p.name)}</span>
        </nav>
        <div className="v-detail">
          <div className="v-gallery">
            <img
              className="v-main-photo"
              src={p.images[photo] || p.images[0]}
              alt={tr(`${p.name} — foto ${photo + 1}`)}
              fetchPriority="high"
            />
            <div className="v-thumbs">
              {tr(
                p.images.map((src, i) => (
                  <button
                    key={src + i}
                    className={i === photo ? "selected" : ""}
                    aria-label={tr(`Lihat foto ${i + 1}`)}
                    aria-pressed={i === photo}
                    onClick={() => setPhoto(i)}
                  >
                    <img src={src} alt={tr("")} loading="lazy" />
                  </button>
                )),
              )}
            </div>
            <p className="v-note">{tr(p.imageNote)}</p>
          </div>
          <div className="v-detail-copy">
            <p className="v-kicker">
              {tr(p.collection)} {tr("/")}{" "}
              {p.labels.map((label) => tr(label)).join(" · ")}
            </p>
            <h1>{tr(p.name)}</h1>
            <div className="v-price v-price-large">
              {tr(money(p.price))}
              {tr(" ")}
              {tr(p.comparePrice > 0 && <del>{tr(money(p.comparePrice))}</del>)}
            </div>
            <p className="v-detail-description">
              {tr(
                getLanguage() === "fr"
                  ? p.translations?.fr?.description || p.description
                  : p.description,
              )}
            </p>
            <fieldset>
              <legend>
                {tr("Warna —")} <strong>{tr(color)}</strong>
              </legend>
              <div className="v-choices">
                {tr(
                  colors.map((c) => (
                    <button
                      aria-pressed={color === c.color}
                      className={color === c.color ? "selected" : ""}
                      key={c.color}
                      onClick={() => {
                        setColor(c.color);
                        setSize("");
                        setQty(1);
                      }}
                    >
                      <span className="v-dot" style={{ background: c.hex }} />
                      {tr(c.color)}
                    </button>
                  )),
                )}
              </div>
            </fieldset>
            <fieldset>
              <legend>
                {tr("Ukuran")}
                <a href="#size-guide">{tr("Panduan ukuran")}</a>
              </legend>
              <div className="v-choices">
                {tr(
                  variants.map((s) => (
                    <button
                      aria-pressed={s.size === size}
                      className={
                        (s.size === size ? "selected " : "") +
                        (!s.stock ? "unavailable" : "")
                      }
                      key={s.id}
                      onClick={() => {
                        setSize(s.size);
                        setQty(1);
                      }}
                    >
                      {tr(s.size)}{" "}
                      {tr(!s.stock && <small>{tr("Habis")}</small>)}
                    </button>
                  )),
                )}
              </div>
            </fieldset>
            <p className={`v-stock ${(v && !v.stock) || !total ? "out" : ""}`}>
              {tr(
                v
                  ? v.stock
                    ? v.stock <= 5
                      ? `Sisa ${v.stock} — pilih sebelum kehabisan`
                      : `Tersedia ${v.stock} pcs`
                    : "Varian ini habis"
                  : total
                    ? "Pilih warna dan ukuran untuk melihat stok."
                    : "Habis untuk sementara.",
              )}
            </p>
            <div className="v-buy-row">
              <Field
                label={tr("Jumlah")}
                type="number"
                min="1"
                max={v?.stock || 1}
                value={qty}
                onChange={(e) =>
                  setQty(
                    Math.max(
                      1,
                      Math.min(v?.stock || 1, Number(e.target.value) || 1),
                    ),
                  )
                }
              />
              <Busy
                busy={busy}
                disabled={!v?.stock}
                onClick={async () => {
                  if (!v) return;
                  setBusy(true);
                  try {
                    await add(p, v, qty);
                    report("click", p.id);
                  } catch (e: any) {
                    notify(e.message, true);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <ShoppingBag size={18} />
                {tr(
                  (v && !v.stock) || !total ? "Habis" : "Tambah ke keranjang",
                )}
              </Busy>
              <button
                className="v-outline v-icon"
                aria-label={tr("Simpan produk ke favorit")}
                aria-pressed={wishlist.includes(p.id)}
                onClick={() => toggleWish(p.id)}
              >
                <Heart
                  size={19}
                  fill={wishlist.includes(p.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            {tr(
              v && !v.stock && (
                <form
                  className="v-restock"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      const r = await api("/restock", "POST", {
                        email,
                        variantId: v.id,
                      });
                      notify(r.message);
                      setEmail("");
                    } catch (e: any) {
                      notify(e.message, true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Field
                    label={tr("Kabari saya saat tersedia")}
                    type="email"
                    placeholder={tr("Email kamu")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Busy busy={busy} className="v-outline">
                    {tr("Daftarkan email")}
                  </Busy>
                </form>
              ),
            )}
            <p className="v-note">
              {tr("SKU:")} {tr(v?.sku || p.sku)}
            </p>
            <div className="v-accordions">
              <details open>
                <summary>{tr("Bahan & karakter")}</summary>
                <p>{tr(p.material)}</p>
              </details>
              <details id="size-guide">
                <summary>{tr("Panduan ukuran")}</summary>
                <p>{tr(p.sizeGuide)}</p>
              </details>
              <details>
                <summary>{tr("Perawatan")}</summary>
                <p>{tr(p.care)}</p>
              </details>
              <details>
                <summary>{tr("Pengiriman & pengembalian")}</summary>
                <p>
                  {tr(
                    "Simulasi ongkir reguler Rp 20.000 (gratis mulai Rp 750.000), ekspres Rp 35.000. Pengiriman dan pembayaran nyata belum diaktifkan.",
                  )}
                  <a href="/help">{tr("Baca informasi layanan.")}</a>
                </p>
              </details>
            </div>
          </div>
        </div>
        <section className="v-reviews">
          <h2>{tr("Ulasan pembeli")}</h2>
          {tr(
            reviews.length ? (
              reviews.map((r) => (
                <blockquote key={r.id}>
                  <strong>
                    {tr(r.name)} {tr("·")} {tr("★".repeat(r.rating))}
                  </strong>
                  <p>{tr(r.text)}</p>
                </blockquote>
              ))
            ) : (
              <p>{tr("Belum ada ulasan terverifikasi untuk produk ini.")}</p>
            ),
          )}
          <details>
            <summary>{tr("Tulis ulasan setelah pesanan selesai")}</summary>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api("/reviews", "POST", {
                    productId: p.id,
                    rating: Number(rating),
                    text: reviewText,
                  });
                  notify("Ulasan tersimpan dan menunggu moderasi.");
                  setReviewText("");
                } catch (e: any) {
                  notify(e.message, true);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Select
                label={tr("Rating")}
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                {tr(
                  [5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {tr(n)} {tr("bintang")}
                    </option>
                  )),
                )}
              </Select>
              <Textarea
                label={tr("Pengalamanmu")}
                required
                minLength={10}
                maxLength={1000}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
              <Busy busy={busy}>{tr("Kirim ulasan")}</Busy>
            </form>
          </details>
        </section>
        <section className="v-section">
          <div className="v-section-head">
            <h2>{tr("Melengkapi pilihanmu.")}</h2>
            <a href={"/shop?category=" + p.category}>{tr("Lihat koleksi")}</a>
          </div>
          <div className="v-product-grid">
            {tr(related.map((p) => <ProductCard key={p.id} p={p} />))}
          </div>
        </section>
      </div>
    </>
  );
}
