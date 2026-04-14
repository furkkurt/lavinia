import Link from "next/link";
import SvgSprite from "@/app/components/SvgSprite";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getApiBase, mediaUrl } from "@/app/lib/apiBase";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number | null;
  specialPrice?: number | null;
  specialPriceStart?: string | null;
  specialPriceEnd?: string | null;
  /** API JSON (camelCase) */
  thumbnailImageUrl: string | null;
};

function CollectionProductPrice({ p }: { p: Product }) {
  const now = new Date();
  const sp = p.specialPrice;
  const active =
    sp != null &&
    sp > 0 &&
    sp < p.price &&
    (!p.specialPriceStart || new Date(p.specialPriceStart) <= now) &&
    (!p.specialPriceEnd || new Date(p.specialPriceEnd) >= now);
  if (active) {
    return (
      <p style={{ fontSize: "0.85rem", margin: 0 }}>
        <del className="text-muted me-1">₺{p.price.toFixed(2)}</del>
        <span className="text-danger fw-bold">₺{sp!.toFixed(2)}</span>
      </p>
    );
  }
  return (
    <p style={{ fontSize: "0.85rem", margin: 0 }}>
      {p.price ? `₺${p.price.toFixed(2)}` : "Fiyat belirtilmemiş"}
    </p>
  );
}

type Detail = {
  collection: {
    id: number;
    title: string;
    description: string | null;
    slug: string;
    thumbnailUrl: string | null;
  };
  products: Product[];
};

export default async function KoleksiyonDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = getApiBase();
  const res = await fetch(`${base}/api/public/collections/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return (
      <>
        <SvgSprite />
        <Navbar />
        <main className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
          <p>Koleksiyon bulunamadı.</p>
          <Link href="/koleksiyonlar">← Koleksiyonlar</Link>
        </main>
        <Footer />
      </>
    );
  }
  const data: Detail = await res.json();
  const { collection, products } = data;

  return (
    <>
      <SvgSprite />
      <Navbar />
      <main className="container" style={{ maxWidth: 1100, margin: "0 auto", padding: "120px 1.25rem 80px" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <Link href="/koleksiyonlar">← Tüm koleksiyonlar</Link>
      </p>
      {collection.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(collection.thumbnailUrl)}
          alt=""
          style={{ width: "100%", maxWidth: 480, aspectRatio: "4/5", objectFit: "cover" }}
        />
      ) : null}
      <h1 style={{ fontSize: "2rem", fontWeight: 400 }}>{collection.title}</h1>
      {collection.description ? (
        <p style={{ maxWidth: 560, lineHeight: 1.65, color: "#333" }}>{collection.description}</p>
      ) : null}

      <h2
        style={{
          fontSize: "1rem",
          marginTop: "2.5rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Ürünler
      </h2>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "1rem 0 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/urunler/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              {p.thumbnailImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(p.thumbnailImageUrl)}
                  alt=""
                  style={{ width: "100%", aspectRatio: "9/16", objectFit: "cover", background: "#eee" }}
                />
              ) : (
                <div style={{ width: "100%", aspectRatio: "9/16", background: "#eee" }} />
              )}
              <p
                className="element-title text-uppercase mt-3 mb-1"
                style={{ fontSize: "0.85rem", letterSpacing: "0.04em", lineHeight: 1.35 }}
              >
                {p.name}
              </p>
              <CollectionProductPrice p={p} />
            </Link>
          </li>
        ))}
      </ul>
      {products.length === 0 ? <p>Bu koleksiyonda ürün yok.</p> : null}
    </main>
      <Footer />
    </>
  );
}
