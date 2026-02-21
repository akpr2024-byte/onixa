import { getIcon } from "./core/icon-system.js";
import { initMarketCore } from "./market-core.js";

const MARKET_API = "/api/market";

const MARKET_CACHE_KEY = "pixel_market_cache_v2";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const FETCH_TIMEOUT = 8000;

let refreshInProgress = false;

// ================= SAFE VALIDATION =================
function isValidItem(item) {
  return (
    item &&
    typeof item.id === "string" &&
    (typeof item.price === "number" || item.price === null) &&
    (typeof item.supply === "number" ||
      typeof item.supply === "string" ||
      item.supply === null)
  );
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ================= LOADING UI =================
function showMessage(text, isError = false) {
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) return;

  tbody.textContent = "";

  const tr = document.createElement("tr");
  const td = document.createElement("td");

  td.colSpan = 4;
  td.style.textAlign = "center";
  td.style.opacity = isError ? "1" : ".6";
  if (isError) td.style.color = "#f66";

  td.textContent = text;
  tr.appendChild(td);
  tbody.appendChild(tr);
}

// ================= FETCH WITH TIMEOUT =================
async function fetchWithTimeout(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) throw new Error("Network response not ok");

    const json = await res.json();
    return json;
  } finally {
    clearTimeout(id);
  }
}

// ================= CACHE LOAD =================
function loadFromCache() {
  const cached = localStorage.getItem(MARKET_CACHE_KEY);
  if (!cached) return null;

  try {
    const parsed = JSON.parse(cached);

    if (
      parsed &&
      Array.isArray(parsed.items) &&
      typeof parsed.time === "number" &&
      Date.now() - parsed.time < CACHE_TTL
    ) {
      return parsed.items;
    }

    localStorage.removeItem(MARKET_CACHE_KEY);
  } catch {
    localStorage.removeItem(MARKET_CACHE_KEY);
  }

  return null;
}

// ================= MAIN LOAD =================
async function loadMarketFast() {
  const cachedItems = loadFromCache();

  if (cachedItems) {
    initMarketCore(cachedItems);
    refreshMarketInBackground(); // non blocking
    return;
  }

  showMessage("Loading data...");
  refreshMarketInBackground();
}

async function refreshMarketInBackground() {
  if (refreshInProgress) return;
  refreshInProgress = true;

  try {
    const json = await fetchWithTimeout(MARKET_API, FETCH_TIMEOUT);

    if (!json || !Array.isArray(json.items)) {
      throw new Error("Invalid API structure");
    }

    const mapped = json.items.filter(isValidItem).map((item) => ({
      id: item.id,
      displayName: item.name || item.id,
      price: safeNumber(item.price),
      supply: item.supply ?? null,
      icon: getIcon("item", item.id),
    }));

    if (!mapped.length) {
      throw new Error("Empty dataset");
    }

    initMarketCore(mapped);

    // preload first 6 icons
    for (let i = 0; i < Math.min(6, mapped.length); i++) {
      const img = new Image();
      img.src = mapped[i].icon;
    }

    // save only sanitized data
    localStorage.setItem(
      MARKET_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        items: mapped,
      }),
    );
  } catch (err) {
    console.warn("Market refresh failed:", err.message);

    const hasCache = loadFromCache();
    if (!hasCache) {
      showMessage("Unable to load market data", true);
    }
  } finally {
    refreshInProgress = false;
  }
}

// ================= INIT =================
loadMarketFast();
