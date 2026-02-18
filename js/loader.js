import { getIcon } from "./core/icon-system.js";

window.ITEM_BY_ID = {};
window.SKILL_DATA = {};

document.addEventListener("DOMContentLoaded", async () => {
  // HEADER
  await loadHTML("header", "/components/header.html");
  bindProfileAuth(); // 👈 اینجا

  // اضافه کن

  // NAVBAR (مهم‌ترین بخش)
  await loadHTML("navbar", "/components/navbar.html");
  await Promise.all([initSkillDropdowns(), buildGlobalIndex()]);

  setupDropdownUX();

  // FOOTER
  loadHTML("footer", "/components/footer.html");

  // POPUP
  injectPopup();
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

async function loadHTML(id, path) {
  const res = await fetch(path);
  const html = await res.text();
  document.getElementById(id).innerHTML = html;
  return true; // 👈 مهم
}

function injectPopup() {
  const popupHTML = `
  <div id="popup-overlay" class="hidden">
    <div class="popup">
      <button class="close-btn" onclick="closePopup()">✖</button>
      <h3 id="popup-title"></h3>
      <div id="popup-variant-selectors"></div>
      <div id="popup-content"></div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML("beforeend", popupHTML);
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

  for (const dd of dropdowns) {
    const skill = dd.dataset.skill;
    const menu = dd.querySelector(".dropdown-menu");
    if (!menu) continue;

    try {
      // خواندن فایل اصلی skill
      const items = await getSkillData(skill);
      if (!items.length) continue;

      // گرفتن stationهای یکتا از آیتم‌ها
      const stations = [
        ...new Set(items.map((i) => i.station).filter(Boolean)),
      ].sort();

      stations.forEach((station) => {
        const a = document.createElement("a");
        a.href = `/pages/station.html?skill=${encodeURIComponent(
          skill,
        )}&station=${encodeURIComponent(station)}`;

        const img = document.createElement("img");
        img.src = getIcon("station", station);
        a.appendChild(img);

        const span = document.createElement("span");
        span.textContent = station;

        a.appendChild(span);
        menu.appendChild(a);
      });
    } catch (e) {
      // skill هایی مثل home / calculations
    }
  }
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

    // اگر cache قبلاً ست شده، دست نزن
    window.MARKET_PRICE_INDEX ||= {};

    items.forEach((item) => {
      if (item.id && item.price != null) {
        window.MARKET_PRICE_INDEX[item.id] = Number(item.price);
      }
    });

    // 💾 cache prices
    localStorage.setItem(
      "MARKET_PRICE_CACHE",
      JSON.stringify({
        time: Date.now(),
        prices: window.MARKET_PRICE_INDEX,
      }),
    );

    // 🔁 sync UI (بدون بلاک)
    window.updatePricesInTable?.();
    window.updateOpenPopupPrice?.();

    console.log(
      "Market prices indexed:",
      Object.keys(window.MARKET_PRICE_INDEX).length,
    );

    document.dispatchEvent(new Event("market-ready"));
  } catch (err) {
    console.error("Failed to load market index", err);
    window.MARKET_PRICE_INDEX = {};
    document.dispatchEvent(new Event("market-ready"));
  }
}
// 🔥 FAST: load cached market prices first (non-blocking)
const cachedPrices = localStorage.getItem("MARKET_PRICE_CACHE");
if (cachedPrices) {
  try {
    const parsed = JSON.parse(cachedPrices);
    window.MARKET_PRICE_INDEX = parsed.prices || {};
    console.log("Market prices loaded from cache");
  } catch {}
}
loadMarketIndex();
if (!document.getElementById("auth-overlay")) {
  injectAuthModal();
}

window.formatValue = function (type, value) {
  if (value === null || value === undefined || value === "-") return "-";

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

    case "time":
      return formatTime(value);

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

  try {
    const promises = skills.map((skill) =>
      getSkillData(skill)
        .then((items) => ({ skill, items }))
        .catch((err) => {
          console.warn("Index failed for skill:", skill);
          return null;
        }),
    );

    const results = await Promise.all(promises);

    // 🔥 پردازش نتایج
    results.forEach((result) => {
      if (!result) return;

      const { skill, items } = result;

      items.forEach((item) => {
        if (!item.id) return;

        // برای popup
        window.ITEM_BY_ID[item.id] ??= [];
        window.ITEM_BY_ID[item.id].push({
          id: item.id,
          recipe_id: item.recipe_id,
          skill: item.skill,
          station: item.station,
          multi_recipe: item.multi_recipe === true,
        });

        // برای سرچ
        window.GLOBAL_ITEM_INDEX.push({
          id: item.id,
          name: item.name,
          skill,
          station: item.station || skill,
          output: item.output || 1,
          ingredients: item.ingredients || [],
          recipeKey: `${item.id}__${item.output || 1}`,
        });
      });
    });

    console.log("ITEM_BY_ID indexed:", Object.keys(window.ITEM_BY_ID).length);
    // 🔥 Build USED_IN_INDEX بعد از ساخت GLOBAL_ITEM_INDEX
    window.USED_IN_INDEX = {};

    window.GLOBAL_ITEM_INDEX.forEach((item) => {
      if (!Array.isArray(item.ingredients)) return;

      item.ingredients.forEach((ing) => {
        window.USED_IN_INDEX[ing.id] ||= [];

        window.USED_IN_INDEX[ing.id].push({
          id: item.id,
          name: item.name,
          qty: ing.qty,
        });
      });
    });

    document.dispatchEvent(new Event("global-index-ready"));
  } catch (err) {
    console.error("Global index build failed:", err);
  }
}

window.openItemPopup = function (itemId, marketItem = null) {
  // 🟩 Craftable
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
      <span>${item.displayName || item.name || item.id}</span>
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
          ${item.description || "This item is a market-only item."}
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
async function getSkillData(skill) {
  if (window.SKILL_DATA[skill]) {
    return window.SKILL_DATA[skill];
  }

  const res = await fetch(`/data/skill/${skill}/${skill}.json`);
  if (!res.ok) return [];

  const items = await res.json();
  window.SKILL_DATA[skill] = items;

  return items;
}
