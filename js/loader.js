import { getIcon } from "./core/icon-system.js";

window.ITEM_BY_ID = {};
window.SKILL_DATA = {};
window.GLOBAL_ITEM_INDEX = [];
window.USED_IN_INDEX = {};
window.MARKET_PRICE_INDEX ||= {};

function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}

/* ------------------------------
   DOM READY – NON BLOCKING
--------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  // ✅ همیشه UX و Dropdown فعال باشد
  setupDropdownUX();
  initSkillDropdowns();

  // ✅ فقط در صفحات سنگین index ساخته شود
  if (
    document.body.classList.contains("station-page") ||
    document.body.classList.contains("home-page")
  ) {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        buildGlobalIndex();
      });
    } else {
      setTimeout(() => {
        buildGlobalIndex();
      }, 200);
    }
  }

  // ✅ Popup همیشه آماده باشد
  if (!document.getElementById("popup-overlay")) {
    injectPopup();
  }

  // ✅ Auth modal اگر خواستی فعال باشد
  if (!document.getElementById("auth-overlay")) {
    injectAuthModal();
  }

  // اگر bindProfileAuth استفاده می‌کنی
  bindProfileAuth();
});

function bindProfileAuth() {
  const profileBtn = document.getElementById("profileBtn");
  const authOverlay = document.getElementById("auth-overlay");

  if (!profileBtn || !authOverlay) {
    console.warn("Profile/Auth elements not found");
    return;
  }

  // باز کردن مودال
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    authOverlay.classList.remove("hidden");
  });

  // کلیک بیرون = بستن
  authOverlay.addEventListener("click", (e) => {
    if (e.target === authOverlay) {
      authOverlay.classList.add("hidden");
    }
  });

  // ESC = بستن
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      authOverlay.classList.add("hidden");
    }
  });

  console.log("Profile auth bound ✅");
}
function injectPopup() {
  const popupHTML = `
    <div id="popup-overlay" class="hidden">
      <div class="popup">
        <button class="close-btn" id="popup-close-btn">✖</button>
        <h3 id="popup-title"></h3>
        <div id="popup-variant-selectors"></div>
        <div id="popup-content"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", popupHTML);
  document.addEventListener("click", (e) => {
    if (e.target.id === "popup-close-btn") {
      closePopup();
    }
  });
}

function injectAuthModal() {
  const html = `
  <div id="auth-overlay" class="auth-overlay hidden">
    <div class="auth-modal">

      <h2 class="auth-title">Sign up</h2>
      <h2 class="auth-title">Coming soon</h2>

      <button class="auth-btn google">
        Connect Pixel Account
      </button>

      <button class="auth-btn apple">
        Install Extension
      </button>

      <button class="auth-btn email">
        Sign up with Email
      </button>

    </div>
  </div>
  `;

  document.body.insertAdjacentHTML("beforeend", html);
}

async function initSkillDropdowns() {
  const dropdowns = document.querySelectorAll(".nav-item.dropdown");

  await Promise.all(
    [...dropdowns].map(async (dd) => {
      const skill = dd.dataset.skill;
      const menu = dd.querySelector(".dropdown-menu");
      if (!menu) return;

      try {
        const items = await getSkillData(skill);
        if (!items.length) return;

        const stations = [
          ...new Set(items.map((i) => i.station).filter(Boolean)),
        ].sort();

        stations.forEach((station) => {
          const a = document.createElement("a");
          a.href = `/pages/station.html?skill=${encodeURIComponent(skill)}&station=${encodeURIComponent(station)}`;

          const img = document.createElement("img");
          img.src = getIcon("station", station);

          const span = document.createElement("span");
          span.textContent = station;

          a.appendChild(img);
          a.appendChild(span);
          menu.appendChild(a);
        });
      } catch {}
    }),
  );
}

function setupDropdownUX() {
  // فقط فلش‌ها کنترل‌کننده باشند
  document.querySelectorAll(".dropdown-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const parent = btn.closest(".nav-item.dropdown");
      const isOpen = parent.classList.contains("open");

      // بستن همه
      document
        .querySelectorAll(".nav-item.dropdown")
        .forEach((item) => item.classList.remove("open"));

      // اگر قبلاً باز نبود → باز کن
      if (!isOpen) {
        parent.classList.add("open");
      }
    });
  });

  // کلیک بیرون → ببند
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-item.dropdown")) {
      document
        .querySelectorAll(".nav-item.dropdown")
        .forEach((item) => item.classList.remove("open"));
    }
  });

  // ESC → ببند
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document
        .querySelectorAll(".nav-item.dropdown")
        .forEach((item) => item.classList.remove("open"));
    }
  });
}

async function loadMarketIndex() {
  try {
    const res = await fetch(
      "https://pixel-market-api.a-kpr2017.workers.dev?action=market",
    );

    const json = await res.json();
    const items = json.items || [];

    items.forEach((item) => {
      if (item.id && item.price != null) {
        const price = Number(item.price);
        if (!Number.isFinite(price)) return;
        window.MARKET_PRICE_INDEX[item.id] = price;
      }
    });

    localStorage.setItem(
      "MARKET_PRICE_CACHE",
      JSON.stringify({
        time: Date.now(),
        prices: window.MARKET_PRICE_INDEX,
      }),
    );

    document.dispatchEvent(new Event("market-ready"));
  } catch {
    document.dispatchEvent(new Event("market-ready"));
  }
}

// 🔥 FAST: load cached market prices first (non-blocking)
const cachedPrices = localStorage.getItem("MARKET_PRICE_CACHE");
if (cachedPrices) {
  try {
    const parsed = JSON.parse(cachedPrices);
    window.MARKET_PRICE_INDEX = parsed.prices || {};
  } catch {}
}
// Load fresh prices async
loadMarketIndex();

window.formatValue = function (type, value) {
  if (value == null || value === "-") return "-";

  const num = Number(value);
  const formatted = Number.isInteger(num)
    ? num.toLocaleString()
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });

  switch (type) {
    case "coin":
      return `${formatted} <img src="${getIcon("ui", "coin")}" class="ui-icon">`;
    case "energy":
      return `${formatted} <img src="${getIcon("ui", "energy")}" class="ui-icon">`;
    case "xp":
      return `+ ${formatted}`;
    default:
      return formatted;
  }
};

function formatTime(minutes) {
  if (minutes == null || isNaN(minutes)) return "-";

  const totalSeconds = Math.round(minutes * 60);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  let parts = [];

  if (h > 0) parts.push(`${h} h`);
  if (m > 0) parts.push(`${m} min`);
  if (s > 0) parts.push(`${s} s`);

  if (parts.length === 0) return "( 0 s )";

  return `( ${parts.join(" ")} )`;
}
async function buildGlobalIndex() {
  window.GLOBAL_ITEM_INDEX = [];
  window.ITEM_BY_ID = {};
  window.USED_IN_INDEX = {};

  const skills = [
    "farming",
    "cooking",
    "animal_care",
    "mining",
    "forestry",
    "exploration",
    "business",
    "metalworking",
    "stoneshaping",
    "woodwork",
  ];

  for (const skill of skills) {
    try {
      const items = await getSkillData(skill);
      processSkill(skill, items);

      // اجازه بده UI render بشه
      await new Promise(requestAnimationFrame);
    } catch {
      console.warn("Index failed:", skill);
    }
  }

  document.dispatchEvent(new Event("global-index-ready"));
  console.log("Global index ready ✅");
}
function processSkill(skill, items) {
  items.forEach((item) => {
    if (!item.id) return;

    // popup index
    window.ITEM_BY_ID[item.id] ??= [];
    window.ITEM_BY_ID[item.id].push({
      id: item.id,
      recipe_id: item.recipe_id,
      skill: item.skill,
      station: item.station,
      multi_recipe: item.multi_recipe === true,
    });

    // search index
    const indexItem = {
      id: item.id,
      name: item.name,
      skill,
      station: item.station || skill,
      output: item.output || 1,
      ingredients: item.ingredients || [],
      recipeKey: `${item.id}__${item.output || 1}`,
    };

    window.GLOBAL_ITEM_INDEX.push(indexItem);

    // used-in index
    if (Array.isArray(item.ingredients)) {
      item.ingredients.forEach((ing) => {
        window.USED_IN_INDEX[ing.id] ||= [];
        window.USED_IN_INDEX[ing.id].push({
          id: item.id,
          name: item.name,
          qty: ing.qty,
        });
      });
    }
  });
}
window.openItemPopup = function (itemId, marketItem = null) {
  const overlay = document.getElementById("popup-overlay");
  if (!overlay) return;

  // اگر index هنوز آماده نیست
  if (!window.ITEM_BY_ID || Object.keys(window.ITEM_BY_ID).length === 0) {
    overlay.classList.remove("hidden");

    document.getElementById("popup-title").innerHTML = "Loading...";
    document.getElementById("popup-content").innerHTML =
      "<div>Loading item data...</div>";

    if (!window.__INDEX_BUILDING__) {
      window.__INDEX_BUILDING__ = true;

      buildGlobalIndex();
    }

    document.addEventListener(
      "global-index-ready",
      () => {
        window.__INDEX_BUILDING__ = false;
        window.openItemPopup(itemId, marketItem);
      },
      { once: true },
    );

    return;
  }

  // craftable
  if (window.ITEM_BY_ID[itemId]) {
    window.openItemPopupById(itemId);
    return;
  }

  // market only
  if (marketItem) {
    window.openMarketOnlyPopup(marketItem);
    return;
  }

  console.warn("No popup available for item:", itemId);
};

window.openMarketOnlyPopup = function (item) {
  if (!item) return;

  const overlay = document.getElementById("popup-overlay");
  const titleEl = document.getElementById("popup-title");
  const content = document.getElementById("popup-content");

  if (!overlay || !titleEl || !content) {
    console.warn("Popup DOM not ready");
    return;
  }

  titleEl.innerHTML = `
    <span class="popup-title-wrap">
      <img src="${item.icon || getIcon("ui", "unknown")}"
     class="popup-title-icon">
      <span>${escapeHTML(item.displayName || item.name || item.id)}</span>
    </span>
  `;

  content.innerHTML = `
    <div class="market-only-popup">
      <div class="market-only-main">
        <img src="${item.icon || getIcon("ui", "unknown")}"
        class="market-only-icon">
        <div class="market-only-info">
          <div class="info-row">
            <span>Price</span>
            <b>${formatValue("coin", item.price)}</b>
          </div>

          <div class="info-row">
            <span>Supply</span>
            <b>${item.supply ?? "-"}</b>
          </div>
        </div>
      </div>

      <div class="market-only-desc">
        <div class="desc-title">Description</div>
        <div class="desc-box">
          ${escapeHTML(item.description || "This item is a market-only item.")}
        </div>
      </div>
    </div>
  `;

  overlay.classList.remove("hidden");
};

function closePopup() {
  const overlay = document.getElementById("popup-overlay");
  if (!overlay) return;

  overlay.classList.add("hidden");

  // optional: پاک‌سازی محتوا
  const content = document.getElementById("popup-content");
  if (content) content.innerHTML = "";
}
document.addEventListener("click", (e) => {
  const overlay = document.getElementById("popup-overlay");
  if (!overlay || overlay.classList.contains("hidden")) return;

  // اگر کلیک روی خود overlay بود (نه داخل popup)
  if (e.target === overlay) {
    closePopup();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  const overlay = document.getElementById("popup-overlay");
  if (!overlay || overlay.classList.contains("hidden")) return;

  closePopup();
});
window.SKILL_PROMISES ||= {};

async function getSkillData(skill) {
  const cacheKey = "SKILL_CACHE_" + skill;

  // 1️⃣ اول از localStorage بخون
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      window.SKILL_DATA[skill] = parsed;
      return parsed;
    } catch {}
  }

  // 2️⃣ اگر نبود fetch کن
  const res = await fetch(`/data/skill/${skill}/${skill}.json`);
  const data = res.ok ? await res.json() : [];

  window.SKILL_DATA[skill] = data;

  // 3️⃣ ذخیره کن
  localStorage.setItem(cacheKey, JSON.stringify(data));

  return data;
}

const jsonCache = {};
// 🧠 Smart background prebuild
if (
  !document.body.classList.contains("market-a") &&
  !document.body.classList.contains("market-b")
) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => {
      if (!window.GLOBAL_ITEM_INDEX?.length) {
        buildGlobalIndex();
      }
    });
  } else {
    setTimeout(() => {
      if (!window.GLOBAL_ITEM_INDEX?.length) {
        buildGlobalIndex();
      }
    }, 1500);
  }
}
