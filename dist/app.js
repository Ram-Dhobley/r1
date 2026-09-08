const services = [
  { id: "netflix", name: "Netflix", mark: "N" },
  { id: "prime", name: "Prime Video", mark: "P" },
  { id: "jiohotstar", name: "JioHotstar", mark: "J" },
  { id: "sonyliv", name: "Sony LIV", mark: "S" },
  { id: "zee5", name: "ZEE5", mark: "Z" },
  { id: "apple", name: "Apple TV+", mark: "A" },
  { id: "lionsgate", name: "Lionsgate Play", mark: "L" },
];

const demoTitles = [
  { id: 1, name: "The Pitt", type: "series", year: 2025, language: "English", genres: ["Drama"], rating: 8.9, services: ["jiohotstar"], color: "#50777e", summary: "A high-pressure emergency room drama that finds humanity in the middle of chaos." },
  { id: 2, name: "Sinners", type: "movie", year: 2025, language: "English", genres: ["Drama", "Thriller"], rating: 8.0, services: ["prime", "jiohotstar"], color: "#6f3025", summary: "Twin brothers return to their hometown and discover that something much darker is waiting." },
  { id: 3, name: "Panchayat", type: "series", year: 2020, language: "Hindi", genres: ["Comedy", "Drama"], rating: 9.0, services: ["prime"], color: "#c09e49", summary: "A reluctant engineer takes a government job in a remote village and finds an unexpected life." },
  { id: 4, name: "The Bear", type: "series", year: 2022, language: "English", genres: ["Comedy", "Drama"], rating: 8.5, services: ["jiohotstar"], color: "#b85a3c", summary: "A young chef comes home to run his family’s sandwich shop—and rebuild a broken team." },
  { id: 5, name: "Andhadhun", type: "movie", year: 2018, language: "Hindi", genres: ["Thriller", "Comedy"], rating: 8.2, services: ["netflix", "jiohotstar"], color: "#423a66", summary: "A blind pianist becomes tangled in a murder mystery where nothing is quite what it seems." },
  { id: 6, name: "Aavesham", type: "movie", year: 2024, language: "Malayalam", genres: ["Comedy", "Action"], rating: 7.8, services: ["prime"], color: "#9c4c35", summary: "Three college friends seek help from a local gangster and get far more than they bargained for." },
  { id: 7, name: "Severance", type: "series", year: 2022, language: "English", genres: ["Drama", "Thriller"], rating: 8.6, services: ["apple"], color: "#556b7e", summary: "Office workers undergo a procedure that separates their work memories from their personal lives." },
  { id: 8, name: "Laapataa Ladies", type: "movie", year: 2024, language: "Hindi", genres: ["Comedy", "Drama"], rating: 8.4, services: ["netflix"], color: "#a27b55", summary: "Two young brides go missing from a train, setting off a tender and funny search for identity." },
  { id: 9, name: "The Last of Us", type: "series", year: 2023, language: "English", genres: ["Drama", "Action"], rating: 8.7, services: ["jiohotstar"], color: "#46634e", summary: "A hardened survivor escorts a teenage girl across a ravaged America where hope is scarce." },
  { id: 10, name: "12th Fail", type: "movie", year: 2023, language: "Hindi", genres: ["Drama"], rating: 9.0, services: ["prime", "netflix"], color: "#596f89", summary: "A young man from Chambal restarts his life and takes on one of India’s toughest exams." },
  { id: 11, name: "Fallout", type: "series", year: 2024, language: "English", genres: ["Action", "Drama"], rating: 8.3, services: ["prime"], color: "#726d46", summary: "A sheltered vault dweller ventures into a dangerous wasteland shaped by a lost civilization." },
  { id: 12, name: "The Family Man", type: "series", year: 2019, language: "Hindi", genres: ["Action", "Comedy"], rating: 8.7, services: ["prime"], color: "#4d6267", summary: "A middle-class family man secretly works as an intelligence officer, balancing danger and domestic life." },
  { id: 13, name: "Interstellar", type: "movie", year: 2014, language: "English", genres: ["Drama", "Action"], rating: 8.7, services: ["prime", "jiohotstar"], color: "#263d59", summary: "Explorers travel through a wormhole in space in search of a new home for humanity." },
  { id: 14, name: "Gullak", type: "series", year: 2019, language: "Hindi", genres: ["Comedy", "Drama"], rating: 9.1, services: ["sonyliv"], color: "#aa6b4b", summary: "A warm, witty portrait of a small-town family, told through the everyday moments that matter." },
  { id: 15, name: "Masaan", type: "movie", year: 2015, language: "Hindi", genres: ["Drama"], rating: 8.1, services: ["netflix", "zee5"], color: "#4f7581", summary: "Four lives intersect along the Ganges as they face grief, love, and the possibility of starting again." },
  { id: 16, name: "The Office", type: "series", year: 2005, language: "English", genres: ["Comedy"], rating: 9.0, services: ["prime", "netflix"], color: "#7a715c", summary: "A documentary crew captures the everyday absurdities of life inside a paper company office." },
  { id: 17, name: "Suzhal: The Vortex", type: "series", year: 2022, language: "Tamil", genres: ["Thriller", "Drama"], rating: 8.2, services: ["prime"], color: "#4a5966", summary: "A small-town festival is shaken by a disappearance that reveals buried secrets." },
  { id: 18, name: "The Lunchbox", type: "movie", year: 2013, language: "Hindi", genres: ["Drama"], rating: 7.8, services: ["prime", "zee5"], color: "#947059", summary: "A mistaken lunch delivery creates an unexpected friendship between two lonely strangers." },
];

