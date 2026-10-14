import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Search,
  Heart,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { VasselLogo } from "./components/brand/Logo";
import { api, persist, stored, report } from "./shop/api";
import { StoreContext } from "./shop/state";
import type { Bootstrap, CartLine, Product, User, Variant } from "./shop/types";
import { MaisonPage } from "./shop/Maison";
import { AtelierPage } from "./shop/Atelier";
import { LookbookPage } from "./shop/Lookbook";
import { HomePage } from "./shop/Home";
import { Catalog, ProductDetail } from "./shop/Catalog";
import { AuthPage, AccountPage, OrderPage } from "./shop/Account";
import { CartPage, CheckoutPage } from "./shop/Checkout";
import { Empty, Message } from "./shop/Common";
import { useEditorialMotion } from "./shop/useEditorialMotion";
import "./shop/shop.css";
import { useLanguage, setLanguage, getLanguage, tr } from "./shop/i18n";
const Admin = lazy(() => import("./shop/Admin"));
export default function App() {
  const language = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  const [data, setData] = useState<Bootstrap | null>(null),
    [error, setError] = useState(""),
    [path, setPath] = useState(location.pathname + location.search),
    [cart, setCart] = useState<CartLine[]>(() => {
      const c = stored<any>("vassel_guest_cart_v1", []);
      return Array.isArray(c)
        ? c.filter(
            (i) =>
              i &&
              typeof i.variantId === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0,
          )
        : [];
    }),
    [wishlist, setWishlist] = useState<string[]>(() => {
      const w = stored<any>("vassel_guest_wishlist_v1", []);
      return Array.isArray(w) ? w.filter((i) => typeof i === "string") : [];
    }),
    [toast, setToast] = useState<{ message: string; error: boolean } | null>(
      null,
    ),
    [menu, setMenu] = useState(false);
  const mainRef = useEditorialMotion(path, !!data);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    cartRef = useRef(cart),
    wishRef = useRef(wishlist),
    userRef = useRef<User | null>(null);
  cartRef.current = cart;
  wishRef.current = wishlist;
  userRef.current = data?.me || null;
  const notify = useCallback((message: string, error = false) => {
    setToast({ message, error });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5500);
  }, []);
  const refresh = useCallback(async () => {
    const d = await api<Bootstrap>("/bootstrap");
    if (userRef.current?.id !== d.me?.id) {
      if (d.me) {
        const m = await api("/me");
        setCart(m.cart);
        setWishlist(m.wishlist);
      } else {
        setCart([]);
        setWishlist([]);
      }
    }
    setData(d);
    setError("");
  }, []);
  const hydrate = async (user: User | null, merge = false) => {
    if (!user) return;
    const m = await api("/me");
    let c: CartLine[] = m.cart,
      w: string[] = m.wishlist;
    if (merge) {
      const map = new Map(c.map((i) => [i.variantId, i.quantity]));
      for (const i of cartRef.current)
        map.set(
          i.variantId,
          Math.min(99, (map.get(i.variantId) || 0) + i.quantity),
        );
      c = [...map].map(([variantId, quantity]) => ({ variantId, quantity }));
      w = [...new Set([...w, ...wishRef.current])];
      await Promise.all([
        api("/me/cart", "PUT", { items: c }),
        api("/me/wishlist", "PUT", { ids: w }),
      ]);
      persist("vassel_guest_cart_v1", []);
      persist("vassel_guest_wishlist_v1", []);
    }
    setCart(c);
    setWishlist(w);
  };
  useEffect(() => {
    let alive = true;
    api<Bootstrap>("/bootstrap")
      .then(async (d) => {
        if (!alive) return;
        setData(d);
        await hydrate(d.me);
        report("visit");
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const update = () => refresh().catch(() => {});
    const live = new EventSource("/api/live");
    live.addEventListener("catalog", update);
    const t = setInterval(update, 30000);
    const focus = () => update();
    window.addEventListener("focus", focus);
    return () => {
      live.close();
      clearInterval(t);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);
  const navigate = useCallback((url: string) => {
    if (!url.startsWith("/") || url.startsWith("//")) return;
    history.pushState({}, "", url);
    setPath(location.pathname + location.search);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    const pop = () => {
      setPath(location.pathname + location.search);
      setMenu(false);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useEffect(() => {
    document.title = path.startsWith("/admin")
      ? "Admin | VASSEL"
      : path.startsWith("/shop")
        ? tr("Collection") + " | VASSEL"
        : "VASSEL — " +
          (language === "fr"
            ? "Une présence, sans un mot."
            : "Presence, without a word.");
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        navigate("/shop");
        setTimeout(
          () =>
            document
              .querySelector<HTMLInputElement>(".v-search input")
              ?.focus(),
          50,
        );
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [path, navigate]);
  const setUser = async (user: User | null) => {
    const previous = userRef.current;
    setData((d) => (d ? { ...d, me: user } : d));
    if (user) await hydrate(user, !previous);
  };
  const updateCart = async (lines: CartLine[]) => {
    if (userRef.current) {
      const result = await api<CartLine[]>("/me/cart", "PUT", { items: lines });
      setCart(result);
    } else {
      setCart(lines);
      if (!persist("vassel_guest_cart_v1", lines))
        notify(
          "Keranjang tersimpan selama sesi ini; penyimpanan browser tidak tersedia.",
          true,
        );
    }
  };
  const add = async (p: Product, v: Variant, q = 1) => {
    const old = cartRef.current.find((i) => i.variantId === v.id);
    if (!Number.isInteger(q) || q < 1 || q + (old?.quantity || 0) > v.stock)
      throw new Error(
        `Stok ${p.name} tersisa ${v.stock}. Periksa jumlah di keranjang.`,
      );
    await updateCart(
      old
        ? cartRef.current.map((i) =>
            i.variantId === v.id ? { ...i, quantity: i.quantity + q } : i,
          )
        : [...cartRef.current, { variantId: v.id, quantity: q }],
    );
    notify("Pilihanmu ditambahkan ke keranjang.");
  };
  const wishBusy = useRef(false);
  const toggleWish = async (id: string) => {
    if (wishBusy.current) return;
    wishBusy.current = true;
    const next = wishRef.current.includes(id)
      ? wishRef.current.filter((i) => i !== id)
      : [...wishRef.current, id];
    try {
      if (userRef.current) await api("/me/wishlist", "PUT", { ids: next });
      else persist("vassel_guest_wishlist_v1", next);
      setWishlist(next);
      notify(
        next.includes(id) ? "Disimpan ke favorit." : "Dihapus dari favorit.",
      );
    } catch (e: any) {
      notify(e.message, true);
    } finally {
      wishBusy.current = false;
    }
  };
  const logout = async () => {
    try {
      await api("/auth/logout", "POST");
      setData((d) => (d ? { ...d, me: null } : d));
      setCart([]);
      setWishlist([]);
      persist("vassel_guest_cart_v1", []);
      persist("vassel_guest_wishlist_v1", []);
      notify("Kamu sudah keluar.");
    } catch (e: any) {
      notify(e.message, true);
    }
  };
  if (!data)
    return (
      <div className="v-store v-loading">
        <VasselLogo variant="wordmark" />
        <p>{tr(error || "Menyiapkan pilihan VASSEL…")}</p>
        {tr(
          error ? (
            <button className="v-button" onClick={() => location.reload()}>
              {tr("Coba lagi")}
            </button>
          ) : (
            <div className="v-skeleton" />
          ),
        )}
      </div>
    );
  const route = path.split("?")[0];
  let page: React.ReactNode;
  if (route === "/") page = <HomePage />;
  else if (route === "/shop" || route === "/wishlist")
    page = <Catalog favorites={route === "/wishlist"} />;
  else if (route.startsWith("/products/"))
    page = (
      <ProductDetail key={route} slug={decodeURIComponent(route.slice(10))} />
    );
  else if (route === "/cart") page = <CartPage />;
  else if (route === "/checkout") page = <CheckoutPage />;
  else if (
    route === "/login" ||
    route === "/admin/login" ||
    route === "/register" ||
    route === "/forgot-password" ||
    route === "/reset-password"
  )
    page = (
      <AuthPage
        key={route}
        mode={
          route === "/admin/login"
            ? "admin"
            : route === "/register"
              ? "register"
              : route === "/forgot-password"
                ? "forgot"
                : route === "/reset-password"
                  ? "reset"
                  : "login"
        }
      />
    );
  else if (route === "/account") page = <AccountPage />;
  else if (route.startsWith("/orders/"))
    page = <OrderPage orderId={route.slice(8)} />;
  else if (route === "/admin")
    page = (
      <Suspense
        fallback={
          <div className="v-page">
            <div className="v-skeleton" />
          </div>
        }
      >
        <Admin />
      </Suspense>
    );
  else if (
    [
      "/help",
      "/privacy",
      "/terms",
      "/journal",
      "/boutiques",
      "/client-services",
      "/track-order",
    ].includes(route)
  )
    page = <Information route={route} />;
  else if (route === "/maison") page = <MaisonPage onNavigate={navigate} />;
  else if (route === "/atelier") page = <AtelierPage onNavigate={navigate} />;
  else if (route.startsWith("/collections/"))
    page = <LookbookPage onNavigate={navigate} />;
  else
    page = (
      <Empty
        title={tr("Halaman tidak ditemukan.")}
        text={tr("Mari kembali ke pilihan VASSEL.")}
      />
    );
  return (
    <StoreContext.Provider
      value={{
        data,
        cart,
        wishlist,
        path,
        navigate,
        refresh,
        setUser,
        updateCart,
        add,
        toggleWish,
        notify,
        logout,
      }}
    >
      <div
        className="v-store"
        onErrorCapture={(e) => {
          const img = e.target;
          if (
            img instanceof HTMLImageElement &&
            !img.closest(".campaign-hero") &&
            img.getAttribute("src") !== "/brand/vassel-original.webp"
          ) {
            img.src = "/brand/vassel-original.webp";
            img.alt = "Foto belum tersedia — VASSEL";
          }
        }}
        onClick={(e) => {
          const a = (e.target as HTMLElement).closest("a");
          const href = a?.getAttribute("href");
          if (
            a &&
            href?.startsWith("/") &&
            !href.startsWith("//") &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.shiftKey &&
            !a.target &&
            !a.download
          ) {
            e.preventDefault();
            navigate(href);
          }
        }}
      >
        <a className="v-skip" href="#main">
          {tr("Langsung ke konten")}
        </a>
        <div className="announcement">
          {tr(
            language === "fr"
              ? data.home.translations?.fr?.announcement ||
                  data.home.announcement
              : data.home.announcement,
          )}
        </div>
        <header className="site-header">
          <div className="header-main">
            <div className="header-left">
              <button
                className="icon-button"
                aria-label={tr(menu ? "Tutup menu" : "Buka menu")}
                aria-expanded={menu}
                aria-controls="mobile-menu"
                onClick={() => setMenu(!menu)}
              >
                {tr(menu ? <X size={18} /> : <Menu size={18} />)}
                <span className="explore-label">{tr("Explore")}</span>
              </button>
            </div>
            <a className="header-logo" href="/" aria-label={tr("Vassel home")}>
              <VasselLogo variant="wordmark" size="md" />
            </a>
            <div className="header-actions">
              <select
                className="language-select"
                aria-label={tr("Language / Langue")}
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "fr")}
              >
                <option value="en">{tr("EN")}</option>
                <option value="fr">{tr("FR")}</option>
              </select>
              <a
                href="/shop"
                className="icon-button secondary-action"
                aria-label={tr("Cari produk")}
              >
                <Search size={18} />
              </a>
              <a
                href="/wishlist"
                className="icon-button secondary-action"
                aria-label={tr(`Favorit, ${wishlist.length} produk`)}
              >
                <Heart size={18} />
              </a>
              <a
                href={data.me ? "/account" : "/login"}
                className="icon-button secondary-action"
                aria-label={tr(data.me ? "Akun saya" : "Masuk akun")}
              >
                <UserRound size={18} />
              </a>
              <a
                href="/cart"
                className="icon-button v-bag"
                aria-label={tr(
                  `Keranjang, ${cart.reduce((s, i) => s + i.quantity, 0)} produk`,
                )}
              >
                <ShoppingBag size={18} />
                {tr(
                  cart.length > 0 && (
                    <span>{tr(cart.reduce((s, i) => s + i.quantity, 0))}</span>
                  ),
                )}
              </a>
            </div>
          </div>
          <nav className="desktop-navigation" aria-label={tr("Navigasi utama")}>
            <a href="/shop">{tr("The collection")}</a>
            <a href="/shop?category=tas">{tr("Handbags")}</a>
            <a href="/shop?group=ready-to-wear">{tr("Ready-to-wear")}</a>
            <a href="/maison">{tr("The maison")}</a>
            <a href="/atelier">{tr("The atelier")}</a>
            <a href="/collections/signature">{tr("Lookbook")}</a>
          </nav>
          {tr(
            menu && (
              <nav
                className="expanded-navigation"
                id="mobile-menu"
                aria-label={tr("Menu ponsel")}
              >
                <a href="/shop">{tr("The collection")}</a>
                {tr(
                  data.categories.map((c) => (
                    <a href={"/shop?category=" + c.id} key={c.id}>
                      {tr(c.name)}
                    </a>
                  )),
                )}
                <a href="/wishlist">{tr("Favorit")}</a>
                <a href="/account">{tr("Akun & pesanan")}</a>
                <a href="/maison">{tr("The maison")}</a>
                <a href="/atelier">{tr("The atelier")}</a>
                <a href="/collections/signature">{tr("Lookbook")}</a>
                <a href="/help">{tr("Bantuan belanja")}</a>
                {tr(
                  data.me?.role === "admin" && (
                    <a href="/admin">{tr("Panel admin")}</a>
                  ),
                )}
              </nav>
            ),
          )}
        </header>
        <main id="main" tabIndex={-1} ref={mainRef}>
          {tr(page)}
        </main>
        <footer className="v-footer">
          <div className="v-footer-top">
            <div>
              <VasselLogo variant="full" theme="light" size="lg" />
              <p>
                {tr("Elegan, tanpa banyak kata.")}
                <br />
                {tr("Busana dan aksesori untuk cerita sehari-hari.")}
              </p>
            </div>
            <div>
              <p className="v-kicker">{tr("JELAJAHI")}</p>
              <a href="/shop">{tr("Koleksi VASSEL")}</a>
              <a href="/shop?collection=Signature">{tr("Signature")}</a>
              <a href="/maison">{tr("Tentang kami")}</a>
              <a href="/wishlist">{tr("Favoritmu")}</a>
            </div>
            <div>
              <p className="v-kicker">{tr("LAYANAN")}</p>
              <a href="/account">{tr("Akun & pesanan")}</a>
              <a href="/help">{tr("Pengiriman & pengembalian")}</a>
              <a href="/privacy">{tr("Privasi")}</a>
              <a href="/terms">{tr("Ketentuan belanja")}</a>
            </div>
            <div>
              <p className="v-kicker">{tr("RUANG VASSEL")}</p>
              <a href="/admin/login">{tr("Login admin")}</a>
              <span>{tr("Indonesia · IDR")}</span>
              <p className="v-note">
                {tr("Toko demo · Visual konsep")}
                <br />
                {tr("Pembayaran belum diaktifkan")}
              </p>
            </div>
          </div>
          <div className="v-footer-bottom">
            <span>
              {tr("©")} {tr(new Date().getFullYear())}{" "}
              {tr("VASSEL. Seluruh hak cipta dilindungi.")}
            </span>
            <span>{tr("BENTUK. TEKSTUR. KARAKTER.")}</span>
          </div>
        </footer>
        {tr(
          toast && (
            <div
              className={"v-toast " + (toast.error ? "error" : "")}
              role={toast.error ? "alert" : "status"}
            >
              {tr(
                toast.error ? (
                  <AlertCircle size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                ),
              )}
              <span>{tr(toast.message)}</span>
              <button
                className="v-icon"
                aria-label={tr("Tutup notifikasi")}
                onClick={() => setToast(null)}
              >
                <X size={17} />
              </button>
            </div>
          ),
        )}
      </div>
    </StoreContext.Provider>
  );
}
function Information({ route }: { route: string }) {
  const stories =
    route === "/maison" || route === "/atelier" || route === "/journal";
  return stories ? (
    <div className="v-story">
      <img
        src="/images/vassel-atelier.webp"
        alt={tr("Konsep kerajinan dan detail kulit VASSEL")}
      />
      <div className="v-page v-prose">
        <p className="v-kicker">{tr("TENTANG VASSEL")}</p>
        <h1>
          {tr("Karakter dalam")}
          <br />
          <em>{tr("setiap detail.")}</em>
        </h1>
        <p>
          {tr(
            "VASSEL berangkat dari bentuk yang sederhana, palet yang tenang, dan keinginan untuk hadir dengan percaya diri. Ivory, espresso, dan cognac menjadi bahasa visual kami.",
          )}
        </p>
        <p>
          {tr(
            "Koleksi di situs ini adalah katalog demonstrasi untuk memperkenalkan arah brand. Foto, bahan, dan ukuran contoh akan disesuaikan dengan produk nyata sebelum toko diluncurkan.",
          )}
        </p>
        <a href="/shop" className="v-button">
          {tr("Temukan koleksinya")}
          <ArrowUpRight size={16} />
        </a>
      </div>
    </div>
  ) : (
    <div className="v-page v-prose">
      <p className="v-kicker">{tr("LAYANAN VASSEL")}</p>
      <h1>
        {tr(
          route === "/privacy"
            ? "Privasi kamu."
            : route === "/terms"
              ? "Ketentuan belanja."
              : route === "/track-order"
                ? "Perjalanan pesananmu."
                : "Kami siap membantu.",
        )}
      </h1>
      {tr(
        route === "/privacy" ? (
          <>
            <h2>{tr("Data yang disimpan")}</h2>
            <p>
              {tr(
                "Akun, alamat, pesanan, wishlist, keranjang, dan persetujuan newsletter disimpan di database toko. Kata sandi disimpan dalam bentuk hash. Cookie sesi digunakan untuk login; cookie pengunjung anonim digunakan untuk statistik kunjungan.",
              )}
            </p>
            <h2>{tr("Kendali atas data")}</h2>
            <p>
              {tr(
                "Kamu dapat mengubah profil dan menghapus alamat atau favorit dari akun. Pada versi lokal ini, permintaan penghapusan akun dan berhenti langganan ditangani pengelola database. Kebijakan operasional dan kontak resmi perlu dilengkapi sebelum peluncuran.",
              )}
            </p>
          </>
        ) : route === "/terms" ? (
          <>
            <h2>{tr("Toko dalam mode demo")}</h2>
            <p>
              {tr(
                "Harga menggunakan Rupiah. Pesanan dan perubahan stok tersimpan, tetapi transfer bank dan QRIS hanya simulasi. Jangan mengirim dana untuk pesanan demo.",
              )}
            </p>
            <h2>{tr("Foto dan spesifikasi")}</h2>
            <p>
              {tr(
                "Foto katalog merupakan visual konsep atau referensi. Bahan, ukuran, stok, dan promosi pada seed adalah data contoh. Pengelola perlu memverifikasi seluruh data sebelum penjualan nyata.",
              )}
            </p>
          </>
        ) : (
          <>
            <h2>{tr("Pengiriman")}</h2>
            <p>
              {tr(
                "Simulasi reguler Rp 20.000 dengan estimasi 3–5 hari; gratis mulai subtotal Rp 750.000. Ekspres Rp 35.000 dengan estimasi 1–2 hari. Tarif nyata dan jangkauan kurir belum dihubungkan.",
              )}
            </p>
            <h2>{tr("Pembayaran & pelacakan")}</h2>
            <p>
              {tr(
                "Pilih transfer bank demo atau QRIS demo saat checkout. Admin memproses status dan mengisi nomor resi simulasi. Semua perkembangan bisa dilihat dari akunmu.",
              )}
            </p>
            <a href="/account" className="v-button">
              {tr("Lihat pesanan")}
              <ArrowUpRight size={16} />
            </a>
            <h2>{tr("Pengembalian & bantuan")}</h2>
            <p>
              {tr(
                "Kebijakan retur, alamat pengembalian, serta email dan nomor layanan pelanggan resmi akan diisi pemilik VASSEL sebelum peluncuran. Transaksi nyata belum dibuka.",
              )}
            </p>
          </>
        ),
      )}
    </div>
  );
}
