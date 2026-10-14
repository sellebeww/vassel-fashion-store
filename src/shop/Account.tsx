import { tr } from "./i18n";
import React, { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, LogOut, Plus, Trash2 } from "lucide-react";
import { useStore } from "./state";
import { api, date, money, statusName } from "./api";
import {
  Field,
  Busy,
  Message,
  AddressFields,
  emptyAddress,
  Empty,
} from "./Common";
import type { Address, Order } from "./types";
export function AuthPage({ mode = "login" }: { mode?: string }) {
  const { setUser, navigate, path } = useStore();
  const isAdmin = mode === "admin",
    register = mode === "register",
    forgot = mode === "forgot",
    reset = mode === "reset";
  const [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false);
  const params = new URLSearchParams(path.split("?")[1]);
  return (
    <div className="v-auth">
      <div className="v-auth-art">
        <img src="/images/vassel-lookbook.webp" alt={tr("Editorial VASSEL")} />
        <div>
          <p className="v-kicker">{tr("THE VASSEL WAY")}</p>
          <h2>
            {tr("Ruang untuk")}
            <br />
            <em>{tr("menjadi dirimu.")}</em>
          </h2>
        </div>
      </div>
      <div className="v-auth-form">
        <p className="v-kicker">
          {tr(isAdmin ? "RUANG PENGELOLA" : "SELAMAT DATANG DI VASSEL")}
        </p>
        <h1>
          {tr(
            register
              ? "Mulai cerita baru."
              : forgot
                ? "Lupa kata sandi?"
                : reset
                  ? "Kata sandi baru."
                  : isAdmin
                    ? "Masuk admin."
                    : "Senang bertemu lagi.",
          )}
        </h1>
        <p>
          {tr(
            register
              ? "Simpan favorit dan ikuti perjalanan pesananmu."
              : forgot
                ? "Masukkan email akunmu untuk membuat tautan reset."
                : reset
                  ? "Gunakan minimal 10 karakter."
                  : "Masuk dengan email dan kata sandi akunmu.",
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMessage("");
            setError(false);
            const f = Object.fromEntries(new FormData(e.currentTarget));
            try {
              if (forgot) {
                const r = await api("/auth/forgot", "POST", f);
                setMessage(r.message);
              } else if (reset) {
                await api("/auth/reset", "POST", {
                  ...f,
                  token: params.get("token"),
                });
                setMessage("Kata sandi diperbarui. Silakan masuk kembali.");
              } else {
                const r = await api(
                  "/auth/" + (register ? "register" : "login"),
                  "POST",
                  { ...f, admin: isAdmin },
                );
                await setUser(r.user);
                const next = params.get("next");
                navigate(
                  isAdmin
                    ? "/admin"
                    : next?.startsWith("/") &&
                        !next.startsWith("//") &&
                        !next.startsWith("/admin")
                      ? next
                      : "/account",
                );
              }
            } catch (e: any) {
              setMessage(e.message);
              setError(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {tr(
            register && (
              <Field
                label={tr("Nama lengkap")}
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
              />
            ),
          )}
          {tr(" ")}
          {tr(
            !reset && (
              <Field
                label={tr("Email")}
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            ),
          )}{" "}
          {tr(
            !forgot && (
              <Field
                label={tr("Kata sandi")}
                type="password"
                name="password"
                autoComplete={
                  register || reset ? "new-password" : "current-password"
                }
                required
                minLength={register || reset ? 10 : 1}
                maxLength={128}
              />
            ),
          )}
          <Message message={tr(message)} error={error} />
          <Busy busy={busy}>
            {tr(
              register
                ? "Buat akun"
                : forgot
                  ? "Buat tautan reset"
                  : reset
                    ? "Simpan kata sandi"
                    : "Masuk",
            )}
            <ArrowUpRight size={16} />
          </Busy>
        </form>
        <div className="v-auth-links">
          {tr(
            !forgot && !reset && (
              <a href="/forgot-password">{tr("Lupa kata sandi?")}</a>
            ),
          )}{" "}
          {tr(
            register ? (
              <a href="/login">{tr("Sudah punya akun? Masuk")}</a>
            ) : !isAdmin && !forgot && !reset ? (
              <a href="/register">{tr("Belum punya akun? Daftar")}</a>
            ) : (
              <a href="/login">{tr("Kembali ke login pembeli")}</a>
            ),
          )}
        </div>
        {tr(
          isAdmin && (
            <p className="v-note">
              {tr(
                "Akses dibatasi untuk akun dengan role admin. Seluruh perubahan disimpan di server.",
              )}
            </p>
          ),
        )}
      </div>
    </div>
  );
}
export function AccountPage() {
  const { data, logout, notify, setUser, navigate } = useStore();
  const [tab, setTab] = useState("orders"),
    [orders, setOrders] = useState<Order[]>([]),
    [addresses, setAddresses] = useState<Address[]>([]),
    [editing, setEditing] = useState<Address | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = () =>
    Promise.all([api<Order[]>("/orders"), api("/me")])
      .then(([o, m]) => {
        setOrders(o);
        setAddresses(m.addresses);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    if (data.me) load();
  }, [data.me?.id]);
  if (!data.me)
    return (
      <Empty
        title={tr("Ruang pribadimu di VASSEL.")}
        text={tr("Masuk untuk mengelola alamat, favorit, dan pesanan.")}
        href="/login"
        action={tr("Masuk ke akun")}
      />
    );
  return (
    <div className="v-page">
      <div className="v-section-head">
        <div>
          <p className="v-kicker">{tr("AKUN VASSEL")}</p>
          <h1>
            {tr("Halo,")} {tr(data.me.name.split(" ")[0])}
            {tr(".")}
          </h1>
        </div>
        <button
          className="v-outline"
          onClick={() => logout().then(() => navigate("/"))}
        >
          <LogOut size={16} />
          {tr("Keluar")}
        </button>
      </div>
      <div className="v-tabs">
        {tr(
          [
            ["orders", "Pesanan"],
            ["addresses", "Buku alamat"],
            ["profile", "Profil"],
          ].map(([v, l]) => (
            <button
              key={v}
              aria-pressed={tab === v}
              className={tab === v ? "active" : ""}
              onClick={() => setTab(v)}
            >
              {tr(l)}
            </button>
          )),
        )}
        <a href="/wishlist">{tr("Favorit")}</a>
        {tr(
          data.me.role === "admin" && <a href="/admin">{tr("Panel admin")}</a>,
        )}
      </div>
      <Message message={tr(error)} error />
      {tr(
        loading ? (
          <div className="v-skeleton" aria-label={tr("Memuat akun")} />
        ) : tab === "orders" ? (
          orders.length ? (
            <div className="v-orders">
              {tr(
                orders.map((o) => (
                  <a
                    href={"/orders/" + o.id}
                    className="v-order-card"
                    key={o.id}
                  >
                    <div>
                      <span className="v-kicker">{tr(o.id)}</span>
                      <p>{tr(date(o.createdAt))}</p>
                    </div>
                    <span className={"v-badge " + o.status}>
                      {tr(statusName[o.status])}
                    </span>
                    <p>
                      {tr(o.items.reduce((s, i) => s + i.quantity, 0))}{" "}
                      {tr("produk ·")}
                      {tr(" ")}
                      <strong>{tr(money(o.total))}</strong>
                    </p>
                    <span>
                      {tr("Lihat detail")}
                      <ArrowUpRight size={16} />
                    </span>
                  </a>
                )),
              )}
            </div>
          ) : (
            <Empty
              title={tr("Cerita belanjamu dimulai di sini.")}
              text={tr(
                "Pesanan akan muncul setelah kamu menyelesaikan checkout.",
              )}
            />
          )
        ) : tab === "addresses" ? (
          <>
            <div className="v-addresses">
              {tr(
                addresses.map((a) => (
                  <article className="v-panel" key={a.id}>
                    <p className="v-kicker">{tr(a.label)}</p>
                    <h3>{tr(a.name)}</h3>
                    <p>
                      {tr(a.phone)}
                      <br />
                      {tr(a.street)}
                      <br />
                      {tr(a.city)}
                      {tr(",")} {tr(a.province)} {tr(a.postalCode)}
                    </p>
                    <div className="v-actions">
                      <button
                        className="v-outline"
                        onClick={() => setEditing(a)}
                      >
                        {tr("Ubah")}
                      </button>
                      <button
                        className="v-outline"
                        aria-label={tr("Hapus alamat " + a.label)}
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const next = addresses.filter((x) => x.id !== a.id);
                            await api("/me/addresses", "PUT", {
                              addresses: next,
                            });
                            setAddresses(next);
                            notify("Alamat dihapus.");
                          } catch (e: any) {
                            notify(e.message, true);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                )),
              )}
            </div>
            {tr(
              !editing && (
                <button
                  className="v-button"
                  onClick={() =>
                    setEditing({
                      ...emptyAddress,
                      name: data.me!.name,
                      phone: data.me!.phone,
                    })
                  }
                >
                  <Plus size={16} />
                  {tr("Tambah alamat")}
                </button>
              ),
            )}{" "}
            {tr(
              editing && (
                <form
                  className="v-panel v-address-editor"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      const a = {
                          ...editing,
                          id: editing.id || crypto.randomUUID(),
                        },
                        next = [...addresses.filter((x) => x.id !== a.id), a];
                      const result = await api<Address[]>(
                        "/me/addresses",
                        "PUT",
                        {
                          addresses: next,
                        },
                      );
                      setAddresses(result);
                      setEditing(null);
                      notify("Alamat disimpan.");
                    } catch (e: any) {
                      notify(e.message, true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <h2>
                    {tr(editing.id ? "Ubah" : "Tambah")} {tr("alamat")}
                  </h2>
                  <AddressFields value={editing} onChange={setEditing} />
                  <div className="v-actions">
                    <Busy busy={busy}>{tr("Simpan alamat")}</Busy>
                    <button
                      className="v-outline"
                      type="button"
                      onClick={() => setEditing(null)}
                    >
                      {tr("Batal")}
                    </button>
                  </div>
                </form>
              ),
            )}
          </>
        ) : (
          <form
            className="v-panel v-profile"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const r = await api(
                  "/me",
                  "PATCH",
                  Object.fromEntries(new FormData(e.currentTarget)),
                );
                await setUser(r.user);
                notify("Profil diperbarui.");
              } catch (e: any) {
                notify(e.message, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label={tr("Nama lengkap")}
              name="name"
              defaultValue={data.me.name}
              required
              minLength={2}
              autoComplete="name"
            />
            <Field label={tr("Email")} value={data.me.email} readOnly />
            <Field
              label={tr("Nomor HP")}
              name="phone"
              type="tel"
              defaultValue={data.me.phone}
              autoComplete="tel"
            />
            <Busy busy={busy}>{tr("Simpan profil")}</Busy>
            <a href="/forgot-password">
              {tr("Ubah kata sandi melalui tautan reset")}
            </a>
          </form>
        ),
      )}
    </div>
  );
}
export function OrderPage({ orderId }: { orderId: string }) {
  const { data } = useStore();
  const [order, setOrder] = useState<Order | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!data.me) return;
    const load = () =>
      api<Order>("/orders/" + orderId)
        .then(setOrder)
        .catch((e) => setError(e.message));
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [orderId, data.me?.id]);
  if (!data.me)
    return (
      <Empty
        title={tr("Masuk untuk melihat pesanan.")}
        text={tr("Detail pesanan hanya dapat dilihat oleh pemilik akun.")}
        href={"/login?next=/orders/" + orderId}
        action={tr("Masuk")}
      />
    );
  if (error)
    return (
      <Empty
        title={tr("Pesanan tidak ditemukan.")}
        text={tr(error)}
        href="/account"
        action={tr("Kembali ke akun")}
      />
    );
  if (!order)
    return (
      <div className="v-page">
        <div className="v-skeleton" aria-label={tr("Memuat pesanan")} />
      </div>
    );
  const steps = ["baru", "dibayar", "dikemas", "dikirim", "selesai"];
  return (
    <div className="v-page">
      <div className="v-page-heading">
        <CheckCircle2 size={35} />
        <p className="v-kicker">
          {tr("PESANAN")} {tr(order.id)}
        </p>
        <h1>
          {tr(
            order.status === "batal"
              ? "Pesanan dibatalkan."
              : "Terima kasih sudah memilih VASSEL.",
          )}
        </h1>
        <p>
          {tr(date(order.createdAt))} {tr("·")} {tr(statusName[order.status])}
        </p>
      </div>
      <Message
        message={tr(
          "Pesanan ini menggunakan pembayaran dan pengiriman demo. Tidak ada dana yang ditagih.",
        )}
      />
      <div className="v-order-layout">
        <section className="v-panel">
          <h2>{tr("Perjalanan pesanan")}</h2>
          <ol className="v-timeline">
            {tr(
              (order.status === "batal" ? ["baru", "batal"] : steps).map(
                (s) => (
                  <li
                    key={s}
                    className={
                      order.history.some((h) => h.status === s) ? "done" : ""
                    }
                  >
                    <span />
                    <div>
                      <strong>{tr(statusName[s])}</strong>
                      <p>
                        {tr(
                          order.history.find((h) => h.status === s)
                            ? date(
                                order.history.find((h) => h.status === s)!.at,
                              )
                            : "Menunggu proses berikutnya",
                        )}
                      </p>
                    </div>
                  </li>
                ),
              ),
            )}
          </ol>
          {tr(
            order.tracking && (
              <p className="v-message">
                {tr("Nomor resi:")} <strong>{tr(order.tracking)}</strong>
              </p>
            ),
          )}
          <h3>{tr("Alamat pengiriman")}</h3>
          <p>
            {tr(order.address.name)} {tr("·")} {tr(order.address.phone)}
            <br />
            {tr(order.address.street)}
            <br />
            {tr(order.address.city)}
            {tr(",")} {tr(order.address.province)}
            {tr(" ")}
            {tr(order.address.postalCode)}
          </p>
          <p>
            {tr("Pengiriman")} {tr(order.shippingMethod)} {tr("·")}
            {tr(" ")}
            {tr(
              order.paymentMethod === "qris-demo"
                ? "QRIS demo"
                : "Transfer bank demo",
            )}
          </p>
          {tr(
            order.status === "baru" && (
              <p className="v-note">
                {tr(
                  "Untuk simulasi, admin mengubah status menjadi Dibayar setelah meninjau pesanan. Tidak ada nomor rekening atau QR pembayaran nyata.",
                )}
              </p>
            ),
          )}
        </section>
        <section className="v-panel">
          <h2>{tr("Ringkasan pilihanmu")}</h2>
          {tr(
            order.items.map((i) => (
              <div className="v-order-item" key={i.variantId}>
                <img src={i.image} alt={tr(i.name)} />
                <div>
                  <a href={"/products/" + i.slug}>{tr(i.name)}</a>
                  <p>
                    {tr(i.color)} {tr("/")} {tr(i.size)} {tr("·")}{" "}
                    {tr(i.quantity)} {tr("pcs")}
                  </p>
                  <strong>{tr(money(i.price * i.quantity))}</strong>
                </div>
              </div>
            )),
          )}
          <div className="v-totals">
            <p>
              <span>{tr("Subtotal")}</span>
              {tr(money(order.subtotal))}
            </p>
            <p>
              <span>
                {tr("Potongan")} {tr(order.coupon)}
              </span>
              {tr("−")} {tr(money(order.discount))}
            </p>
            <p>
              <span>{tr("Ongkir")}</span>
              {tr(money(order.shipping))}
            </p>
            <p className="total">
              <span>{tr("Total")}</span>
              {tr(money(order.total))}
            </p>
          </div>
          <a className="v-outline" href="/account">
            {tr("Semua pesanan")}
          </a>
        </section>
      </div>
    </div>
  );
}
