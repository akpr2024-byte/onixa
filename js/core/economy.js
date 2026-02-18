export const ENERGY_PRICE = 50;

export function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
export function formatValue(type, value) {
  if (value == null) return "-";

  const num = formatNumber(value);

  if (type === "coin") {
    return `<span class="price-cell">${num}${uiIcon("coin")}</span>`;
  }

  if (type === "energy") {
    return `<span class="price-cell">${num}${uiIcon("energy")}</span>`;
  }

  if (type === "xp") {
    return `+ ${num}`;
  }

  if (type === "time") {
    return value;
  }

  return num;
}

export function calcIngredientsCost(item, market) {
  if (!item || !Array.isArray(item.ingredients)) return 0;

  let total = 0;

  for (const ing of item.ingredients) {
    if (!ing || !ing.id || !ing.qty) continue;

    if (!market || market[ing.id] == null) {
      return null; // 🔥 قیمت ناقص
    }

    const price = Number(market[ing.id]);
    total += price * ing.qty;
  }

  return total;
}

export function calcEnergyCost(item) {
  if (!item || typeof item.energy !== "number") return 0;
  return item.energy * ENERGY_PRICE;
}

export function calcCraftCost(item, market) {
  if (!item || !Array.isArray(item.ingredients)) {
    return {
      ingredientsCost: 0,
      energyCost: 0,
      total: 0,
    };
  }

  const ingredientsCost = calcIngredientsCost(item, market);

  if (ingredientsCost == null) {
    return {
      ingredientsCost: null,
      energyCost: null,
      total: null,
    };
  }

  const energyCost = calcEnergyCost(item);

  return {
    ingredientsCost,
    energyCost,
    total: ingredientsCost + energyCost,
  };
}

export function calcMarketValue(item, market) {
  if (!item || !item.id) return null;

  if (!market || market[item.id] == null) return null;

  const pricePerUnit = Number(market[item.id]);
  const output = Number(item.output || 1);

  return pricePerUnit * output;
}

export function calcNetProfit(item, market) {
  if (!item || !item.id) {
    return {
      craft: { total: 0 },
      netProfit: null,
    };
  }

  const craft = calcCraftCost(item, market);
  const marketValue = calcMarketValue(item, market);

  return {
    craft,
    netProfit:
      marketValue != null && craft.total != null
        ? marketValue - craft.total
        : null,
  };
}
