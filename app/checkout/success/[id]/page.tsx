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
        <h2>Povpraševanje je bilo poslano</h2>

        <p style={{ fontSize: 16, lineHeight: 1.7 }}>
          Vaše povpraševanje je bilo uspešno poslano v ORS.
        </p>

        <p className="muted" style={{ marginTop: 12 }}>
          Referenca: <strong>{decodeURIComponent(id)}</strong>
        </p>

        <p className="muted" style={{ marginTop: 12 }}>
          Agencija mora povpraševanje še pregledati oziroma potrditi.
        </p>

        <Link href="/" className="btn" style={{ marginTop: 20 }}>
          Nazaj na iskanje
        </Link>
      </section>
    </main>
  );
}