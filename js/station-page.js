window.ITEM_CRAFT_COSTS ||= {};
window.ITEM_NET_PROFITS ||= {};

import { calcNetProfit } from "./core/economy.js";

import { getItemById } from "./core/item-repository.js";
import { getIcon } from "./core/icon-system.js";

let ORIGINAL_ITEMS = [];
let CURRENT_SORT = {
  key: null, // اسم فیلد
  direction: null, // "asc" | "desc" | null
};

function toMarketId(name) {
  return (
    "itm_" +
    name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
  );
}

function expandItemsToRecipes(items) {
  if (!Array.isArray(items)) return [];

  const expanded = [];
  const indexMap = {};

  (window.GLOBAL_ITEM_INDEX || []).forEach((i) => {
    const key = `${i.id}_${i.skill}_${i.station}`;
    if (!indexMap[key]) indexMap[key] = [];
    indexMap[key].push(i);
  });

  for (const meta of items) {
    const key = `${meta.id}_${meta.skill}_${meta.station}`;
    const variants = indexMap[key] || [];

    if (variants.length > 0) {
      variants.forEach((v) => {
        expanded.push({
          ...meta,
          output: v.output || meta.output || 1,
          _recipe: v,
        });
      });
    } else {
      expanded.push(meta);
    }
  }

  return expanded;
}

function applySortAndRender() {
  let list = [...ORIGINAL_ITEMS];

  // 🔥 همیشه اول فلش‌ها پاک بشن
  document.querySelectorAll("th[data-sort-key]").forEach((th) => {
    th.classList.remove("sort-asc", "sort-desc");
  });

  if (CURRENT_SORT.key && CURRENT_SORT.direction) {
    const dir = CURRENT_SORT.direction === "asc" ? 1 : -1;

    list.sort((a, b) => {
      const getValue = (item) => {
        const output = item.output ?? 1;
        const key = `${item.id}__${output}`;

        switch (CURRENT_SORT.key) {
          case "marketPrice":
            return window.MARKET_PRICE_INDEX?.[item.id] ?? 0;
          case "craftCost":
            return window.ITEM_CRAFT_COSTS?.[key] ?? 0;
          case "netProfit":
            return window.ITEM_NET_PROFITS?.[key] ?? 0;
          default:
            return item[CURRENT_SORT.key] ?? 0;
        }
      };

      const va = getValue(a);
      const vb = getValue(b);

      return (va - vb) * dir;
    });

    const active = document.querySelector(
      `th[data-sort-key="${CURRENT_SORT.key}"]`,
    );

    active?.classList.add(
      CURRENT_SORT.direction === "asc" ? "sort-asc" : "sort-desc",
    );
  }

  renderTable(list);
  updateMarketPrices();
  window.CURRENT_ITEMS = list;
  tryRunEconomyPreload();
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForLayout();
  // اتصال سرچ لوکال + گلوبال
  if (window.GLOBAL_ITEM_INDEX?.length) {
    setupGlobalSearch();
  } else {
    document.addEventListener(
      "global-index-ready",
      () => {
        setupGlobalSearch();
      },
      { once: true },
    );
  }

  const params = new URLSearchParams(location.search);
  const skill = params.get("skill");
  const station = params.get("station");

  if (!skill) {
    console.error("Missing skill in URL");
    return;
  }

  // مسیر درست JSON
  let jsonPath = "";

  const skillLc = skill.toLowerCase();
  const stationLc = station?.toLowerCase();

  if (stationLc) {
    jsonPath = `/data/skill/${skillLc}/${stationLc}.json`;
  } else {
    jsonPath = `/data/skill/${skillLc}/${skillLc}.json`;
  }

  console.log("Loading:", jsonPath);

  try {
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error("JSON not found");
    const items = await res.json();
    items.sort((a, b) => {
      const levelA = a.level ?? 0;
      const levelB = b.level ?? 0;
      return levelA - levelB;
    });

    ORIGINAL_ITEMS = [...items];

    const expandedItems = expandItemsToRecipes(items);

    ORIGINAL_ITEMS = [...expandedItems];

    // ✅ اول جدول ساخته بشه
    renderTable(expandedItems);
    initTableSorting();

    // preload economy
    window.CURRENT_ITEMS = expandedItems;
    updateMarketPrices();
    tryRunEconomyPreload();

    updateMarketPrices(); // 👈 قیمت فوراً نمایش داده شود
    // تلاش برای preload (اگر market / index آماده باشد)
    tryRunEconomyPreload();
    setInterval(() => {}, 60_000); // هر ۱ دقیقه
  } catch (e) {
    console.error("Failed to load:", jsonPath, e);
  }
});

