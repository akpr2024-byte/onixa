import { getIcon } from "./core/icon-system.js";
import { initMarketCore } from "./market-core.js";

const UGC_API =
  "https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=ugc";

const UGC_CACHE_KEY = "pixel_ugc_cache_v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadUGCFast() {
  const cached = localStorage.getItem(UGC_CACHE_KEY);
  let hasValidCache = false;

  // ================= LOAD CACHE FIRST =================
  if (cached) {
    try {
      const parsed = JSON.parse(cached);

      if (
        parsed &&
        Array.isArray(parsed.items) &&
        Date.now() - parsed.time < CACHE_TTL
      ) {
        initMarketCore(parsed.items);
        hasValidCache = true;
      } else {
        localStorage.removeItem(UGC_CACHE_KEY);
      }
    } catch {
      localStorage.removeItem(UGC_CACHE_KEY);
    }
  }

  if (!hasValidCache) {
    showLoading();
  }

  // ================= FETCH FRESH DATA =================
  try {
    const res = await fetch(UGC_API);
    if (!res.ok) throw new Error("UGC API failed");

    const json = await res.json();

    if (!json || !Array.isArray(json.items)) {
      throw new Error("Invalid UGC response");
    }

    const mapped = json.items.map((item) => ({
      id: String(item.id).toLowerCase(),
      displayName:
        item.name ||
        item.id?.replace("itm_ugc-", "").replace(/-/g, " ").toLowerCase(),
      price: item.price ?? null,
      supply: item.supply ?? null,
      icon: getIcon("item", item.id),
      description: item.description || "",
    }));

    initMarketCore(mapped);

    // preload first 20 icons
    mapped.slice(0, 20).forEach((item) => {
      const img = new Image();
      img.src = item.icon;
    });

    localStorage.setItem(
      UGC_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        items: mapped,
      }),
    );
  } catch (err) {
    console.warn("UGC API failed");

    if (!hasValidCache) {
      showError();
    }
  }
}

// ================= UI STATES =================

function showLoading() {
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;opacity:.6">
        Loading data...
      </td>
    </tr>
  `;
}

function showError() {
  const tbody = document.querySelector("#dataTable tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;color:#f66;">
        Unable to load UGC data
      </td>
    </tr>
  `;
}

loadUGCFast();
