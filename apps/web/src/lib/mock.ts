const p = (id: number, name: string, brand: string, category: string, price: number, change: number, hue: number) => ({
  id, name, brand, retailer: "Marcy's", category, price, change_pct: change,
  sales_rank: id, review_rank: 20 - id, launch_date: "2024-05-30",
  attrs: { size: "13cm*13cm*4cm", style: "Classic", material: "Leather", colors: ["Brown", "Black"] },
  image_hue: hue,
});

const PRODUCTS = [
  p(1, "Small Envelope Shoulder Bag", "Saint Laurent", "Woman - Accessories - Bag", 2050, 3.46, 28),
  p(2, "Cropped Cardigan 5064", "OAK + FORT", "Woman - Top", 205, -3.46, 200),
  p(3, "Ashadh Bag", "OAK + FORT", "Woman - Accessories - Bag", 205, 1.2, 340),
  p(4, "Slip Midi Dress", "Zara", "Woman - Dress", 89, 5.1, 150),
  p(5, "Croissant Hobo", "&Other Stories", "Woman - Accessories - Bag", 129, 2.3, 80),
  p(6, "Wrap Dress", "H&M", "Woman - Dress", 59, -1.4, 260),
  p(7, "Ribbed Knit Top", "COS", "Woman - Top", 69, 4.2, 110),
  p(8, "Ballet Flats", "Zara", "Woman - Shoes", 79, 0.8, 20),
  p(9, "Mini Tote", "Tommy Bruch", "Woman - Accessories - Bag", 350, 2.9, 300),
];

const HISTORY = Array.from({ length: 31 }, (_, i) => {
  const d = new Date(Date.now() - (30 - i) * 86400000);
  return {
    date: d.toISOString().slice(0, 10),
    brand_price: 2050 - (i > 26 ? (i - 26) * 120 : 0),
    retailer_price: 1980 - (i > 26 ? (i - 26) * 100 : 0),
    promo: i === 28 ? "20% off" : "",
  };
});

const FEEDBACK = {
  aspects: [
    { aspect: "Size", positive: 62, negative: 38, keywords: ["true to size", "runs small", "compact"] },
    { aspect: "Style", positive: 81, negative: 19, keywords: ["elegant", "versatile", "timeless"] },
    { aspect: "Quality", positive: 74, negative: 26, keywords: ["leather", "stitching", "hardware"] },
  ],
  top_terms: [
    { term: "leather", weight: 36 }, { term: "elegant", weight: 28 }, { term: "compact", weight: 22 },
    { term: "gift", weight: 18 }, { term: "pricey", weight: 15 }, { term: "classic", weight: 12 },
  ],
  source: "mock",
};

export const MOCK = {
  dashboard: {
    preference: {
      categories: ["Woman - Top", "Woman - Dress", "Woman - Accessories - Bag"],
      competitors: ["Zara", "H&M", "&Other Stories", "Tommy Bruch"],
      price_tier: "High Street",
    },
    stats: { all_items: 2458, new_items: 458, sales_items: 2258 },
    movers: PRODUCTS.slice(0, 8),
    categories: [
      { category: "Woman - Top", count: 812, avg_change: 2.1 },
      { category: "Woman - Dress", count: 640, avg_change: 4.3 },
      { category: "Woman - Accessories - Bag", count: 505, avg_change: 1.2 },
      { category: "Woman - Shoes", count: 301, avg_change: -0.8 },
      { category: "Man - Jeans", count: 200, avg_change: 0.4 },
    ],
  },
  products: PRODUCTS,
  product: { ...PRODUCTS[0], history: HISTORY, feedback: FEEDBACK },
  similar: PRODUCTS.slice(1, 7),
  collections: [
    { id: 1, name: "Bags", count: 22, shared_with: [2], products: PRODUCTS.filter(x => x.category.includes("Bag")) },
    { id: 2, name: "Shoes", count: 5, shared_with: [], products: PRODUCTS.filter(x => x.category.includes("Shoes")) },
  ],
  newsletters: {
    brands: ["Zara", "H&M", "&Other Stories", "COS"],
    items: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      brand: ["Zara", "H&M", "&Other Stories", "Marcy's"][i % 4],
      subject: ["Winter is Coming! Shop Our Snow Collection!", "48h Flash Sale — up to 40% off", "New Arrivals: The Studio Edit"][i % 3],
      kind: ["Sales Promotions", "New Product Announcement", "Editorial / Blogs"][i % 3],
      received_at: new Date(Date.now() - i * 43200000).toISOString(),
    })),
  },
  trends: [
    { id: 1, title: "Dior Fashion Show 2026 — Look 1", kind: "industry", season: "High Fashion 2026", summary: "Sculptural silhouettes and acid accents dominate.", body: "" },
    { id: 2, title: "Dior Fashion Show 2026 — Look 2", kind: "industry", season: "High Fashion 2026", summary: "Volume returns to outerwear.", body: "" },
    { id: 3, title: "TikTok Micro-trend #1", kind: "social", season: "Spring Social Signals", summary: "Ballet-core resurges with metallic twist.", body: "" },
  ],
  team: [
    { id: 1, name: "Yiren Xu", email: "yiren@pendulum.com", role: "admin" },
    { id: 2, name: "Miao Kang", email: "miao@pendulum.com", role: "member" },
    { id: 3, name: "Yifan Mao", email: "yifan@pendulum.com", role: "member" },
  ],
};
