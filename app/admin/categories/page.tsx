"use client";

import { useState, useEffect } from "react";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminCategory,
  CategoryListItem,
  CategoryForm,
} from "../../lib/api/adminCategories";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

interface TreeNode extends CategoryListItem {
  children: TreeNode[];
}

function buildTree(items: CategoryListItem[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });
  const roots: TreeNode[] = [];
  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (!item.parentId) {
      roots.push(node);
    } else {
      const parent = map.get(item.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  roots.forEach((r) => r.children.sort((a, b) => a.displayOrder - b.displayOrder));
  return roots;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    displayOrder: 0,
    parentId: null,
    includeInMenu: true,
    isPublished: true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getAdminCategories();
    if (data) setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = (pid: number | null = null) => {
    setEditingId(null);
    setParentId(pid);
    setForm({
      name: "",
      slug: "",
      description: "",
      displayOrder: 0,
      parentId: pid ?? null,
      includeInMenu: true,
      isPublished: true,
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    const cat = await getAdminCategory(id);
    if (cat) {
      setEditingId(id);
      setParentId(cat.parentId ?? null);
      setForm({
        name: cat.name,
        slug: cat.slug ?? slugify(cat.name),
        description: cat.description ?? "",
        displayOrder: cat.displayOrder ?? 0,
        parentId: cat.parentId ?? null,
        includeInMenu: cat.includeInMenu ?? true,
        isPublished: cat.isPublished ?? true,
      });
      setError("");
      setShowModal(true);
    }
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : slugify(name || ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: CategoryForm = {
        ...form,
        slug: form.slug || slugify(form.name),
      };
      if (editingId) {
        const res = await updateCategory(editingId, payload);
        if (res.success) {
          setShowModal(false);
          fetchCategories();
        } else {
          setError(res.error || "Güncelleme başarısız.");
        }
      } else {
        const res = await createCategory(payload);
        if (res.success) {
          setShowModal(false);
          fetchCategories();
        } else {
          setError(res.error || "Oluşturma başarısız.");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz? Alt kategorisi varsa önce onları silmelisiniz."))
      return;
    const res = await deleteCategory(id);
    if (res.success) {
      fetchCategories();
    } else {
      alert(res.error || "Silme başarısız.");
    }
  };

  const tree = buildTree(categories);

  const renderNode = (node: TreeNode, depth: number) => (
    <div key={node.id} style={{ marginLeft: depth * 24 }}>
      <div
        className="d-flex align-items-center justify-content-between py-2 px-2 mb-1"
        style={{ background: "#f8f9fa", borderRadius: 4 }}
      >
        <div>
          <span className="fw-medium">{node.name}</span>
          {!node.isPublished && <span className="badge bg-secondary ms-2">Yayında değil</span>}
        </div>
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => openCreate(node.id)}
            title="Alt kategori ekle"
          >
            + Alt
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => openEdit(node.id)}>
            Düzenle
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => handleDelete(node.id)}
            disabled={node.children.length > 0}
          >
            Sil
          </button>
        </div>
      </div>
      {node.children.length > 0 && node.children.map((ch) => renderNode(ch, depth + 1))}
    </div>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Kategori Yönetimi</h1>
        <button className="btn btn-primary" onClick={() => openCreate()} style={{ borderRadius: 0 }}>
          + Yeni Kategori
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" />
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            {tree.length === 0 ? (
              <p className="text-muted">Henüz kategori yok. Legacy import ile veya manuel olarak ekleyebilirsiniz.</p>
            ) : (
              tree.map((node) => renderNode(node, 0))
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingId ? "Kategori Düzenle" : "Yeni Kategori"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label">Üst Kategori</label>
                    {editingId || (parentId != null && parentId > 0) ? (
                      <input
                        type="text"
                        className="form-control"
                        value={categories.find((c) => c.id === parentId)?.name ?? ""}
                        readOnly
                        disabled
                      />
                    ) : (
                      <select
                        className="form-select"
                        value={parentId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setParentId(v ? Number(v) : null);
                          setForm((f) => ({ ...f, parentId: v ? Number(v) : null }));
                        }}
                      >
                        <option value="">Yok (ana kategori)</option>
                        {categories
                          .filter((c) => !c.parentId)
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ad *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Slug *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sıra</label>
                    <input
                      type="number"
                      className="form-control"
                      value={form.displayOrder ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="includeInMenu"
                      checked={form.includeInMenu ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, includeInMenu: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="includeInMenu">
                      Menüde göster
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isPublished"
                      checked={form.isPublished ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="isPublished">
                      Yayında
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
