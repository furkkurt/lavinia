import Link from "next/link";
import SvgSprite from "@/app/components/SvgSprite";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getApiBase, mediaUrl } from "@/app/lib/apiBase";

type Row = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  thumbnailUrl: string | null;
  href: string;
};

export default async function KoleksiyonlarPage() {
  const base = getApiBase();
  const res = await fetch(`${base}/api/public/collections`, { cache: "no-store" });
  const rows: Row[] = res.ok ? await res.json() : [];

  return (
    <>
      <SvgSprite />
      <Navbar />
      <main className="container" style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 1.25rem 80px" }}>
      <h1
        className="section-title text-uppercase mb-4"
        style={{ fontFamily: "var(--font-marcellus)", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}
      >
        Koleksiyonlar
      </h1>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "2rem" }}>
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
              {c.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(c.thumbnailUrl)}
                  alt=""
                  style={{ width: "100%", maxWidth: 420, aspectRatio: "4/5", objectFit: "cover" }}
                />
              ) : null}
              <h2
                style={{
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "1rem",
                }}
              >
                {c.title}
              </h2>
              {c.description ? <p style={{ maxWidth: 520, lineHeight: 1.6 }}>{c.description}</p> : null}
              <span
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "underline",
                }}
              >
                Keşfet
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p>Henüz koleksiyon yok.</p> : null}
    </main>
      <Footer />
    </>
  );
}
