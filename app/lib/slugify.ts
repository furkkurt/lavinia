/**
 * Ürün adından URL uyumlu slug (SimplCommerce `StringHelper.ToUrlFriendly` ile uyumlu alt küme).
 * Sunucu yine `ToSafeSlug` ile benzersizliği garanti eder.
 */
export function slugifyProductName(raw: string): string {
  let s = raw.trim();
  if (!s) return "";

  s = s.toLocaleLowerCase("tr-TR");
  s = s.normalize("NFD").replace(/\p{M}+/gu, "");

  s = s
    .replace(/ı/g, "i")
    .replace(/ß/g, "ss")
    .replace(/ø/g, "o")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l")
    .replace(/þ/g, "th");

  s = s.replace(/\s+/g, "-").replace(/_/g, "-");
  s = s.replace(/[^a-z0-9-]+/g, "-");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (s.length > 200) {
    s = s.slice(0, 200).replace(/-+$/g, "");
  }

  if (!s) {
    return `urun-${Date.now().toString(36)}`;
  }

  return s;
}
