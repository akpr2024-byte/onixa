import { getIcon } from "./core/icon-system.js";
import { initMarketCore } from "./market-core.js";

const MARKET_API =
  "https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=market";

const MARKET_CACHE_KEY = "pixel_market_cache_v1";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadMarketFast() {
  const cached = localStorage.getItem(MARKET_CACHE_KEY);
  let hasValidCache = false;

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
        localStorage.removeItem(MARKET_CACHE_KEY);
      }
    } catch {
      localStorage.removeItem(MARKET_CACHE_KEY);
    }
  }

  if (!hasValidCache) {
    showLoading();
  }

  try {
    const res = await fetch(MARKET_API);
    const json = await res.json();

    if (!json || !Array.isArray(json.items)) {
      throw new Error("Invalid market response");
    }

    const mapped = json.items.map((item) => ({
      id: item.id,
      displayName: item.name || item.id,
      price: item.price,
      supply: item.supply,
      icon: getIcon("item", item.id),
    }));

    initMarketCore(mapped);

    // preload first 20 icons
    mapped.slice(0, 20).forEach((item) => {
      const img = new Image();
      img.src = item.icon;
    });

    localStorage.setItem(
      MARKET_CACHE_KEY,
      JSON.stringify({
        time: Date.now(),
        items: mapped,
      }),
    );
  } catch (e) {
    console.warn("Market API failed");

    if (!hasValidCache) {
      showError();
    }
  }
}

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
        Unable to load market data
      </td>
    </tr>
  `;
}

loadMarketFast();
