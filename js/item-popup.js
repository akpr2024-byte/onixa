// ======================================================
// GLOBAL STATE
// ======================================================
import { calcCraftCost, calcNetProfit } from "./core/economy.js";
import { getItemById, getAllRecipesByItemId } from "./core/item-repository.js";
import { getIcon } from "./core/icon-system.js";

let CURRENT_ITEM = null;
let CURRENT_MODE = "buy";
let ITEM_POPUP_HISTORY = []; // array of { id, output }

// ======================================================
// HELPERS
// ======================================================

async function renderPopup(item) {
  // ---------- TITLE ----------
  const output = Number(item.output || 1);
  const outputLabel = ` (x${output})`;

  const titleIcon = getIcon("item", item.id);

  document.getElementById("popup-title").innerHTML = `
  <div class="popup-title-row">
    <button id="popup-back-btn" class="popup-back-box" title="Back">
      <span class="back-icon">←</span>
      <span class="back-text">Back</span>
    </button>

    <div class="popup-title-text">
      <img src="${titleIcon}" class="popup-title-icon" draggable="false">
      <span class="popup-title-name">${item.name}${outputLabel}</span>
    </div>
  </div>
`;

  const variantWrap = document.getElementById("popup-variant-selectors");
  if (variantWrap) variantWrap.innerHTML = "";
  // ===============================
  // VARIANT CALCULATION (IMPORTANT)
  // ===============================

  // ===============================
  // VARIANT CALCULATION (SAFE)
  // ===============================

  const allVariants = getAllItemVariantsById(item.id) || [];

  const uniqueOutputs = [
    ...new Set(allVariants.map((v) => Number(v.output || 1))),
  ];

  const uniqueSkills = [...new Set(allVariants.map((v) => v.skill))];

  const uniqueStations = [...new Set(allVariants.map((v) => v.station))];

  // پاک کردن selector قبلی اگر وجود دارد
  variantWrap.innerHTML = "";

  // ----------------------------------
  // 1️⃣ Multi Output (Petfood)
  // ----------------------------------
  // 1️⃣ Multi Output
  if (uniqueOutputs.length > 1) {
    const selector = document.createElement("div");
    selector.className = "output-selector";

    uniqueOutputs
      .sort((a, b) => a - b)
      .forEach((out) => {
        const btn = document.createElement("button");
        btn.textContent = `x${out}`;

        if (Number(item.output || 1) === out) {
          btn.classList.add("active");
        }

        btn.onclick = async () => {
          if (CURRENT_ITEM) {
            ITEM_POPUP_HISTORY.push({
              id: CURRENT_ITEM.id,
              output: CURRENT_ITEM.output,
              station: CURRENT_ITEM.station,
            });
          }

          const newItem = await getItemById(item.id, {
            output: out,
            station: item.station,
          });

          if (!newItem) return;

          CURRENT_ITEM = structuredClone(newItem);
          renderPopup(CURRENT_ITEM);
        };

        selector.appendChild(btn);
      });

    variantWrap.appendChild(selector);
  }

  // 2️⃣ Multi Station
  if (uniqueStations.length > 1) {
    const selector = document.createElement("div");
    selector.className = "recipe-selector";

    uniqueStations.forEach((station) => {
      const btn = document.createElement("button");
      btn.textContent = station;

      if (station === item.station) {
        btn.classList.add("active");
      }

      btn.onclick = async () => {
        if (CURRENT_ITEM) {
          ITEM_POPUP_HISTORY.push({
            id: CURRENT_ITEM.id,
            output: CURRENT_ITEM.output,
            station: CURRENT_ITEM.station,
          });
        }

        const newItem = await getItemById(item.id, {
          station: station,
          output: 1,
        });

        if (!newItem) return;

        CURRENT_ITEM = structuredClone(newItem);
        renderPopup(CURRENT_ITEM);
      };

      selector.appendChild(btn);
    });

    variantWrap.appendChild(selector);
  }

  document.getElementById("popup-back-btn").disabled =
    ITEM_POPUP_HISTORY.length === 0;

  // ---------- BASE LAYOUT ----------
  document.getElementById("popup-content").innerHTML = `
  
    <div class="popup-top-grid">
      <div class="popup-top-left"></div>

      <div class="popup-top-middle">
        <div class="popup-tool-label">You get it using this tool</div>
        <div class="popup-tool"></div>
      </div>

      <div class="popup-top-right">
        <div class="popup-market-label">Market price</div>
        <div id="popup-market-price" class="popup-market-price"></div>
      </div>
    </div>


    <div class="popup-item-stats">
      <div><span>Skill</span><b id="p-skill"></b></div>
      <div><span>Level</span><b id="p-level"></b></div>
      <div><span>Tier</span><b id="p-tier"></b></div>
      <div><span>Energy</span><b id="p-energy"></b></div>
      <div><span>XP</span><b id="p-xp"></b></div>
      <div><span>Time</span><b id="p-time"></b></div>
    </div>

    <div class="mode-switch">
      <button data-mode="buy" class="active">Buy from Market</button>
      <button data-mode="craft">Craft in Game</button>
      <button data-mode="hybrid">Smart Hybrid</button>
    </div>

    <div class="popup-tables">
      <div class="popup-table-box">
        <div class="popup-table-title">Used In</div>
        <table class="popup-table" id="used-in-table">
          <thead>
            <tr><th>Item</th><th>Market Price</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <div class="popup-table-box">
        <div class="popup-table-title">Ingredients</div>
        <table class="popup-table" id="ingredients-table">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Market Price</th><th>Total Cost</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  const stagesWrap = document.querySelector(".popup-top-left");
  const sources = normalizeProductionSources(item);

  if (stagesWrap && sources.length > 0) {
    const src = sources[0];

    let landIconsHTML = "";

    const flags = {
      grass: false,
      water: false,
      space: false,
    };

    // 🌱 Farming (Soil)
    if (item.station === "Soil" && Array.isArray(item["planted in"])) {
      item["planted in"].forEach((s) => {
        if (s.grass) flags.grass = true;
        if (s.water) flags.water = true;
        if (s.space) flags.space = true;
      });
    }

    // ⛏ Mining (Mine)
    if (item.station === "Mine") {
      if (item.grass) flags.grass = true;
      if (item.water) flags.water = true;
      if (item.space) flags.space = true;
    }

    // ساخت آیکن‌ها با سیستم مرکزی
    Object.keys(flags).forEach((key) => {
      if (flags[key]) {
        landIconsHTML += `
      <img src="${getIcon("land", key)}" 
           class="land-type-icon"
           draggable="false">
    `;
      }
    });

    stagesWrap.innerHTML = `
    <div class="stage-type-label">
  ${src.method.toUpperCase()}
  <span class="land-icons">${landIconsHTML}</span>
</div>



    <div class="stage-icons-row">
      ${src.stages
        .map(
          (s) => `
        <div class="stage-icon-wrap">
          <img src="${
            s.icon?.startsWith("http")
              ? s.icon
              : getIcon("stage", s.icon || s.stage)
          }">
          <span>${s.name || s.stage || ""}</span>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
  }

  // ======================================================
  // MIDDLE : TOOL
  // ======================================================

  // ======================================================
  // MIDDLE : TOOL
  // ======================================================

  const toolWrap = document.querySelector(".popup-tool");
  const tools = item["You get it using this tool"];

  if (toolWrap) {
    if (Array.isArray(tools) && tools.length > 0) {
      toolWrap.innerHTML = tools
        .map((t) => {
          const toolId = t.id || t.name;
          const toolIcon = toolId ? getIcon("tool", toolId) : "";

          return `
          <div class="popup-tool-item">
            ${toolIcon ? `<img src="${toolIcon}" draggable="false">` : ""}
            <span>${t.name || "-"}</span>
          </div>
        `;
        })
        .join("");
    } else {
      toolWrap.innerHTML = `<span style="opacity:.5">-</span>`;
    }
  }

  const backBtn = document.getElementById("popup-back-btn");
  backBtn.onclick = popupGoBack;
  backBtn.disabled = ITEM_POPUP_HISTORY.length === 0;

  fillIngredientsTable(item);
  fillUsedInTable(item);
  renderIngredientSummary(item);

  document.getElementById("p-skill").textContent = item.skill || "-";
  document.getElementById("p-level").textContent = item.level ?? "-";
  document.getElementById("p-tier").textContent = item.tier ?? "-";
  document.getElementById("p-energy").innerHTML = formatValue(
    "energy",
    item.energy,
  );
  document.getElementById("p-xp").innerHTML = formatValue("xp", item.xp);
  document.getElementById("p-time").innerHTML = formatValue("time", item.time);

  const marketPrice =
    window.MARKET_PRICE_INDEX?.[item.id] ??
    window.MARKET_PRICE_INDEX?.[item.market_id] ??
    null;

  document.getElementById("popup-market-price").innerHTML =
    marketPrice != null ? formatValue("coin", marketPrice) : "-";

  bindPopupControls();
  recalcPopup();

  document.getElementById("popup-overlay").classList.remove("hidden");
}

function getMarketPriceById(id) {
  const price = window.MARKET_PRICE_INDEX?.[id];
  return price != null ? price : null;
}

function normalizeProductionSources(item) {
  const result = [];

  if (Array.isArray(item.drops_from)) {
    result.push({
      method: "drops from",
      stages: item.drops_from,
    });
  }

  if (Array.isArray(item.craft_in)) {
    result.push({
      method: "craft in",
      stages: item.craft_in,
    });
  }

  if (Array.isArray(item["planted in"])) {
    result.push({
      method: "planted in",
      stages: item["planted in"],
    });
  }

  return result;
}

// ======================================================
// OPEN POPUP (ONLY ENTRY POINT)
// ======================================================

window.openItemPopupById = async function (itemId) {
  // 🔥 اگر popup باز است و آیتم فعلی داریم → push به history
  const overlay = document.getElementById("popup-overlay");
  const popupOpen = overlay && !overlay.classList.contains("hidden");

  if (popupOpen && CURRENT_ITEM) {
    ITEM_POPUP_HISTORY.push({
      id: CURRENT_ITEM.id,
      output: CURRENT_ITEM.output,
      station: CURRENT_ITEM.station,
    });
  }

  // 🔥 فوراً skeleton نشان بده
  overlay.classList.remove("hidden");

  document.getElementById("popup-title").innerHTML = `
    <div class="popup-loading">Loading...</div>
  `;

  document.getElementById("popup-content").innerHTML = `
    <div class="popup-loading-body">
      Loading item data...
    </div>
  `;

  const rawItem = await getItemById(itemId);
  if (!rawItem) return;

  const item = structuredClone(rawItem);
  item._baseOutput = rawItem.output || 1;

  CURRENT_ITEM = item;

  await renderPopup(item);
};

function bindPopupControls() {
  document.querySelectorAll(".mode-switch button").forEach((btn) => {
    btn.onclick = () => {
      CURRENT_MODE = btn.dataset.mode;
      document
        .querySelectorAll(".mode-switch button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      recalcPopup();
    };
  });

  const toggle = document.getElementById("auto-resource-toggle");
  if (toggle) {
    toggle.onchange = (e) => {
      AUTO_RESOURCE = e.target.checked;
      recalcPopup();
    };
  }
}

window.addEventListener("keydown", (e) => {
  const overlay = document.getElementById("popup-overlay");
  const popupOpen = overlay && !overlay.classList.contains("hidden");

  if (!popupOpen) return;

  const active = document.activeElement;
  const isTyping =
    active &&
    (active.tagName === "INPUT" ||
      active.tagName === "TEXTAREA" ||
      active.isContentEditable);

  if (isTyping) return;

  if (e.key === "Escape") {
    e.preventDefault();
    closePopup();
    return;
  }

  if (e.key === "Backspace") {
    e.preventDefault();

    if (ITEM_POPUP_HISTORY.length > 0) {
      popupGoBack();
    } else {
      closePopup();
    }
  }
});

document.addEventListener("click", (e) => {
  if (!CURRENT_ITEM) return;

  const overlay = document.getElementById("popup-overlay");
  if (!overlay || overlay.classList.contains("hidden")) return;

  // فقط وقتی روی خود overlay کلیک شد ببند
  if (e.target === overlay) {
    closePopup();
  }
});

window.closePopup = function () {
  document.getElementById("popup-overlay").classList.add("hidden");
  CURRENT_ITEM = null;
  ITEM_POPUP_HISTORY = [];
};
function getAllItemVariantsById(id) {
  return window.GLOBAL_ITEM_INDEX?.filter((i) => i.id === id) || [];
}
function fillIngredientsTable(item) {
  const tbody = document.querySelector("#ingredients-table tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(item.ingredients) || item.ingredients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="opacity:.5;text-align:center">
          No ingredients
        </td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  const itemOutput = Number(item.output || 1);
  const baseOutput = Number(item._baseOutput || itemOutput);

  item.ingredients.forEach((ing) => {
    const tr = document.createElement("tr");

    const price = getMarketPriceById(ing.id);

    let scaledQty = ing.qty;
    if (baseOutput && itemOutput !== baseOutput) {
      const scale = itemOutput / baseOutput;
      scaledQty = Math.ceil(ing.qty * scale);
    }

    const totalCost = price != null ? price * scaledQty : null;

    tr.innerHTML = `
      <td class="item-cell clickable"
          onclick="openItemPopupById('${ing.id}')">
        <img src="${getIcon("item", ing.id)}" loading="lazy" decoding="async">
        <span>${ing.name}</span>
      </td>

      <td class="qty-cell">x ${scaledQty}</td>

      <td>
        ${
          price != null
            ? `<span class="price-cell">${formatValue("coin", price)}</span>`
            : `<span style="opacity:.4">-</span>`
        }
      </td>

      <td>
        ${
          totalCost != null
            ? `<span class="price-cell">${formatValue("coin", totalCost)}</span>`
            : `<span style="opacity:.4">-</span>`
        }
      </td>
    `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

function fillUsedInTable(item) {
  const tbody = document.querySelector("#used-in-table tbody");
  tbody.innerHTML = "";

  const usedInRaw = item["used in"];

  if (!Array.isArray(usedInRaw) || usedInRaw.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" style="opacity:.5;text-align:center">
          This item is not used as an ingredient
        </td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  const uniqueIds = [...new Set(usedInRaw.map((u) => u.id))];

  uniqueIds.forEach((id) => {
    const tr = document.createElement("tr");

    const baseVariant = getAllItemVariantsById(id)?.find(
      (v) => Number(v.output || 1) === 1,
    );

    const displayName = baseVariant?.name || id;
    const displayIcon = getIcon("item", id);
    const price = getMarketPriceById(id);

    tr.innerHTML = `
      <td class="item-cell clickable"
          onclick="openItemPopupById('${id}')">
        <img src="${displayIcon}" loading="lazy" decoding="async">
        <span>${displayName}</span>
      </td>

      <td>
        ${
          price != null
            ? `<span class="price-cell">${formatValue("coin", price)}</span>`
            : `<span style="opacity:.4">-</span>`
        }
      </td>
    `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

function renderIngredientSummary(item) {
  const container = document.querySelector("#ingredients-table").parentElement;
  const old = container.querySelector(".ingredient-summary");
  if (old) old.remove();

  let craft = { ingredientsCost: 0, energyCost: 0, total: 0 };
  let netProfit = 0;
  // ======================================================
  // Normalize ingredients qty for current output (IMPORTANT)
  // ======================================================
  const normalizedItem = structuredClone(item);

  const itemOutput = Number(item.output || 1);
  const baseOutput = Number(item._baseOutput || itemOutput);

  if (Array.isArray(normalizedItem.ingredients)) {
    normalizedItem.ingredients = normalizedItem.ingredients.map((ing) => {
      let qty = ing.qty;

      if (baseOutput && itemOutput !== baseOutput) {
        const scale = itemOutput / baseOutput;
        qty = Math.ceil(ing.qty * scale);
      }

      return {
        ...ing,
        qty,
      };
    });
  }

  if (CURRENT_MODE === "buy") {
    const result = calcNetProfit(normalizedItem, window.MARKET_PRICE_INDEX);
    craft = result.craft;
    netProfit = result.netProfit ?? 0;
  }

  // craft / hybrid فعلاً صفر می‌مونن

  const output = Number(CURRENT_ITEM.output || 1);
  const netProfitPerUnit = output > 0 ? Math.round(netProfit / output) : 0;

  // cache for whole app
  const key = `${CURRENT_ITEM.id}__${CURRENT_ITEM.output || 1}`;
  window.ITEM_CRAFT_COSTS ??= {};
  window.ITEM_CRAFT_COSTS[key] = craft.total;

  window.ITEM_NET_PROFITS ??= {};
  window.ITEM_NET_PROFITS[key] = netProfit;

  const profitClass =
    netProfit > 0 ? "profit-good" : netProfit < 0 ? "profit-bad" : "";

  const div = document.createElement("div");
  div.className = "ingredient-summary";

  div.innerHTML = `
    <div class="summary-row">
      <span>Total Ingredients Cost</span>
      <span>${formatValue("coin", craft.ingredientsCost)}</span>
    </div>

    <div class="summary-row">
      <span>Energy Cost</span>
      <span>${formatValue("coin", craft.energyCost)}</span>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-row total">
      <span>Total Craft Cost</span>
      <span>
  ${craft.total != null ? formatValue("coin", craft.total) : "-"}
</span>

    </div>

   <div class="summary-row net-profit ${profitClass}">
  <span>Net Profit</span>
 <span>${netProfit > 0 ? "+" : netProfit < 0 ? "-" : ""}${formatValue(
   "coin",
   Math.abs(netProfit),
 )}</span>
</div>

${
  output > 1 && netProfitPerUnit != null
    ? `
<div class="summary-row net-profit ${profitClass}" style="font-size:13px;opacity:.85">
  <span>Net Profit (x1)</span>
  <span>${netProfitPerUnit > 0 ? "+" : ""}${formatValue(
    "coin",
    Math.abs(netProfitPerUnit),
  )}</span>
</div>
`
    : ""
}


  `;

  container.appendChild(div);
}
async function popupGoBack() {
  if (ITEM_POPUP_HISTORY.length === 0) return;

  const { id, output, station } = ITEM_POPUP_HISTORY.pop();

  const rawItem = await getItemById(id, {
    output,
    station,
  });

  if (!rawItem) return;
  const item = structuredClone(rawItem);

  if (!item) return;

  CURRENT_ITEM = item;
  renderPopup(item);
}

function recalcPopup() {
  if (!CURRENT_ITEM) return;

  // فعلاً فقط summary رو دوباره رندر می‌کنیم
  renderIngredientSummary(CURRENT_ITEM);
}
