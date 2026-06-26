// lib/ors-server.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ORS_API_BASE, ORS_API_KEY, orsPost } from "./ors";
import { shouldFallbackToAnyQuickSearch } from "./quicksearch-results";

const execFileAsync = promisify(execFile);

export async function quickSearch(query: string, type = "any") {
  async function fetchQuickSearch(searchType: string) {
    const data = await orsPost(`/search/${searchType}/quicksearch`, { Query: query });

    if (data?.Results) {
      return data;
    }

    const { stdout } = await execFileAsync("curl", [
      "-s",
      "-X",
      "POST",
      `${ORS_API_BASE}/search/${searchType}/quicksearch`,
      "-H",
      `X-Api-Key: ${ORS_API_KEY}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({ Query: query }),
    ]);

    return JSON.parse(stdout);
  }

  try {
    const data = await fetchQuickSearch(type);
    if (shouldFallbackToAnyQuickSearch(type, data)) {
      return await fetchQuickSearch("any");
    }

    return data;
  } catch (e: any) {
    return { Results: {}, usingMock: true, error: e.message || String(e) };
  }
}
