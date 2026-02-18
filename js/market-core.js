import { formatNumber } from "./core/economy.js";
import { getIcon } from "./core/icon-system.js";

let searchTimeout;

// ================= GLOBAL STATE =================
let allData = [];
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

  tbody.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredData.slice(start, start + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;opacity:.6">
          No results found
        </td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  pageItems.forEach((item, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="icon-cell">
        <img
          src="${item.icon || getIcon("ui", "unknown")}"
          class="icon"
          loading="lazy"
          decoding="async"/>
      </td>

      <td class="item-name"
          data-item-id="${item.id}"
          data-market-index="${start + index}">
        ${item.displayName || item.name || item.id}
      </td>

      <td>${item.price != null ? formatNumber(item.price) : "-"}</td>
      <td>${item.supply ?? "-"}</td>
    `;

    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);

  tbody.onclick = (e) => {
    const el = e.target.closest(".item-name");
    if (!el) return;

    const id = el.dataset.itemId;
    const index = Number(el.dataset.marketIndex);
    const marketItem = filteredData[index];

    if (window.ITEM_BY_ID?.[id]) {
      openItemPopupById(id, { output: 1 });
    } else {
      openMarketOnlyPopup(marketItem);
    }
  };
}

// ================= PAGINATION =================
function renderPagination() {
  const container = document.getElementById(PAGINATION_ID);
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / ITEMS_PER_PAGE),
  );

  if (totalPages <= 1) return;

  const addBtn = (label, page, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (active) btn.classList.add("active");

    btn.onclick = () => {
      currentPage = page;
      renderTable();
      renderPagination();
    };

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
  const input = document.getElementById(SEARCH_ID);
  if (!input) return;

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
    }, 120);
  });
}

// ================= INIT =================
export function initMarketCore(data) {
  if (!Array.isArray(data)) return;

  allData = data;
  filteredData = [...data];
  currentPage = 1;

  calcItemsPerPage();
  renderTable();
  renderPagination();
  setupSearch();
}

// ================= RESIZE =================
let resizeTimeout;

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    calcItemsPerPage();

    const totalPages = Math.max(
      1,
      Math.ceil(filteredData.length / ITEMS_PER_PAGE),
    );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderTable();
    renderPagination();
  }, 100);
});
