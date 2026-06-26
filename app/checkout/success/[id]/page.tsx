//app/checkout/success/[id]/page.tsx
import Link from "next/link";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const bookingCode = typeof sp.bookingCode === "string" ? sp.bookingCode : "";
  const requestId = typeof sp.requestId === "string" ? sp.requestId : "";
  const reference = decodeURIComponent(id);

  return (
    <main className="container">
      <section className="tabs" style={{ marginTop: 30 }}>
        <h2>Povpraševanje je bilo uspešno prejeto</h2>

        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
          Vaše povpraševanje za rezervacijo je bilo uspešno prejeto.
        </p>

        <p className="muted" style={{ marginTop: 12 }}>
          Referenca povpraševanja: <strong>{bookingCode || reference}</strong>
        </p>

        {requestId && requestId !== bookingCode && (
          <p className="muted" style={{ marginTop: 12 }}>
            Request ID: <strong>{requestId}</strong>
          </p>
        )}

        <p className="muted" style={{ marginTop: 12 }}>
          Naši svetovalci bodo preverili razpoložljivost in vas kontaktirali v najkrajšem možnem času za potrditev rezervacije.
        </p>

        <Link href="/" className="btn" style={{ marginTop: 20 }}>
          Nazaj na iskanje
        </Link>
      </section>
    </main>
  );
}
