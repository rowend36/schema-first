import sentenceCase from "./sentence_case";

export default function capitalize(e: string) {
  return e.split(" ").map(sentenceCase).join(" ");
}
