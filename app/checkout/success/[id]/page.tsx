//app/checkout/success/[id]/page.tsx
import Link from "next/link";

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="container">
      <section className="tabs" style={{ marginTop: 30 }}>
        <h2>Povpraševanje je bilo uspešno prejeto</h2>

        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
          Vaše povpraševanje za rezervacijo je bilo uspešno prejeto.
        </p>

        <p className="muted" style={{ marginTop: 12 }}>
          Referenca povpraševanja: <strong>{decodeURIComponent(id)}</strong>
        </p>

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