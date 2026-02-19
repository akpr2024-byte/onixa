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
  // Header
  loadHTML("header", "/components/header.html").then(() => bindProfileAuth());

  // Navbar
  loadHTML("navbar", "/components/navbar.html").then(() => {
    setupDropdownUX();

    // بعد از اولین paint index ساخته شود
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        initSkillDropdowns();
        buildGlobalIndex();
      });
    } else {
      setTimeout(() => {
        initSkillDropdowns();
        buildGlobalIndex();
      }, 200);
    }
  });

  // Footer
  loadHTML("footer", "/components/footer.html");

  if (!document.getElementById("popup-overlay")) {
    injectPopup();
  }
  if (!document.getElementById("auth-overlay")) {
    injectAuthModal();
  }
});

async function loadHTML(id, path) {
  const container = document.getElementById(id);
  if (!container) return;

  try {
    const res = await fetch(path);
    if (!res.ok) return;
    container.innerHTML = await res.text();
  } catch (err) {
    console.warn("Failed loading:", path);
  }
}
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

      <div class="auth-divider">
        <span></span><small>or</small><span></span>
      </div>

      <button class="auth-btn wallet">
        Continue with Wallet
      </button>

      <div class="auth-footer">
        Already have an account?
        <a href="#">Sign in</a>
      </div>

      <p class="auth-terms">
        By continuing, you agree to our
        <a href="#">Terms</a> and <a href="#">Privacy Policy</a>
      </p>

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
  let openedItem = null;

  document.querySelectorAll(".nav-item").forEach((item) => {
    const menu = item.querySelector(".dropdown-menu");
    if (!menu) return; // ⭐ اگر لیست نداره، دست نزن

    const trigger = item.querySelector("a");

    trigger.addEventListener("click", (e) => {
      const isOpen = item.classList.contains("open");

      // اگر قبلاً باز بوده → برو به صفحه Skill
      if (isOpen) {
        return; // اجازه بده لینک کار خودش رو بکنه
      }

      // اگر بسته بوده → فقط باز کن
      e.preventDefault();

      closeAll();
      item.classList.add("open");
      openedItem = item;
    });
  });

  // کلیک بیرون → ببند
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-item.dropdown")) {
      closeAll();
    }
  });

  // ESC → ببند
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
    }
  });

  function closeAll() {
    document
      .querySelectorAll(".nav-item.dropdown")
      .forEach((i) => i.classList.remove("open"));
    openedItem = null;
  }
}

async function loadMarketIndex() {
  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbw2BJxdEjBooLKIyNVFNwm7-T2tEOuuedj638MUTgPqiZ7qGvAz2NnEMY6bEUfGxCR-7A/exec?action=market",
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
  // 🟩 Craftable
  const overlay = document.getElementById("popup-overlay");
  if (!overlay) {
    console.warn("Popup not ready yet");
    return;
  }

  if (window.ITEM_BY_ID?.[itemId]) {
    window.openItemPopupById(itemId);
    return;
  }

  // 🟨 Market-only
  if (marketItem) {
    openMarketOnlyPopup(marketItem);
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
  if (window.SKILL_DATA[skill]) {
    return window.SKILL_DATA[skill];
  }

  if (!window.SKILL_PROMISES[skill]) {
    window.SKILL_PROMISES[skill] = fetch(`/data/skill/${skill}/${skill}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        window.SKILL_DATA[skill] = data;
        return data;
      })
      .catch(() => []);
  }

  return window.SKILL_PROMISES[skill];
}
