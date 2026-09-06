// Schedules are stored in Firestore as JSON strings that sometimes contain
// stray commas (",," / leading "[," / trailing ",]"), which makes JSON.parse
// throw. Strip those before parsing, ignoring commas inside string literals.
export function stripExtraCommas(text) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      out += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === ',') {
      // Look back at the last meaningful character we kept.
      let j = out.length - 1;
      while (j >= 0 && /\s/.test(out[j])) j--;
      const prev = j >= 0 ? out[j] : null;
      // Drop a comma that follows nothing, an opening bracket or another comma.
      if (prev === null || prev === '{' || prev === '[' || prev === ',') continue;

      // Look ahead past any further commas: drop a comma that only leads to a
      // closing bracket or the end of the text.
      let k = i + 1;
      while (k < text.length && (/\s/.test(text[k]) || text[k] === ',')) k++;
      const next = k < text.length ? text[k] : null;
      if (next === null || next === '}' || next === ']') continue;
    }

    out += char;
  }

  return out;
}

// Returns the parsed value, or null when the field is missing/empty.
export function parseScheduleJson(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(stripExtraCommas(raw));
    } catch (error) {
      console.error("parseScheduleJson > Unable to parse JSON:", error);
      return null;
    }
  }
}
