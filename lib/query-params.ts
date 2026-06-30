export function sanitizeSearchParams(params: URLSearchParams) {
  if (params.get("ChildCount") === "0") {
    params.delete("ChildCount");
    params.delete("Ages");
  }

  if (params.get("Page") === "0") {
    params.delete("Page");
  }

  return params;
}
