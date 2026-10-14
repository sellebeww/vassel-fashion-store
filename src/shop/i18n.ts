import { useSyncExternalStore } from "react";
import raw from "./locales/phrases.tsv?raw";
export type Language = "en" | "fr";
const dictionary = new Map<string, [string, string]>();
for (const row of raw.trim().split("\n")) {
  const [key, en, fr] = row.split("\t");
  if (key && en && fr) {
    dictionary.set(key, [en, fr]);
    dictionary.set(en, [en, fr]);
  }
}
let language: Language = "en";
try {
  if (localStorage.getItem("vassel_language") === "fr") language = "fr";
} catch {}
const listeners = new Set<() => void>();
export const getLanguage = () => language;
export const getLocale = () => (language === "fr" ? "fr-FR" : "en-GB");
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem("vassel_language", next);
  } catch {}
  document.documentElement.lang = next;
  listeners.forEach((fn) => fn());
}
export function useLanguage() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getLanguage,
    () => "en" as Language,
  );
}
const patterns: Array<[RegExp, (m: RegExpMatchArray) => [string, string]]> = [
  [
    /^Sisa (\d+) — pilih sebelum kehabisan$/,
    (m) => [`Only ${m[1]} left`, `Plus que ${m[1]} en stock`],
  ],
  [/^Tersedia (\d+) pcs$/, (m) => [`${m[1]} available`, `${m[1]} disponibles`]],
  [
    /^Stok tersedia: (\d+)$/,
    (m) => [`Available stock: ${m[1]}`, `Stock disponible : ${m[1]}`],
  ],
  [/^Lihat foto (\d+)$/, (m) => [`View image ${m[1]}`, `Voir l’image ${m[1]}`]],
  [
    /^Favorit, (\d+) produk$/,
    (m) => [`Wishlist (${m[1]} pieces)`, `Favoris (${m[1]} pièces)`],
  ],
  [
    /^Keranjang, (\d+) produk$/,
    (m) => [`Shopping bag (${m[1]} pieces)`, `Panier (${m[1]} pièces)`],
  ],
  [
    /^Stok (.+) tersisa (\d+)\. Periksa jumlah di keranjang\.$/,
    (m) => [
      `Only ${m[2]} of ${m[1]} remain. Review your bag.`,
      `Il reste ${m[2]} unités de ${m[1]}. Vérifiez votre panier.`,
    ],
  ],
  [
    /^Stok (.+) tersisa (\d+)\.$/,
    (m) => [
      `Only ${m[2]} of ${m[1]} remain.`,
      `Il reste ${m[2]} unités de ${m[1]}.`,
    ],
  ],
  [
    /^Minimum belanja promo Rp (.+)\.$/,
    (m) => [
      `This offer requires a minimum spend of Rp ${m[1]}.`,
      `Cette offre nécessite un achat minimum de Rp ${m[1]}.`,
    ],
  ],
  [
    /^Hapus (.+)\? Produk akan dihapus dari katalog\.$/,
    (m) => [
      `Delete ${m[1]} from the catalogue?`,
      `Supprimer ${m[1]} du catalogue ?`,
    ],
  ],
  [
    /^(Tambahkan ke|Hapus dari) favorit (.+)$/,
    (m) => [
      `${m[1] === "Tambahkan ke" ? "Save" : "Remove"} ${m[2]} ${m[1] === "Tambahkan ke" ? "to" : "from"} wishlist`,
      `${m[1] === "Tambahkan ke" ? "Ajouter" : "Retirer"} ${m[2]} ${m[1] === "Tambahkan ke" ? "aux" : "des"} favoris`,
    ],
  ],
  [
    /^(.+) — foto (\d+)$/,
    (m) => [`${m[1]} — image ${m[2]}`, `${m[1]} — image ${m[2]}`],
  ],
];
/** Translate display strings only. Identifiers, form values and API payloads stay canonical. */
export function tr<T>(value: T): T {
  if (typeof value !== "string") return value;
  const key = value.replace(/\s+/g, " ").trim();
  const pair = dictionary.get(key);
  if (pair) return pair[language === "fr" ? 1 : 0] as T;
  for (const [pattern, make] of patterns) {
    const m = key.match(pattern);
    if (m) return make(m)[language === "fr" ? 1 : 0] as T;
  }
  const stockReason = key.match(/^(Pesanan|Pembatalan) (VS-.+)$/);
  if (stockReason)
    return ((language === "fr"
      ? stockReason[1] === "Pesanan"
        ? "Commande"
        : "Annulation"
      : stockReason[1] === "Pesanan"
        ? "Order"
        : "Cancellation") +
      " " +
      stockReason[2]) as T;
  if (key.startsWith("FR · ")) return ("FR · " + tr(key.slice(5))) as T;
  const cover = key.match(/^Jadikan foto (\d+) sampul$/);
  if (cover)
    return (
      language === "fr"
        ? `Définir l’image ${cover[1]} comme couverture`
        : `Use image ${cover[1]} as cover`
    ) as T;
  if (key.endsWith(" — visual referensi"))
    return (key.slice(0, -19) +
      (language === "fr" ? " — visuel conceptuel" : " — concept image")) as T;
  for (const prefix of [
    "Hapus alamat ",
    "Hapus kategori ",
    "Hapus varian ",
    "Hapus foto ",
    "Foto ",
    "Hapus ",
    "Naikkan ",
    "Turunkan ",
  ])
    if (key.startsWith(prefix))
      return `${tr(prefix.trim())} ${key.slice(prefix.length)}` as T;
  return value;
}
