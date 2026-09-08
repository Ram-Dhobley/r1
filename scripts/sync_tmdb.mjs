import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_READ_TOKEN;
if (!token) throw new Error("TMDB_READ_TOKEN is required");

const region = process.env.TMDB_REGION || "IN";
const language = process.env.TMDB_LANGUAGE || "en-IN";
const providerPages = Number(process.env.TMDB_PROVIDER_PAGES || 500);
const output = process.env.CATALOG_OUTPUT || "dist/data/catalog.json";
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

async function providerDirectory(type) {
  const response = await tmdb(`/watch/providers/${type}`, { watch_region: region, language });
  return response.results || [];
}

async function discoverByProvider(type, providerId, page) {
  return tmdb(`/discover/${type}`, {
    language,
    watch_region: region,
    region,
    with_watch_providers: providerId,
    with_watch_monetization_types: "flatrate|free|ads",
    include_adult: false,
    include_video: false,
    sort_by: "popularity.desc",
    vote_count_gte: 0,
    page,
  });
}

function toTitle(item, type, mappedServices) {
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
    services: mappedServices,
    links: Object.fromEntries(mappedServices.map(id => [id, serviceDeepLink(id, name)])),
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : "",
    color: colorFor(item.id),
    summary: item.overview || "No summary available.",
  };
}

async function collectProvider(type, target) {
  const firstPage = await discoverByProvider(type, target.providerId, 1);
  const totalPages = Math.min(firstPage.total_pages || 1, providerPages);
  const rows = firstPage.results.map(item => ({ item, type, service: target.service }));
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await discoverByProvider(type, target.providerId, page);
    rows.push(...result.results.map(item => ({ item, type, service: target.service })));
  }
  console.log(`${type}/${target.service}: fetched ${rows.length} titles across ${totalPages} page${totalPages === 1 ? "" : "s"}`);
  return rows;
}

const raw = [];
for (const type of ["movie", "tv"]) {
  const providerRows = await providerDirectory(type);
  const targets = providerRows
    .map(row => ({ providerId: row.provider_id, service: serviceId(row.provider_name) }))
    .filter(row => row.service);
  const uniqueTargets = [...new Map(targets.map(target => [`${target.service}-${target.providerId}`, target])).values()];
  if (!uniqueTargets.length) throw new Error(`No supported ${type} providers found for ${region}`);
  for (const target of uniqueTargets) {
    raw.push(...await collectProvider(type, target));
  }
}

const merged = new Map();
for (const row of raw) {
  const key = `${row.type}-${row.item.id}`;
  const existing = merged.get(key);
  if (existing) existing.services.add(row.service);
  else merged.set(key, { ...row, services: new Set([row.service]) });
}
const enriched = [...merged.values()].map(row => toTitle(row.item, row.type, [...row.services]));

const catalog = {
  updatedAt: new Date().toISOString(),
  source: "TMDB",
  region,
  coverage: `Provider catalogue, up to ${providerPages} pages per supported service and media type`,
  items: enriched.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)),
};
await mkdir(output.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${catalog.items.length} titles to ${output}`);