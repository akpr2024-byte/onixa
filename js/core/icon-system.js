const BASE = "/assets/images";
const UNKNOWN = `${BASE}/ui/unknown.png`;

export function getIcon(type, id) {
  if (!id) return UNKNOWN;

  const safeId = String(id).trim().toLowerCase();

  let folder;

  switch (type) {
    case "item":
      folder = "items";
      break;
    case "skill":
      folder = "skill";
      break;
    case "stage":
      folder = "stage";
      break;
    case "station":
      folder = "station";
      break;
    case "tool":
      folder = "tools";
      break;
    case "ui":
      folder = "ui";
      break;
    case "land":
      folder = "lands";
      break;
    case "social":
      folder = "social";
      break;
    case "logo":
      folder = "logo";
      break;
    default:
      return UNKNOWN;
  }

  return `${BASE}/${folder}/${safeId}.png`;
}
