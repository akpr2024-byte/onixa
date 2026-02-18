import { getIcon } from "./core/icon-system.js";

let SEARCH_INDEX = [];
let searchTimeout;

function waitForGlobalIndex() {
  if (window.GLOBAL_ITEM_INDEX?.length) {
    SEARCH_INDEX = window.GLOBAL_ITEM_INDEX;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    document.addEventListener(
      "global-index-ready",
      () => {
        SEARCH_INDEX = window.GLOBAL_ITEM_INDEX;
        resolve();
      },
      { once: true },
    );
  });
}

function createSearchBox() {
  const input = document.getElementById("searchBox");
  if (!input) return;

  let resultsBox = document.createElement("div");
  resultsBox.id = "global-search-results";
  resultsBox.className = "search-results";
  document.body.appendChild(resultsBox);

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      resultsBox.innerHTML = "";

      if (q.length < 2) {
        resultsBox.style.display = "none";
        return;
      }

      const results = SEARCH_INDEX.filter((i) =>
        i.name.toLowerCase().includes(q),
      ).slice(0, 20);

      if (!results.length) {
        resultsBox.style.display = "none";
        return;
      }

      resultsBox.style.display = "block";

      const rect = input.getBoundingClientRect();
      resultsBox.style.top = rect.bottom + window.scrollY + "px";
      resultsBox.style.left = rect.left + "px";
      resultsBox.style.width = rect.width + "px";

      const fragment = document.createDocumentFragment();

      results.forEach((item) => {
        const div = document.createElement("div");
        div.className = "search-result-item";

        const outputLabel =
          item.output && item.output > 1 ? ` (x${item.output})` : "";

        div.innerHTML = `
        <img 
          src="${getIcon("item", item.id)}"
          loading="lazy"
          decoding="async"
        >
        <span>${item.name}${outputLabel}</span>
        <small>${item.skill} → ${item.station}</small>
      `;

        div.onclick = () => {
          resultsBox.style.display = "none";
          openItemPopupById(item.id);
        };

        fragment.appendChild(div);
      });

      resultsBox.appendChild(fragment);
    }, 120); // debounce 120ms
  });

  document.addEventListener("click", (e) => {
    if (
      !e.target.closest("#searchBox") &&
      !e.target.closest("#global-search-results")
    ) {
      resultsBox.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForGlobalIndex();
  createSearchBox();
});