function waitForLayout() {
  return new Promise((resolve) => {
    const check = () => {
      if (document.querySelector("#items-body")) resolve();
      else setTimeout(check, 50);
    };
    check();
  });
}
function initTableSorting() {
  document.querySelectorAll("th[data-sort-key]").forEach((th) => {
    th.style.cursor = "pointer";

    th.addEventListener("click", () => {
      const key = th.dataset.sortKey;
      toggleSort(key);
    });
  });
}

async function waitForMarket() {
  if (window.MARKET_PRICE_INDEX) return;
  return new Promise((resolve) => {
    document.addEventListener("market-ready", resolve, { once: true });
  });
}

function renderTable(items) {
  const tbody = document.querySelector("#items-body");
  if (!tbody) return;

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const tr = document.createElement("tr");
    const output = item.output ?? 1;
    const key = `${item.id}__${output}`;

    tr.dataset.itemKey = key;
    tr.dataset.itemId = item.id;
    tr.dataset.output = output;

    tr.innerHTML = `
      <td>${item.skill || ""}</td>
      <td>${item.level ?? ""}</td>
      <td>${item.tier || ""}</td>
      <td>
        <div class="icon-wrapper">
          <img 
            data-src="${getIcon("item", item.id)}"
            height="28"
            width="28"
            loading="lazy"
            decoding="async"
          >
        </div>
      </td>
      <td class="item-name clickable"
        data-item-id="${item.id.startsWith("itm_") ? item.id : "itm_" + item.id}">
        ${item.name}
      </td>
      <td>${output}</td>
      <td class="market-price" data-item-id="${item.id}">-</td>
      <td>-</td>
      <td>-</td>
      <td>${item.energy ?? "-"}</td>
      <td>${item.xp ?? "-"}</td>
      <td>${item.time ?? "-"}</td>
    `;

    fragment.appendChild(tr);
  });

  tbody.innerHTML = "";
  tbody.appendChild(fragment);

  hydrateImages();
}
function hydrateImages() {
  const imgs = document.querySelectorAll("#items-body img");

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          obs.unobserve(img);
        }
      });
    },
    { rootMargin: "200px" },
  );

  imgs.forEach((img) => observer.observe(img));
}

function preloadVisibleIcons() {
  const icons = document.querySelectorAll("#items-body img");
  icons.forEach((img, index) => {
    if (index < 10) {
      img.loading = "eager";
    }
  });
}

document.addEventListener("click", (e) => {
  let el = e.target;

  while (el && el !== document) {
    if (el.classList?.contains("item-name")) {
      const id = el.dataset.itemId;
      if (id) {
        window.openItemPopup(id);
      }
      break;
    }
    el = el.parentElement;
  }
});

function toggleSort(key) {
  if (CURRENT_SORT.key !== key) {
    CURRENT_SORT = { key, direction: "asc" };
  } else if (CURRENT_SORT.direction === "asc") {
    CURRENT_SORT.direction = "desc";
  } else if (CURRENT_SORT.direction === "desc") {
    CURRENT_SORT = { key: null, direction: null };
  } else {
    CURRENT_SORT.direction = "asc";
  }

  applySortAndRender();
}
function filterLocalTable(query) {
  let list;

  if (!query) {
    list = ORIGINAL_ITEMS;
  } else {
    const q = query.toLowerCase();
    list = ORIGINAL_ITEMS.filter(
      (item) =>
        item.name?.toLowerCase().includes(q) ||
        item.skill?.toLowerCase().includes(q),
    );
  }

  renderTable(list);

  updateMarketPrices();

  window.CURRENT_ITEMS = list;
  tryRunEconomyPreload();
}

function setupGlobalSearch() {
  // فقط اگر جدول station وجود دارد فعال شود
  if (!document.querySelector("#itemsTable")) return;

  const input = document.getElementById("searchBox");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();

    // 1️⃣ فیلتر جدول همین صفحه
    filterLocalTable(q);

    // 2️⃣ سرچ global (dropdown)
    const box = document.getElementById("global-search-results");

    if (q.length < 2) {
      if (box) box.style.display = "none";
      return;
    }

    const results = (window.GLOBAL_ITEM_INDEX || [])
      .filter((i) => i.name?.toLowerCase().includes(q))
      .slice(0, 20);

    if (!results.length) {
      if (box) box.style.display = "none";
      return;
    }

    showSearchResults(results);
  });
}

function showSearchResults(results) {
  let box = document.getElementById("global-search-results");
  const input = document.getElementById("searchBox");

  if (!box) {
    box = document.createElement("div");
    box.id = "global-search-results";
    box.className = "search-results";
    document.body.appendChild(box);
  }

  const rect = input.getBoundingClientRect();
  box.style.position = "absolute";
  box.style.top = rect.bottom + window.scrollY + "px";
  box.style.left = rect.left + "px";
  box.style.width = rect.width + "px";

  box.innerHTML = "";

  results.forEach((r) => {
    const div = document.createElement("div");
    div.className = "search-result-item";

    div.innerHTML =
      `<img 
         src="${getIcon("item", r.id)}" 
         width="22"
         loading="lazy"
         decoding="async"
         style="margin-right:8px;vertical-align:middle"
       >` +
      `${r.name}` +
      `<span style="opacity:.6"> (${r.skill} → ${r.station})</span>`;

    div.onclick = () => {
      location.href =
        "/pages/station.html?skill=" +
        encodeURIComponent(r.skill) +
        "&station=" +
        encodeURIComponent(r.station);
    };

    box.appendChild(div);
  });
}

