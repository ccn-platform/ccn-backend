 function normalizeName(name) {
  if (!name || typeof name !== "string") return [];

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .split(" ");
}

function wordSimilar(a, b) {
  if (a === b) return true;

  if (Math.abs(a.length - b.length) > 1) return false;

  let diff = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) diff++;
    if (diff > 1) return false;
  }

  return true;
}

function similarity(a, b) {
  const partsA = normalizeName(a);
  const partsB = normalizeName(b);

  const used = new Set();
  let matches = 0;

  for (const nameA of partsA) {
    for (let i = 0; i < partsB.length; i++) {
      if (!used.has(i) && wordSimilar(nameA, partsB[i])) {
        used.add(i);
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(partsA.length, partsB.length);
}

function isNameTooSimilar(name1, name2) {
  return similarity(name1, name2) >= 0.8;
}

module.exports = isNameTooSimilar;
