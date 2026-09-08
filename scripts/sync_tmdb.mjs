import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_READ_TOKEN;
if (!token) throw new Error("TMDB_READ_TOKEN is required");

const region = process.env.TMDB_REGION || "IN";
const language = process.env.TMDB_LANGUAGE || "en-IN";
const pages = Number(process.env.TMDB_PAGES || 3);
const output = process.env.CATALOG_OUTPUT || "dist/data/catalog.json";
const discoveryLanguages = (process.env.TMDB_LANGUAGES || "en,hi,ta,te,ml,kn,bn,mr,pa")
  .split(",")
  .map(code => code.trim())
  .filter(Boolean);
const headers = { Authorization: `Bearer ${token}`, accept: "application/json" };
const baseUrl = "https://api.themoviedb.org/3";

async function tmdb(path, params = {}) {
  const url = new URL(`${baseUrl}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`TMDB ${response.status}: ${path}`);
  return response.json();
}

function serviceId(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("netflix")) return "netflix";
  if (normalized.includes("prime") || normalized.includes("amazon video")) return "prime";
  if (normalized.includes("jiohotstar") || normalized.includes("hotstar")) return "jiohotstar";
  if (normalized.includes("sony liv")) return "sonyliv";
  if (normalized.includes("zee5")) return "zee5";
  if (normalized.includes("apple tv")) return "apple";
  if (normalized.includes("lionsgate")) return "lionsgate";
  return null;
}

function languageName(code) {
  return ({ en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi", pa: "Punjabi", ko: "Korean", ja: "Japanese", es: "Spanish", fr: "French" })[code] || code?.toUpperCase() || "Other";
}

function serviceDeepLink(id, name) {
  const scopes = {
    netflix: "netflix.com/in/title",
    prime: "primevideo.com/detail",
    jiohotstar: "hotstar.com/in",
    sonyliv: "sonyliv.com",
    zee5: "zee5.com",
    apple: "tv.apple.com",
    lionsgate: "lionsgateplay.com",
  };
  const query = encodeURIComponent(`site:${scopes[id] || id} "${name}"`);
  return `https://www.google.com/search?btnI=1&q=${query}`;
}

function colorFor(id) {
  const colors = ["#50777e", "#6f3025", "#423a66", "#556b7e", "#a27b55", "#46634e", "#596f89", "#726d46", "#4d6267", "#aa6b4b"];
  return colors[Number(id) % colors.length];
}

const genreMaps = {
  movie: new Map((await tmdb("/genre/movie/list", { language })).genres.map(row => [row.id, row.name])),
  tv: new Map((await tmdb("/genre/tv/list", { language })).genres.map(row => [row.id, row.name])),
};

async function discover(type, page, originalLanguage) {
  return tmdb(`/discover/${type}`, {
    language,
    watch_region: region,
    region,
    include_adult: false,
    include_video: false,
    sort_by: "popularity.desc",
    vote_count_gte: originalLanguage ? 10 : 30,
    ...(originalLanguage ? { with_original_language: originalLanguage } : {}),
    page,
  });
}

async function enrich(item, type) {
  const providers = await tmdb(`/${type}/${item.id}/watch/providers`);
  const india = providers.results?.[region] || {};
  const providerRows = [...(india.flatrate || []), ...(india.free || []), ...(india.ads || [])];
  const mapped = [...new Set(providerRows.map(row => serviceId(row.provider_name)).filter(Boolean))];
  if (!mapped.length) return null;
  const name = item.title || item.name;
  const date = item.release_date || item.first_air_date || "";
  return {
    id: `tmdb-${type}-${item.id}`,
    tmdbId: item.id,
    name,
    type: type === "tv" ? "series" : "movie",
    year: date ? Number(date.slice(0, 4)) : null,
    language: languageName(item.original_language),
    genres: (item.genre_ids || []).map(id => genreMaps[type].get(id)).filter(Boolean),
    rating: Number((item.vote_average || 0).toFixed(1)),
    services: mapped,
    links: Object.fromEntries(mapped.map(id => [id, serviceDeepLink(id, name)])),
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    color: colorFor(item.id),
    summary: item.overview || "No summary available.",
  };
}

const raw = [];
const profiles = [...discoveryLanguages.map(originalLanguage => ({ originalLanguage })), { originalLanguage: null }];
for (const type of ["movie", "tv"]) {
  for (const profile of profiles) {
    for (let page = 1; page <= pages; page += 1) {
      const result = await discover(type, page, profile.originalLanguage);
      raw.push(...result.results.map(item => ({ item, type })));
    }
  }
}

const unique = [...new Map(raw.map(row => [`${row.type}-${row.item.id}`, row])).values()];
const enriched = [];
for (let index = 0; index < unique.length; index += 8) {
  const batch = await Promise.all(unique.slice(index, index + 8).map(row => enrich(row.item, row.type)));
  enriched.push(...batch.filter(Boolean));
}

const catalog = {
  updatedAt: new Date().toISOString(),
  source: "TMDB",
  region,
  items: enriched.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)),
};
await mkdir(output.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.items.length} titles to ${output}`);