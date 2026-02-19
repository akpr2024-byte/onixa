import { formatNumber } from "./core/economy.js";
import { getIcon } from "./core/icon-system.js";

let searchTimeout;
let imageObserver;
let searchBound = false;

// ================= SAFE ESCAPE =================
function sanitizeString(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[&<>"']/g, "");
}

// ================= GLOBAL STATE =================
let allData = Object.freeze([]);
let filteredData = [];
let currentPage = 1;
let ITEMS_PER_PAGE = 10;

const TABLE_BODY = "#dataTable tbody";
const PAGINATION_ID = "pagination";
const SEARCH_ID = "searchBox";

// ================= AUTO ITEMS PER PAGE =================
function calcItemsPerPage() {
  const rowHeight = 48;
  const table = document.querySelector("#dataTable");
  if (!table) return;

  const rect = table.getBoundingClientRect();
  const available = Math.max(0, window.innerHeight - rect.top - 20);

  ITEMS_PER_PAGE = Math.max(6, Math.floor(available / rowHeight));
}

// ================= RENDER TABLE =================
function renderTable() {
  const tbody = document.querySelector(TABLE_BODY);
  if (!tbody) return;

  tbody.textContent = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredData.slice(start, start + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.style.textAlign = "center";
    td.style.opacity = ".6";
    td.textContent = "No results found";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < pageItems.length; index++) {
    const item = pageItems[index];

    const tr = document.createElement("tr");

    // ICON
    const tdIcon = document.createElement("td");
    tdIcon.className = "icon-cell";

    const img = document.createElement("img");
    img.dataset.src = item.icon || getIcon("ui", "unknown");
    img.className = "icon";
    img.width = 28;
    img.height = 28;
    img.loading = "lazy";
    img.decoding = "async";

    tdIcon.appendChild(img);

    // NAME
    const tdName = document.createElement("td");
    tdName.className = "item-name";
    tdName.dataset.itemId = sanitizeString(item.id);
    tdName.dataset.marketIndex = start + index;
    tdName.textContent = sanitizeString(
      item.displayName || item.name || item.id,
    );

    // PRICE
    const tdPrice = document.createElement("td");
    tdPrice.textContent = item.price != null ? formatNumber(item.price) : "-";

    // SUPPLY
    const tdSupply = document.createElement("td");
    tdSupply.textContent = sanitizeString(item.supply ?? "-");

    tr.appendChild(tdIcon);
    tr.appendChild(tdName);
    tr.appendChild(tdPrice);
    tr.appendChild(tdSupply);

    fragment.appendChild(tr);
  }

  tbody.appendChild(fragment);

  requestAnimationFrame(hydrateImages);
}

// ================= PAGINATION =================
function renderPagination() {
  const container = document.getElementById(PAGINATION_ID);
  if (!container) return;

  container.textContent = "";

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );

  if (totalPages <= 1) return;

  const addBtn = (label, page, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (active) btn.classList.add("active");
    btn.dataset.page = page;
    container.appendChild(btn);
  };

  addBtn("<<", 1);
  addBtn("<", Math.max(1, currentPage - 1));

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    addBtn(i, i, i === currentPage);
  }

  addBtn(">", Math.min(totalPages, currentPage + 1));
  addBtn(">>", totalPages);
}

// ================= SEARCH =================
function setupSearch() {
  if (searchBound) return;

  const input = document.getElementById(SEARCH_ID);
  if (!input) return;

  searchBound = true;

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const q = input.value.toLowerCase().trim();

      filteredData = q
        ? allData.filter((item) =>
            (item.displayName || item.name || item.id)
              .toLowerCase()
              .includes(q),
          )
        : [...allData];

      currentPage = 1;
      renderTable();
      renderPagination();
    }, 100);
  });
}

// ================= INIT =================
export function initMarketCore(data) {
  if (!Array.isArray(data)) return;

  const safeData = data.filter((item) => item && typeof item.id === "string");

  // ⚡ فقط page اول فوری render شود
  allData = Object.freeze([...safeData]);
  filteredData = allData.slice(0, 100); // فقط 100 اول فوری

  currentPage = 1;

  calcItemsPerPage();
  renderTable();
  renderPagination();
  setupSearch();

  // ⏳ بقیه دیتا در background آماده شود
  if (safeData.length > 100) {
    requestIdleCallback(() => {
      filteredData = [...allData];
      renderPagination();
    });
  }
}

// ================= RESIZE =================
let resizeTimeout;

window.addEventListener(
  "resize",
  () => {
    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
      const prev = ITEMS_PER_PAGE;
      calcItemsPerPage();

      if (prev === ITEMS_PER_PAGE) return;

      const totalPages = Math.max(
        1,
        Math.ceil(filteredData.length / ITEMS_PER_PAGE),
      );

      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      renderTable();
      renderPagination();
    }, 120);
  },
  { passive: true },
);

// ================= IMAGE LAZY LOAD =================
function hydrateImages() {
  if (!imageObserver) {
    imageObserver = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const img = entry.target;
          img.src = img.dataset.src;
          obs.unobserve(img);
        }
      },
      { rootMargin: "200px" },
    );
  }

  const imgs = document.querySelectorAll("#dataTable img[data-src]:not([src])");

  imgs.forEach((img) => imageObserver.observe(img));
}

// ================= PAGINATION CLICK =================
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#pagination button");
  if (!btn) return;

  const page = Number(btn.dataset.page);
  if (!page) return;

  currentPage = page;
  renderTable();
  renderPagination();
});
// ================= ITEM CLICK (POPUP FIX) =================
// ================= ITEM CLICK (CRAFT + MARKET FIX) =================
document.addEventListener("click", (e) => {
  const cell = e.target.closest(".item-name");
  if (!cell) return;

  const itemId = cell.dataset.itemId;
  const marketIndex = Number(cell.dataset.marketIndex);

  if (!itemId || typeof window.openItemPopup !== "function") return;

  // اگر craftable باشد
  if (window.ITEM_BY_ID && window.ITEM_BY_ID[itemId]) {
    window.openItemPopup(itemId);
    return;
  }

  // اگر فقط market باشد
  if (
    Array.isArray(filteredData) &&
    Number.isInteger(marketIndex) &&
    filteredData[marketIndex]
  ) {
    const marketItem = filteredData[marketIndex];
    window.openItemPopup(itemId, marketItem);
  }
});
