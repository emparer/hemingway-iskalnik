import SearchBox from "@/components/SearchBox";
import IframeResizer from "@/components/IframeResizer";

function pickParam(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

export default async function EmbedSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const canonicalBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <main className="container embed-page-shell">
      <style>{`
        html, body {
          background: transparent !important;
          min-height: auto !important;
        }
      `}</style>
      <IframeResizer />
      <SearchBox
        compact
        submitMode="external"
        externalBaseUrl={canonicalBaseUrl}
        defaultQuery={pickParam(sp.query, "")}
        defaultRegionGroup={pickParam(sp.RegionGroup, "724")}
        defaultStartDate={pickParam(sp.StartDate, "")}
        defaultEndDate={pickParam(sp.EndDate, "")}
        defaultAdultCount={Number(pickParam(sp.AdultCount, "2"))}
        defaultDepartureAirports={pickParam(sp.DepartureAirports, "")}
        type={pickParam(sp.type, "pauschal")}
      />
    </main>
  );
}
