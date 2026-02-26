"use client";

import { useEffect, useState } from "react";
import { getUsersGrid, deleteUser, updateUser, User } from "../../lib/api/users";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [pageIndex]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsersGrid({
        pageIndex,
        pageSize,
        sort: [{ field: "id", dir: "desc" }],
      });

      if (response) {
        setUsers(response.data);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      return;
    }

    const success = await deleteUser(id);
    if (success) {
      fetchUsers();
    } else {
      alert("Kullanıcı silinirken bir hata oluştu.");
    }
  };

  const handleToggleBan = async (user: User) => {
    // Note: UserForm doesn't have isActive field in the API
    // You may need to use a different endpoint or field to ban/unban users
    // For now, we'll just show a message
    alert("Kullanıcı banlama özelliği API'de mevcut değil. Lütfen backend'de ilgili endpoint'i kontrol edin.");
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && users.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Kullanıcı Yönetimi</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Telefon</th>
                  <th>Durum</th>
                  <th>Kayıt Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber || "-"}</td>
                    <td>
                      <span
                        className={`badge ${
                          !user.isLockedOut ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {!user.isLockedOut ? "Aktif" : "Kilitli"}
                      </span>
                      {user.roles && user.roles.length > 0 && (
                        <div className="mt-1">
                          <small className="text-muted">
                            {user.roles.join(", ")}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      {user.createdOn
                        ? new Date(user.createdOn).toLocaleDateString("tr-TR")
                        : "-"}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`btn btn-sm ${
                            !user.isLockedOut
                              ? "btn-outline-danger"
                              : "btn-outline-success"
                          }`}
                        >
                          {!user.isLockedOut ? "Kilitle" : "Kilidi Aç"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-outline-danger"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${pageIndex === 0 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPageIndex(pageIndex - 1)}
                    disabled={pageIndex === 0}
                  >
                    Önceki
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i}
                    className={`page-item ${pageIndex === i ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPageIndex(i)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${
                    pageIndex >= totalPages - 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setPageIndex(pageIndex + 1)}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Sonraki
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
