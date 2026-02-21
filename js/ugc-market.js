import { getIcon } from "./core/icon-system.js";
import { initMarketCore } from "./market-core.js";

const UGC_API = "https://pixel-market-api.a-kpr2024.workers.dev/api/ugc";

const UGC_CACHE_KEY = "pixel_ugc_cache_v2";
const CACHE_TTL = 5 * 60 * 1000;
const FETCH_TIMEOUT = 8000;

let fetchInProgress = false;

// ================= SANITIZE =================
function cleanString(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[^\w\- ]/g, "").trim();
}

function safeNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function isValidItem(item) {
  return item && typeof item.id === "string";
}

// ================= SAFE UI MESSAGE =================
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

// ================= CACHE =================
function loadFromCache() {
  const raw = localStorage.getItem(UGC_CACHE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    if (
      parsed &&
      Array.isArray(parsed.items) &&
      typeof parsed.time === "number" &&
      Date.now() - parsed.time < CACHE_TTL
    ) {
      return parsed.items;
    }

    localStorage.removeItem(UGC_CACHE_KEY);
  } catch {
    localStorage.removeItem(UGC_CACHE_KEY);
  }

  return null;
}

// ================= MAIN =================
async function loadUGCFast() {
  const cached = loadFromCache();

  if (cached) {
    initMarketCore(cached);
    refreshUGCInBackground();
    return;
  }

  showMessage("Loading data...");
  refreshUGCInBackground();
}

async function refreshUGCInBackground() {
  if (fetchInProgress) return;
  fetchInProgress = true;

  try {
    const json = await fetchWithTimeout(UGC_API, FETCH_TIMEOUT);

    if (!json || !Array.isArray(json.items)) {
      throw new Error("Invalid UGC structure");
    }

    const mapped = json.items
      .filter(isValidItem)
      .map((item) => {
        const id = cleanString(String(item.id).toLowerCase());

        return {
          id,
          displayName:
            cleanString(item.name) ||
            id.replace("itm_ugc-", "").replace(/-/g, " "),
          price: safeNumber(item.price),
          supply: item.supply ?? null,
          icon: getIcon("item", id),
          description: cleanString(item.description || ""),
        };
      })
      .filter((item) => item.id);

    if (!mapped.length) {
      throw new Error("Empty UGC dataset");
    }

    initMarketCore(mapped);

    // preload first 6 safely
    for (let i = 0; i < Math.min(6, mapped.length); i++) {
      const img = new Image();
      img.src = mapped[i].icon;
    }

    localStorage.setItem(
      UGC_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        items: mapped,
      }),
    );
  } catch (err) {
    console.warn("UGC refresh failed:", err.message);

    const hasCache = loadFromCache();
    if (!hasCache) {
      showMessage("Unable to load UGC data", true);
    }
  } finally {
    fetchInProgress = false;
  }
}

// ================= INIT =================
loadUGCFast();