let titles = demoTitles;
let liveMode = false;
let lastUpdated = null;
const savedServices = JSON.parse(localStorage.getItem("watchwise-services") || "null");
const state = { selectedServices: new Set(savedServices || ["netflix", "prime", "jiohotstar"]), language: "all", genre: "all", type: "all", sort: "rating", query: "", saved: new Set(JSON.parse(localStorage.getItem("watchwise-saved") || "[]").map(String)) };
const $ = (id) => document.getElementById(id);

function serviceById(id) { return services.find(service => service.id === id); }

function renderServices() {
  $("serviceGrid").innerHTML = services.map(service => `
    <button class="service-chip ${state.selectedServices.has(service.id) ? "selected" : ""}" data-service="${service.id}" aria-pressed="${state.selectedServices.has(service.id)}">
      <span class="service-logo">${service.mark}</span>
      <span class="service-name">${service.name}<span class="check">✓</span></span>
    </button>`).join("");
  document.querySelectorAll("[data-service]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.service;
    state.selectedServices.has(id) ? state.selectedServices.delete(id) : state.selectedServices.add(id);
    localStorage.setItem("watchwise-services", JSON.stringify([...state.selectedServices]));
    renderServices(); updateStatus(); renderResults();
  }));
}

function populateFilters() {
  const languages = [...new Set(titles.map(title => title.language))].sort();
  const genres = [...new Set(titles.flatMap(title => title.genres))].sort();
  $("languageFilter").innerHTML = `<option value="all">Any language</option>${languages.map(language => `<option value="${language}">${language}</option>`).join("")}`;
  $("genreFilter").innerHTML = `<option value="all">Any genre</option>${genres.map(genre => `<option value="${genre}">${genre}</option>`).join("")}`;
  $("languageFilter").value = state.language; $("genreFilter").value = state.genre;
}

function updateStatus() {
  const count = state.selectedServices.size;
  $("subscriptionStatus").textContent = count ? `${count} service${count === 1 ? "" : "s"} selected` : "Choose at least one";
}

function filteredTitles() {
  const list = titles.filter(title => {
    const hasService = title.services.some(service => state.selectedServices.has(service));
    const hasQuery = !state.query || title.name.toLowerCase().includes(state.query.toLowerCase());
    const hasLanguage = state.language === "all" || title.language === state.language;
    const hasGenre = state.genre === "all" || title.genres.includes(state.genre);
    const hasType = state.type === "all" || title.type === state.type;
    return hasService && hasQuery && hasLanguage && hasGenre && hasType;
  });
  return list.sort((a, b) => state.sort === "name" ? a.name.localeCompare(b.name) : state.sort === "year" ? b.year - a.year : b.rating - a.rating);
}

function cardTemplate(title) {
  const label = title.type === "series" ? "SHOW" : "MOVIE";
  const image = title.poster ? ` background-image:url('${title.poster}')` : "";
  const saved = state.saved.has(String(title.id));
  return `<article class="title-card" data-card-details="${title.id}" tabindex="0" role="button" aria-label="Open details for ${title.name}">
    <div class="poster ${title.poster ? "has-image" : ""}" style="--poster:${title.color || "#526273"};${image}"><span class="poster-title">${title.name}</span><span class="poster-badge">${label}</span></div>
    <div class="card-body">
      <div class="card-topline"><span>${title.language} · ${title.year}</span><span class="rating"><span class="star">★</span> ${title.rating}</span></div>
      <h3>${title.name}</h3>
      <p class="card-summary">${title.summary}</p>
      <div class="card-actions"><button class="details-button" data-details="${title.id}">Open details →</button><button class="save-button ${saved ? "saved" : ""}" data-save="${title.id}" aria-label="${saved ? "Remove from saved" : "Save for later"}" title="${saved ? "Remove from saved" : "Save for later"}"><span>${saved ? "✓" : "+"}</span><span>${saved ? "Saved" : "Save"}</span></button></div>
    </div>
  </article>`;
}

