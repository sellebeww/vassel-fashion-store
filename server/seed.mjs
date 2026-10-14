import { english } from "./copy.mjs";
export const categories = [
  {
    id: "tas",
    name: "Tas",
    description: "Bentuk tegas, detail yang hangat.",
    image: "/images/vassel-signature.webp",
  },
  {
    id: "kemeja",
    name: "Kemeja",
    description: "Ringan menemani ritme sehari-hari.",
    image: "/images/vassel-shirt.webp",
  },
  {
    id: "jaket",
    name: "Jaket",
    description: "Lapisan elegan untuk setiap suasana.",
    image: "/images/vassel-jacket.webp",
  },
  {
    id: "celana",
    name: "Celana",
    description: "Siluet bersih, ruang untuk bergerak.",
    image: "/images/vassel-trousers.webp",
  },
  {
    id: "aksesori",
    name: "Aksesori",
    description: "Sentuhan kecil, karakter yang kuat.",
    image: "/images/vassel-cuff.webp",
  },
];
export const homepage = {
  title: "Presence, without a word.",
  subtitle: "A study in quiet elegance",
  description:
    "Sculptural silhouettes. A softer point of view. Discover the world of Vassel.",
  poster: "/images/vassel-campaign.webp",
  cta: "Explore the collection",
  ctaLink: "/shop",
  announcement: "A considered wardrobe. An enduring signature.",
  translations: {
    fr: {
      title: "Une présence, sans un mot.",
      subtitle: "Une étude de l’élégance discrète",
      description:
        "Des silhouettes sculpturales. Un regard tout en douceur. Découvrez l’univers Vassel.",
      cta: "Découvrir la collection",
      announcement: "Un vestiaire réfléchi. Une signature intemporelle.",
      promoTitle: "Un premier choix, une nouvelle histoire.",
      promoText:
        "Profitez de 10 % de réduction avec VASSEL10. Achat minimum : Rp 300.000. Réduction maximale : Rp 100.000.",
    },
  },
  promoTitle: "Pilihan pertama, cerita baru.",
  promoText:
    "Nikmati potongan 10% untuk koleksi pilihan dengan kode VASSEL10. Minimum belanja Rp 300.000, maksimal potongan Rp 100.000.",
  promoImage: "/images/vassel-lookbook.webp",
  sections: [
    "categories",
    "new",
    "bestseller",
    "promo",
    "testimonials",
    "newsletter",
  ],
  hiddenSections: ["categories", "new", "promo", "testimonials"],
  featuredIds: ["tas-01", "tas-02", "tas-03", "tas-04"],
  testimonials: [
    {
      name: "Nadia · contoh ulasan",
      text: "Warna netralnya mudah dipadukan. Detail yang sederhana terasa istimewa.",
    },
    {
      name: "Alya · contoh ulasan",
      text: "Siluetnya rapi dan pilihan ukurannya membantu menemukan yang pas.",
    },
    {
      name: "Rania · contoh ulasan",
      text: "Belanja terasa ringkas, dari memilih warna sampai melihat pesanan.",
    },
  ],
};
const names = [
  "Aruna",
  "Senja",
  "Laras",
  "Nala",
  "Sora",
  "Renata",
  "Avara",
  "Sela",
  "Rumi",
  "Elara",
  "Nara",
  "Amara",
  "Tara",
  "Luna",
  "Raya",
  "Ayla",
  "Aluna",
  "Savana",
  "Naura",
  "Serena",
  "Kaluna",
  "Alea",
  "Vela",
  "Kirani",
  "Adara",
];
const palettes = [
  ["Espresso", "#3e3029"],
  ["Ivory", "#eee5d6"],
  ["Hitam", "#23201e"],
  ["Sand", "#baa58c"],
  ["Cognac", "#935836"],
];
const config = {
  tas: {
    base: 499000,
    step: 45000,
    kind: ["Cabas", "Arche", "Sella", "Raffia", "Pochette"],
    images: [
      "/images/vassel-signature.webp",
      "/images/vassel-arche.webp",
      "/images/vassel-sella.webp",
      "/images/vassel-raffia.webp",
    ],
    material: "Kulit sintetis premium, lapisan tekstil, perangkat logam.",
    sizes: ["S", "M"],
    guide:
      "S: 22 × 16 × 9 cm; M: 28 × 20 × 12 cm. Dimensi contoh untuk katalog demo.",
  },
  kemeja: {
    base: 249000,
    step: 18000,
    kind: ["Linen", "Poplin", "Satin", "Relaxed", "Essential"],
    images: [
      "/images/vassel-shirt.webp",
      "/images/vassel-campaign.webp",
      "/images/vassel-lookbook.webp",
    ],
    material: "Campuran katun dan linen yang ringan.",
    sizes: ["S", "M", "L", "XL"],
    guide:
      "Lingkar dada / panjang (cm): S 96/66; M 100/68; L 104/70; XL 110/72. Toleransi 1–2 cm.",
  },
  jaket: {
    base: 459000,
    step: 22000,
    kind: ["Trench", "Tailored", "Atelier", "Collar", "Essential"],
    images: [
      "/images/vassel-jacket.webp",
      "/images/vassel-lookbook.webp",
      "/images/vassel-campaign.webp",
    ],
    material: "Twill katun dengan lapisan poliester lembut.",
    sizes: ["S", "M", "L", "XL"],
    guide:
      "Lingkar dada / panjang (cm): S 104/70; M 108/72; L 112/74; XL 118/76. Toleransi 1–2 cm.",
  },
  celana: {
    base: 299000,
    step: 19000,
    kind: ["Straight", "Pleated", "Wide Leg", "Tailored", "Relaxed"],
    images: [
      "/images/vassel-trousers.webp",
      "/images/vassel-lookbook.webp",
      "/images/vassel-campaign.webp",
    ],
    material: "Twill katun dengan sedikit elastane untuk kenyamanan.",
    sizes: ["S", "M", "L", "XL"],
    guide:
      "Lingkar pinggang / panjang (cm): S 68/98; M 72/100; L 76/102; XL 82/104. Toleransi 1–2 cm.",
  },
  aksesori: {
    base: 129000,
    step: 12000,
    kind: ["Cuff", "Bangle", "Sculpture", "Contour", "Signature"],
    images: [
      "/images/vassel-cuff.webp",
      "/images/vassel-signature.webp",
      "/images/vassel-atelier.webp",
    ],
    material:
      "Paduan logam dengan sentuhan warna bronze. Komposisi final mengikuti produk asli.",
    sizes: ["One Size"],
    guide:
      "Ukuran universal. Dimensi dan komposisi final perlu disesuaikan dengan produk asli.",
  },
};
export function seedProducts() {
  return categories.flatMap((cat, c) =>
    Array.from({ length: 25 }, (_, i) => {
      const cfg = config[cat.id],
        id = `${cat.id}-${String(i + 1).padStart(2, "0")}`,
        price = cfg.base + (i % 9) * cfg.step;
      const colors = [palettes[(i + c) % 5], palettes[(i + c + 1) % 5]];
      const cover = cfg.images[cat.id === "tas" ? i % cfg.images.length : 0];
      return {
        id,
        slug: `vassel-${cat.id}-${names[i].toLowerCase()}`,
        name: `VASSEL ${cfg.kind[i % 5]} ${names[i]}`,
        sku: `VS-${cat.id.toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
        category: cat.id,
        collection: i % 2 ? "Everyday Edit" : "Signature",
        description: `VASSEL ${names[i]} pairs clean lines with a considered palette. A quiet expression of character, imagined for the everyday. This demonstration catalogue uses concept imagery; photographs and specifications will be updated for the final products.`,
        translations: {
          fr: {
            description: `VASSEL ${names[i]} associe des lignes épurées à une palette soigneusement choisie. Une expression discrète du caractère, pensée pour le quotidien. Ce catalogue de démonstration utilise des visuels conceptuels ; les photos et caractéristiques seront adaptées aux produits définitifs.`,
          },
        },
        material: english(cfg.material),
        care: english(
          "Bersihkan lembut sesuai karakter bahan. Simpan di tempat kering dan hindari panas langsung.",
        ),
        sizeGuide: english(cfg.guide),
        price,
        comparePrice: i % 4 === 0 ? price + 90000 : 0,
        visible: i !== 24,
        featured: i < 4 && c === 0,
        sortOrder: c * 25 + i,
        labels: [
          i < 6 ? "Baru" : i % 3 === 0 ? "Terlaris" : "",
          i % 4 === 0 ? "Sale" : "",
        ].filter(Boolean),
        images: [cover, ...cfg.images.filter((x) => x !== cover)].slice(0, 3),
        imageNote: english(
          "Visual konsep / referensi. Foto dan spesifikasi produk asli akan diperbarui.",
        ),
        createdAt: new Date(Date.UTC(2026, 8, 25 - i)).toISOString(),
        variants: colors.flatMap(([color, hex], ci) =>
          cfg.sizes.map((size, si) => ({
            id: `${id}-${ci}-${si}`,
            sku: `VS-${cat.id.toUpperCase()}-${i + 1}-${ci}-${si}`,
            color,
            hex,
            size,
            stock:
              i % 11 === 10
                ? 0
                : i % 7 === 6
                  ? ci === 0 && si === 0
                    ? 3
                    : 0
                  : 15 + (((i + ci + si) * 7) % 38),
          })),
        ),
      };
    }),
  );
}
export const seedCoupons = [
  {
    id: "welcome",
    code: "VASSEL10",
    name: "Sambutan VASSEL",
    type: "percent",
    value: 10,
    minSpend: 300000,
    maxDiscount: 100000,
    limit: 1000,
    used: 0,
    active: true,
    start: "2026-01-01",
    end: "2027-12-31",
  },
  {
    id: "shipping",
    code: "ONGKIRVASSEL",
    name: "Bebas ongkir",
    type: "shipping",
    value: 0,
    minSpend: 500000,
    maxDiscount: 50000,
    limit: 500,
    used: 0,
    active: true,
    start: "2026-01-01",
    end: "2027-12-31",
  },
];

for (const category of categories) {
  category.name = english(category.name);
  category.description = english(category.description);
}
for (const key of ["promoTitle", "promoText"])
  homepage[key] = english(homepage[key]);
for (const item of homepage.testimonials) {
  item.name = english(item.name);
  item.text = english(item.text);
}
