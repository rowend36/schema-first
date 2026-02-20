export default function sentenceCase(a: string) {
  return a && a.length ? a.charAt(0).toLocaleUpperCase() + a.slice(1) : a;
}
