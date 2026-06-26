export function getMinimumServiceCodes(min: string) {
  if (min === "OV") return ["OV", "UF", "HP", "VP", "AI"];
  if (min === "BB") return ["UF", "HP", "VP", "AI"];
  if (min === "HB") return ["HP", "VP", "AI"];
  if (min === "AI") return ["AI"];
  return [];
}
