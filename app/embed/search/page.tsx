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

  function inferMinService(serviceCodes: any): string {
    if (!serviceCodes) return "";
    const arr = Array.isArray(serviceCodes) ? serviceCodes : [serviceCodes];
    if (arr.includes("OV")) return "OV";
    if (arr.includes("BB")) return "BB";
    if (arr.includes("HB")) return "HB";
    if (arr.includes("AI")) return "AI";
    return "";
  }

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
        variant="embed-minimal"
        submitMode="external"
        externalBaseUrl={canonicalBaseUrl}
        defaultQuery={pickParam(sp.query, "")}
        defaultRegionGroup={pickParam(sp.RegionGroup, "")}
        defaultStartDate={pickParam(sp.StartDate, "")}
        defaultEndDate={pickParam(sp.EndDate, "")}
        defaultAdultCount={Number(pickParam(sp.AdultCount, "2"))}
        defaultChildCount={Number(pickParam(sp.ChildCount, "0"))}
        defaultAges={pickParam(sp.Ages, "")}
        defaultDepartureAirports={pickParam(sp.DepartureAirports || sp["DepartureAirports[]"], "")}
        type={pickParam(sp.type, "pauschal")}
        defaultDuration={pickParam(sp.Duration, "")}
        defaultMinService={inferMinService(sp.ServiceCodes || sp["ServiceCodes[]"])}
        defaultMinCategory={pickParam(sp.MinCategory, "")}
        defaultSubType={pickParam(sp.SubType, "")}
      />
    </main>
  );
}
