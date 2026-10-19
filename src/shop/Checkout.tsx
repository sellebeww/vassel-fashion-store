import { tr } from "./i18n";
import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, LockKeyhole, Trash2 } from "lucide-react";
import { useStore } from "./state";
import { api, money } from "./api";
import {
  Field,
  Select,
  AddressFields,
  emptyAddress,
  Busy,
  Message,
  Empty,
} from "./Common";
import type { Address, Quote } from "./types";
export function CartPage() {
  const { cart, data, updateCart, notify } = useStore();
  const [busy, setBusy] = useState(false);
  const lines = cart.map((c) => {
    const p = data.products.find((p) =>
        p.variants.some((v) => v.id === c.variantId),
      ),
      v = p?.variants.find((v) => v.id === c.variantId);
    return { ...c, p, v };
  });
  if (!cart.length)
    return (
      <Empty
        title={tr("Keranjangmu masih menunggu.")}
        text={tr("Mulai dengan satu pilihan yang terasa seperti dirimu.")}
      />
    );
  const change = async (id: string, quantity: number) => {
    setBusy(true);
    try {
      await updateCart(
        quantity > 0
          ? cart.map((c) => (c.variantId === id ? { ...c, quantity } : c))
          : cart.filter((c) => c.variantId !== id),
      );
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="v-page">
      <div className="v-page-heading">
        <p className="v-kicker">{tr("PILIHAN PERSONAL")}</p>
        <h1>{tr("Keranjangmu.")}</h1>
      </div>
      <div className="v-cart-layout">
        <div>
          {tr(
            lines.map((l) => (
              <article className="v-cart-line" key={l.variantId}>
                {tr(
                  l.p ? (
                    <>
                      <a href={"/products/" + l.p.slug}>
                        <img
                          src={l.p.images[0]}
                          alt={tr(l.p.name)}
                          loading="lazy"
                        />
                      </a>
                      <div>
                        <a href={"/products/" + l.p.slug}>
                          <h3>{tr(l.p.name)}</h3>
                        </a>
                        <p>
                          {tr(l.v!.color)} {tr("/")} {tr(l.v!.size)}
                        </p>
                        <strong>{tr(money(l.p.price))}</strong>
                        <p className="v-note">
                          {tr(
                            l.v!.stock
                              ? `Stok tersedia: ${l.v!.stock}`
                              : "Varian habis",
                          )}
                        </p>
                        <div className="v-actions">
                          <Field
                            label={tr("Jumlah")}
                            type="number"
                            min="1"
                            max={Math.max(1, l.v!.stock)}
                            value={l.quantity}
                            disabled={busy}
                            onChange={(e) =>
                              change(
                                l.variantId,
                                Math.max(
                                  1,
                                  Math.min(
                                    l.v!.stock || 1,
                                    Number(e.target.value) || 1,
                                  ),
                                ),
                              )
                            }
                          />
                          <button
                            className="v-icon"
                            aria-label={tr("Hapus " + l.p.name)}
                            disabled={busy}
                            onClick={() => change(l.variantId, 0)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        {tr(
                          l.quantity > l.v!.stock && (
                            <Message
                              message={tr(
                                "Stok berubah. Kurangi jumlah atau hapus produk ini.",
                              )}
                              error
                            />
                          ),
                        )}
                      </div>
                      <strong>{tr(money(l.p.price * l.quantity))}</strong>
                    </>
                  ) : (
                    <div>
                      <p>{tr("Produk ini tidak lagi tersedia.")}</p>
                      <button
                        className="v-outline"
                        onClick={() => change(l.variantId, 0)}
                      >
                        {tr("Hapus dari keranjang")}
                      </button>
                    </div>
                  ),
                )}
              </article>
            )),
          )}
        </div>
        <aside className="v-panel v-cart-summary">
          <h2>{tr("Ringkasan")}</h2>
          <div className="v-totals">
            <p>
              <span>{tr("Subtotal")}</span>
              <strong>
                {tr(
                  money(
                    lines.reduce(
                      (s, l) => s + (l.p?.price || 0) * l.quantity,
                      0,
                    ),
                  ),
                )}
              </strong>
            </p>
          </div>
          <p>{tr("Ongkir dan promo dihitung saat checkout.")}</p>
          <a
            className="v-button"
            href={data.me ? "/checkout" : "/login?next=/checkout"}
          >
            {tr("Lanjut checkout")}
            <ArrowRight size={17} />
          </a>
          <span className="v-note">
            <LockKeyhole size={14} />
            {tr("Masuk diperlukan saat checkout.")}
          </span>
          <a href="/shop">{tr("Lanjut memilih koleksi")}</a>
        </aside>
      </div>
    </div>
  );
}
export function CheckoutPage() {
  const { data, cart, updateCart, refresh, navigate, notify } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]),
    [address, setAddress] = useState<Address>({
      ...emptyAddress,
      name: data.me?.name || "",
      phone: data.me?.phone || "",
    }),
    [shipping, setShipping] = useState("reguler"),
    [payment, setPayment] = useState("transfer-demo"),
    [coupon, setCoupon] = useState(""),
    [applied, setApplied] = useState(""),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saveAddress, setSaveAddress] = useState(true),
    [loading, setLoading] = useState(true);
  const requestKey = useRef(crypto.randomUUID());
  const signature = JSON.stringify(cart);
  useEffect(() => {
    if (data.me)
      api("/me")
        .then((m) => {
          setAddresses(m.addresses);
          if (m.addresses[0]) setAddress(m.addresses[0]);
        })
        .catch((e) => setError(e.message));
  }, [data.me?.id]);
  useEffect(() => {
    if (!data.me || !cart.length) return;
    let active = true;
    setLoading(true);
    api<Quote>("/checkout/quote", "POST", {
      items: cart,
      shippingMethod: shipping,
      coupon: applied,
    })
      .then((q) => {
        if (active) {
          setQuote(q);
          setError("");
        }
      })
      .catch((e) => {
        if (active) {
          setQuote(null);
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [signature, shipping, applied, data.me?.id, data.products]);
  if (!data.me)
    return (
      <Empty
        title={tr("Satu langkah sebelum checkout.")}
        text={tr("Masuk atau buat akun untuk menyimpan pesanan dan alamatmu.")}
        href="/login?next=/checkout"
        action={tr("Masuk untuk checkout")}
      />
    );
  if (!cart.length)
    return (
      <Empty
        title={tr("Keranjangmu masih kosong.")}
        text={tr("Tambahkan pilihan VASSEL sebelum checkout.")}
      />
    );
  return (
    <div className="v-page">
      <div className="v-page-heading">
        <p className="v-kicker">{tr("LANGKAH TERAKHIR")}</p>
        <h1>{tr("Lengkapi pilihanmu.")}</h1>
        <p>{tr("Alamat · Pengiriman · Pembayaran")}</p>
      </div>
      <Message
        message={tr(
          "Mode demo: tidak ada pembayaran yang ditagih atau paket yang dikirim. Pesanan dan stok tetap tercatat untuk pengujian.",
        )}
      />
      <form
        className="v-checkout-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || !quote) return;
          setBusy(true);
          setError("");
          try {
            if (saveAddress) {
              const next = [
                ...addresses.filter((a) => a.id !== address.id),
                { ...address, id: address.id || crypto.randomUUID() },
              ];
              await api("/me/addresses", "PUT", { addresses: next });
            }
            const o = await api("/orders", "POST", {
              requestKey: requestKey.current,
              expectedTotal: quote.total,
              items: cart,
              address,
              shippingMethod: shipping,
              paymentMethod: payment,
              coupon: applied,
            });
            await updateCart([]);
            await refresh();
            notify("Pesanan berhasil dibuat.");
            navigate("/orders/" + o.id);
          } catch (e: any) {
            setError(e.message);
            await refresh().catch(() => {});
          } finally {
            setBusy(false);
          }
        }}
      >
        <div>
          <section className="v-panel">
            <h2>
              <span>{tr("01")}</span>
              {tr("Alamat pengiriman")}
            </h2>
            {tr(
              addresses.length > 0 && (
                <Select
                  label={tr("Pilih alamat tersimpan")}
                  value={address.id}
                  onChange={(e) =>
                    setAddress(
                      addresses.find((a) => a.id === e.target.value) || {
                        ...emptyAddress,
                        name: data.me!.name,
                      },
                    )
                  }
                >
                  <option value="">{tr("Alamat baru")}</option>
                  {tr(
                    addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {tr(a.label)} {tr("—")} {tr(a.name)}
                        {tr(",")} {tr(a.city)}
                      </option>
                    )),
                  )}
                </Select>
              ),
            )}
            <AddressFields value={address} onChange={setAddress} />
            <label className="v-check">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              {tr(" ")}
              {tr("Simpan ke buku alamat")}
            </label>
          </section>
          <section className="v-panel">
            <h2>
              <span>{tr("02")}</span>
              {tr("Pengiriman")}
            </h2>
            <div className="v-radio-cards">
              {tr(
                [
                  ["reguler", "Reguler", "Estimasi demo 3–5 hari · Rp 20.000"],
                  ["ekspres", "Ekspres", "Estimasi demo 1–2 hari · Rp 35.000"],
                ].map(([value, title, desc]) => (
                  <label
                    key={value}
                    className={shipping === value ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={value}
                      checked={shipping === value}
                      onChange={() => setShipping(value)}
                    />
                    <span>
                      <strong>{tr(title)}</strong> <small>{tr(desc)}</small>
                    </span>
                  </label>
                )),
              )}
            </div>
            <p className="v-note">
              {tr("Reguler gratis untuk subtotal minimal Rp 750.000.")}
            </p>
          </section>
          <section className="v-panel">
            <h2>
              <span>{tr("03")}</span>
              {tr("Pembayaran")}
            </h2>
            <div className="v-radio-cards">
              {tr(
                [
                  ["transfer-demo", "Transfer bank — demo"],
                  ["qris-demo", "QRIS — demo"],
                ].map(([value, title]) => (
                  <label
                    key={value}
                    className={payment === value ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                    />
                    <span>
                      <strong>{tr(title)}</strong>{" "}
                      <small>{tr("Simulasi, tanpa transaksi dana")}</small>
                    </span>
                  </label>
                )),
              )}
            </div>
          </section>
        </div>
        <aside className="v-panel v-checkout-summary">
          <h2>{tr("Ringkasan pesanan")}</h2>
          {tr(
            quote?.items.map((i) => (
              <div className="v-order-item" key={i.variantId}>
                <img src={i.image} alt={tr(i.name)} loading="lazy" />
                <div>
                  <strong>{tr(i.name)}</strong>
                  <p>
                    {tr(i.color)} {tr("/")} {tr(i.size)} {tr("×")}{" "}
                    {tr(i.quantity)}
                  </p>
                  <span>{tr(money(i.price * i.quantity))}</span>
                </div>
              </div>
            )),
          )}
          <div className="v-coupon">
            <Field
              label={tr("Kode promo")}
              value={coupon}
              placeholder={tr("VASSEL10")}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            />
            <button
              className="v-outline"
              type="button"
              onClick={() => setApplied(coupon.trim())}
            >
              {tr("Gunakan")}
            </button>
          </div>
          {tr(
            applied && (
              <button
                type="button"
                className="v-link"
                onClick={() => {
                  setApplied("");
                  setCoupon("");
                }}
              >
                {tr("Hapus promo")} {tr(applied)}
              </button>
            ),
          )}{" "}
          {tr(
            loading ? (
              <p role="status">{tr("Menghitung total…")}</p>
            ) : (
              quote && (
                <div className="v-totals">
                  <p>
                    <span>{tr("Subtotal")}</span>
                    {tr(money(quote.subtotal))}
                  </p>
                  <p>
                    <span>{tr("Potongan")}</span>
                    {tr("−")} {tr(money(quote.discount))}
                  </p>
                  <p>
                    <span>{tr("Pengiriman")}</span>
                    {tr(money(quote.shipping))}
                  </p>
                  <p className="total">
                    <span>{tr("Total")}</span>
                    {tr(money(quote.total))}
                  </p>
                </div>
              )
            ),
          )}
          <Message message={tr(error)} error />
          <Busy busy={busy} disabled={loading || !quote}>
            {tr("Buat pesanan demo")}
            <ArrowRight size={17} />
          </Busy>
          <p className="v-note">
            {tr("Dengan melanjutkan, kamu menyetujui")}
            {tr(" ")}
            <a href="/terms">{tr("ketentuan belanja")}</a>
            {tr("dan")}
            {tr(" ")}
            <a href="/privacy">{tr("privasi VASSEL")}</a>
            {tr(".")}
          </p>
          <a href="/cart">{tr("Kembali ke keranjang")}</a>
        </aside>
      </form>
    </div>
  );
}