function normalizeSkill(skill) {
  return skill.toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function updateMarketPrices() {
  document.querySelectorAll(".market-price").forEach((cell) => {
    const id = cell.dataset.itemId;
    const price = window.MARKET_PRICE_INDEX?.[id];

    if (price != null) {
      cell.innerHTML = formatValue("coin", price);
      cell.classList.add("price-loaded");
    }
  });
}

window.openItemPopupFromEl = function (el) {
  openItemPopupById(el.dataset.itemId);
};

function updateTableRow(itemId, output = 1) {
  const key = `${itemId}__${output}`;
  const tr = document.querySelector(`#items-body tr[data-item-key="${key}"]`);
  if (!tr) return;

  const craftCost = window.ITEM_CRAFT_COSTS?.[key];
  const netProfit = window.ITEM_NET_PROFITS?.[key];

  if (craftCost != null) {
    tr.children[7].innerHTML = formatValue("coin", craftCost);
  }

  if (netProfit != null) {
    const cell = tr.children[8];
    cell.innerHTML =
      (netProfit > 0 ? "+" : "") + formatValue("coin", netProfit);
    cell.className =
      netProfit > 0 ? "profit-good" : netProfit < 0 ? "profit-bad" : "";
  }
}

async function preloadEconomyForTable(items) {
  if (!Array.isArray(items) || items.length === 0) return;

  const market = window.MARKET_PRICE_INDEX || {};
  const BATCH_SIZE = 20;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (meta) => {
        const output = meta.output ?? 1;
        const fullItem = await getItemById(meta.id, { output });
        if (!fullItem) return;

        const hasIngredients =
          Array.isArray(fullItem.ingredients) &&
          fullItem.ingredients.length > 0;

        const marketPrice = market[fullItem.id];

        let craftCost = null;
        let netProfit = null;

        if (hasIngredients) {
          const result = calcNetProfit(fullItem, market);
          craftCost = result.craft.total;
          if (marketPrice != null) netProfit = result.netProfit;
        } else {
          craftCost = 0;
          if (marketPrice != null) netProfit = marketPrice;
        }

        const key = `${meta.id}__${output}`;
        window.ITEM_CRAFT_COSTS[key] = craftCost;
        window.ITEM_NET_PROFITS[key] = netProfit;
      }),
    );

    // 🔥 اجازه بده UI نفس بکشه
    await new Promise((r) => setTimeout(r, 0));

    // حالا DOM رو آپدیت کن
    batch.forEach((meta) => {
      const output = meta.output ?? 1;
      updateTableRow(meta.id, output);
    });
  }
}

function tryRunEconomyPreload() {
  if (
    window.CURRENT_ITEMS &&
    Array.isArray(window.CURRENT_ITEMS) &&
    window.CURRENT_ITEMS.length > 0 &&
    window.MARKET_PRICE_INDEX &&
    window.ITEM_BY_ID &&
    Object.keys(window.ITEM_BY_ID).length > 0
  ) {
    preloadEconomyForTable(window.CURRENT_ITEMS);
  }
}

// وقتی market آماده شد
document.addEventListener("market-ready", () => {
  updateMarketPrices();
  tryRunEconomyPreload();
});

// وقتی index آیتم‌ها آماده شد
document.addEventListener("global-index-ready", tryRunEconomyPreload);
async function preloadEconomyData() {
  if (!window.CURRENT_ITEMS?.length) return;

  await waitForMarket();

  for (const item of window.CURRENT_ITEMS) {
    const output = item.output ?? 1;
    const key = `${item.id}__${output}`;

    const marketPrice = window.MARKET_PRICE_INDEX?.[item.id] ?? null;

    const craft = calcCraftCost(item, window.MARKET_PRICE_INDEX);
    const net = calcNetProfit(item, window.MARKET_PRICE_INDEX);

    window.ITEM_CRAFT_COSTS[key] = craft?.total ?? null;
    window.ITEM_NET_PROFITS[key] = net ?? null;

    const row = document.querySelector(`[data-item-key="${key}"]`);
    if (!row) continue;

    row.querySelector(".market-price").innerHTML =
      marketPrice != null ? formatNumber(marketPrice) : "-";

    row.querySelector(".craft-cost").innerHTML =
      craft?.total != null ? formatNumber(craft.total) : "-";

    row.querySelector(".net-profit").innerHTML =
      net != null ? formatNumber(net) : "-";
  }
}