function renderResults() {
  const result = filteredTitles();
  $("resultCount").textContent = `${result.length} title${result.length === 1 ? "" : "s"}`;
  $("resultsGrid").innerHTML = result.map(cardTemplate).join("");
  $("emptyState").hidden = result.length !== 0;
  document.querySelectorAll("[data-card-details]").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("button")) return;
      openDetails(card.dataset.cardDetails);
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetails(card.dataset.cardDetails);
      }
    });
  });
  document.querySelectorAll("[data-details]").forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    openDetails(button.dataset.details);
  }));
  document.querySelectorAll("[data-save]").forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.save;
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    localStorage.setItem("watchwise-saved", JSON.stringify([...state.saved]));
    $("savedCount").textContent = state.saved.size;
    renderResults();
  }));
}

function openDetails(id) {
  const title = titles.find(item => String(item.id) === String(id));
  if (!title) return;
  const links = title.services.filter(id => state.selectedServices.has(id)).map(id => {
    const service = serviceById(id);
    if (title.links && title.links[id]) return `<a class="watch-link" target="_blank" rel="noreferrer" href="${title.links[id]}">${service.name} ↗</a>`;
    const query = encodeURIComponent(title.name);
    const url = id === "netflix" ? `https://www.netflix.com/search?q=${query}` : id === "prime" ? `https://www.primevideo.com/search/ref=atv_nb_sug?phrase=${query}` : id === "jiohotstar" ? `https://www.hotstar.com/in/search?q=${query}` : id === "apple" ? "https://tv.apple.com/" : `https://www.google.com/search?q=${encodeURIComponent(service.name + " " + title.name)}`;
    return `<a class="watch-link" target="_blank" rel="noreferrer" href="${url}">${service.name} ↗</a>`;
  }).join("");
  $("dialogContent").innerHTML = `<div class="dialog-hero" style="--poster:${title.color}"><h2>${title.name}</h2></div><div class="dialog-body"><div class="dialog-meta"><span>${title.type === "series" ? "Series" : "Movie"}</span><span>${title.year}</span><span>${title.language}</span><span>★ ${title.rating} IMDb</span></div><p class="dialog-summary">${title.summary}</p><div class="watch-label">Available on your services</div><div class="watch-links">${links || "<span class=\"muted\">Select a matching service to see where to watch.</span>"}</div></div>`;
  $("detailDialog").showModal();
}

function resetFilters() {
  state.language = state.genre = state.type = "all"; state.query = "";
  $("languageFilter").value = "all"; $("genreFilter").value = "all"; $("typeFilter").value = "all"; $("searchFilter").value = "";
  renderResults();
}

$("languageFilter").addEventListener("change", event => { state.language = event.target.value; renderResults(); });
$("genreFilter").addEventListener("change", event => { state.genre = event.target.value; renderResults(); });
$("typeFilter").addEventListener("change", event => { state.type = event.target.value; renderResults(); });
$("searchFilter").addEventListener("input", event => { state.query = event.target.value.trim(); renderResults(); });
$("sortFilter").addEventListener("change", event => { state.sort = event.target.value; renderResults(); });
$("resetButton").addEventListener("click", resetFilters);
$("refreshButton").addEventListener("click", () => loadCatalog(true));
$("closeDialog").addEventListener("click", () => $("detailDialog").close());
$("detailDialog").addEventListener("click", event => { if (event.target === $("detailDialog")) $("detailDialog").close(); });
$("helpButton").addEventListener("click", () => $("helpDialog").showModal());
$("closeHelp").addEventListener("click", () => $("helpDialog").close());
$("helpDialog").addEventListener("click", event => { if (event.target === $("helpDialog")) $("helpDialog").close(); });

function updateDataStatus(message) {
  $("dataStatus").innerHTML = `<span class="tiny-dot"></span>${message}`;
}

async function loadCatalog(force = false) {
  updateDataStatus("Refreshing…");
  try {
    const response = await fetch(`data/catalog.json${force ? `?t=${Date.now()}` : ""}`, { cache: force ? "no-store" : "default" });
    if (!response.ok) throw new Error("Live catalog not available");
    const payload = await response.json();
    const incoming = Array.isArray(payload) ? payload : payload.items;
    if (!Array.isArray(incoming) || !incoming.length) throw new Error("Empty catalog");
    titles = incoming; liveMode = true; lastUpdated = payload.updatedAt || null;
    populateFilters();
    updateDataStatus(`Live catalog${lastUpdated ? ` · ${new Date(lastUpdated).toLocaleDateString()}` : ""}`);
    renderResults();
  } catch (error) {
    liveMode = false; titles = demoTitles; populateFilters();
    updateDataStatus("Demo catalog · live feed not connected");
    if (force) renderResults();
  }
}

populateFilters(); renderServices(); updateStatus(); $("savedCount").textContent = state.saved.size; renderResults(); loadCatalog();
