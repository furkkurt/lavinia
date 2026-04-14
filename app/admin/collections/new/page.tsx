import Link from "next/link";
import { CollectionForm } from "@/app/admin/collections/CollectionForm";

export default function NewCollectionPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <p>
        <Link href="/admin/collections">← Liste</Link>
      </p>
      <h1 style={{ fontSize: "1.5rem" }}>Yeni koleksiyon</h1>
      <CollectionForm
        initial={{
          name: "",
          slug: "",
          description: "",
          isPublished: true,
          displayOrder: 0,
          homepageSlot: "",
          productIdsText: "",
          thumbnailFileName: "",
          thumbnailImageUrl: null,
        }}
      />
    </main>
  );
}
