const SKILL_CACHE = {};
const SKILL_PROMISES = {};

function waitForItemIndex() {
  if (window.ITEM_BY_ID) return Promise.resolve();

  return new Promise((resolve) => {
    document.addEventListener("global-index-ready", resolve, { once: true });
  });
}

/**
 * Get full item by id (LIVE — no cache)
 */
export async function getItemById(id, options = {}) {
  await waitForItemIndex();

  const metas = window.ITEM_BY_ID?.[id] || [];
  if (!metas.length) return null;

  let meta = null;

  if (options.recipe_id) {
    meta = metas.find((m) => m.recipe_id === options.recipe_id);
  }

  if (!meta && options.station) {
    meta = metas.find((m) => m.station === options.station);
  }

  if (!meta && options.skill) {
    meta = metas.find((m) => m.skill === options.skill);
  }

  if (!meta) {
    meta = metas[0];
  }

  const skill = meta.skill.toLowerCase();
  const path = `/data/skill/${skill}/${skill}.json`;

  // 🔥 FIXED PROMISE CACHE
  if (!SKILL_CACHE[skill]) {
    if (!SKILL_PROMISES[skill]) {
      SKILL_PROMISES[skill] = fetch(path).then(async (res) => {
        if (!res.ok) throw new Error("Skill JSON failed");
        return res.json();
      });
    }

    SKILL_CACHE[skill] = await SKILL_PROMISES[skill];
  }

  const items = SKILL_CACHE[skill];

  const variants = items.filter((i) => {
    if (meta.multi_recipe === true) {
      return i.recipe_id === meta.recipe_id;
    }
    return i.id === id && i.station === meta.station;
  });

  if (!variants.length) return null;

  let selected = null;

  if (options.output != null) {
    selected = variants.find(
      (v) => Number(v.output ?? 1) === Number(options.output),
    );
  }

  if (!selected) {
    selected = variants.find((v) => Number(v.output ?? 1) === 1);
  }

  if (!selected) {
    selected = variants[0];
  }

  const baseItem = structuredClone(selected);

  baseItem.outputVariants = variants.map((v) => ({
    count: Number(v.output ?? 1),
  }));

  baseItem._is_multi = meta.multi_recipe === true;
  baseItem._recipe_id = meta.recipe_id || null;
  baseItem.skill = meta.skill;
  baseItem.station = meta.station;

  return baseItem;
}

/**
 * Get all items of station (LIVE)
 */
export async function getItemsByStation(skill) {
  const s = skill.toLowerCase();

  if (!SKILL_CACHE[s]) {
    const path = `/data/skill/${s}/${s}.json`;
    const res = await fetch(path);
    if (!res.ok) return [];
    SKILL_CACHE[s] = await res.json();
  }

  return SKILL_CACHE[s];
}

/**
 * Optional preload
 */
export async function preloadAllItems(batchSize = 50) {
  if (!window.ITEM_BY_ID) return;

  const ids = Object.keys(window.ITEM_BY_ID);

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);

    await Promise.all(batch.map((id) => getItemById(id)));

    // 🔥 اجازه بده UI نفس بکشه
    await new Promise((r) => setTimeout(r, 0));
  }
}

/**
 * Multi-recipe display helper
 */
export async function getAllRecipesByItemId(itemId) {
  await waitForItemIndex();

  const metas = window.ITEM_BY_ID[itemId];
  if (!Array.isArray(metas) || metas.length <= 1) return metas;

  return metas;
}
