export default function plural(m: string) {
  if (!m) return m;
  if (m.endsWith("s")) return m + "es";
  if (/[^aeiou]y$/.test(m)) return m.slice(0, -1) + "ies";
  else return m + "s";
}

export function singular(m: string) {
  if (!m) return m;
  if (m.toLowerCase().endsWith("s")) {
    m = m.slice(0, -1);
    if (m.toLowerCase().endsWith("sse")) return m.slice(0, -1);
    // Notable exceptions - movies, selfies, calories, cookies and aunties should be handled in application code.
    else if (m.toLowerCase().endsWith("ie")) return m.slice(0, -2) + "y";
    return m;
  }
  return m;
}
