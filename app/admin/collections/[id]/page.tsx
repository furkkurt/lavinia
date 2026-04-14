"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CollectionForm } from "@/app/admin/collections/CollectionForm";
import { getApiBase, adminAuthHeaders } from "@/app/lib/apiBase";

type Vm = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  displayOrder: number;
  homepageSlot: number | null;
  productIds: number[];
  thumbnailImageUrl: string | null;
  thumbnailFileName: string | null;
};

export default function EditCollectionPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [vm, setVm] = useState<Vm | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const base = getApiBase();
    fetch(`${base}/api/product-collections/${id}`, { headers: adminAuthHeaders() })
      .then((r) => {
        if (!r.ok) {
          setErr(r.status === 404 ? "Bulunamadı." : "Yüklenemedi (giriş?).");
          return null;
        }
        return r.json();
      })
      .then((d: Vm | null) => setVm(d))
      .catch(() => setErr("Ağ hatası."));
  }, [id]);

  if (err) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>{err}</p>
        <Link href="/admin/collections">← Liste</Link>
      </main>
    );
  }

  if (!vm) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <p>
        <Link href="/admin/collections">← Liste</Link>
      </p>
      <h1 style={{ fontSize: "1.5rem" }}>Koleksiyon düzenle</h1>
      <CollectionForm
        initial={{
          id: vm.id,
          name: vm.name,
          slug: vm.slug,
          description: vm.description ?? "",
          isPublished: vm.isPublished,
          displayOrder: vm.displayOrder,
          homepageSlot: vm.homepageSlot != null ? String(vm.homepageSlot) : "",
          productIdsText: vm.productIds?.join("\n") ?? "",
          thumbnailFileName: (vm.thumbnailFileName ?? "").trim(),
          thumbnailImageUrl: vm.thumbnailImageUrl,
        }}
      />
    </main>
  );
}
