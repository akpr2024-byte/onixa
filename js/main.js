import "./loader.js";

import "./item-popup.js";
import "./global-search.js";
import "./station-page.js";

if (document.body.classList.contains("market-a")) {
  import("./market.js");
}

if (document.body.classList.contains("market-b")) {
  import("./ugc-market.js");
}
