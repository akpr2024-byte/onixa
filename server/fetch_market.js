import fs from "fs";

const URL =
  "https://script.google.com/macros/s/AKfycbzd2w-4NT25579FVIzYZzBTIEtur5lNJMjWlSTtgTT5To0eTYO2Id-e06vsEmFBAjO2eA/exec";

async function fetchMarket() {
  const res = await fetch(URL);
  const data = await res.json();

  fs.writeFileSync("../data/market.json", JSON.stringify(data, null, 2));
  console.log("Market JSON updated");
}

fetchMarket();
