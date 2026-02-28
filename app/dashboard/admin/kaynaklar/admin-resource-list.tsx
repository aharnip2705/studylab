"use client";

import { useState } from "react";
import { updateResource, deleteResource, deleteResources } from "@/lib/actions/admin-resources";

type Subject = { id: string; name: string };

type Resource = {
  id: string;
  name: string;
  resource_type: string;
  icon_url?: string | null;
  publisher_id?: string | null;
  subject_id?: string | null;
  publishers?: { id: string; name: string } | { id: string; name: string }[] | null;
  subjects?: Subject | Subject[] | null;
};

type Publisher = { id: string; name: string };

export function AdminResourceList({
  resources,
  publishers,
  subjects = [],
}: {
  resources: Resource[];
  publishers: Publisher[];
  subjects?: Subject[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"soru_bankasi" | "video_ders_kitabi" | "deneme_sinavi" | "diger">("soru_bankasi");
  const [editPublisherId, setEditPublisherId] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allSelected = resources.length > 0 && selectedIds.size === resources.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(resources.map((r) => r.id)));
  }

  async function handleBulkDelete() {
    if (!someSelected || !confirm(`${selectedIds.size} kaynağı silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    setError(null);
    const res = await deleteResources(Array.from(selectedIds));
    setLoading(false);
    if (res.error) setError(res.error);
    else setSelectedIds(new Set());
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    const res = await deleteResource(id);
    setLoading(false);
    if (res.error) setError(res.error);
  }

  function startEdit(r: Resource) {
    setEditingId(r.id);
    setEditName(r.name);
    const rt = r.resource_type as "soru_bankasi" | "video_ders_kitabi" | "deneme_sinavi" | "diger";
    setEditType(rt && ["soru_bankasi", "video_ders_kitabi", "deneme_sinavi", "diger"].includes(rt) ? rt : "soru_bankasi");
    setEditPublisherId(r.publisher_id ?? "");
    setEditSubjectId(r.subject_id ?? "");
    setEditIconUrl(r.icon_url ?? "");
  }

  async function handleSave(id: string) {
    setLoading(true);
    setError(null);
    const iconVal = editIconUrl.trim();
    const icon_url =
      iconVal && (iconVal.startsWith("http://") || iconVal.startsWith("https://")) ? iconVal : null;
    const res = await updateResource(id, {
      name: editName.trim(),
      resource_type: editType,
      publisher_id: editPublisherId || null,
      subject_id: editSubjectId || null,
      icon_url,
    });
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setEditingId(null);
    }
  }

  if (resources.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
        Henüz kaynak yok.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      {someSelected && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {selectedIds.size} kaynak seçildi
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Seçilenleri Sil
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-amber-700 underline dark:text-amber-300"
          >
            Seçimi kaldır
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="w-10 p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
              <th className="p-3 font-medium">Görsel</th>
              <th className="p-3 font-medium">Yayın evi</th>
              <th className="p-3 font-medium">Kaynak Adı</th>
              <th className="p-3 font-medium">Ders</th>
              <th className="p-3 font-medium">Tip</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="w-10 p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </td>
                <td className="p-3">
                  {r.icon_url ? (
                    <img src={r.icon_url} alt="" className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  {editingId === r.id ? (
                    <select
                      value={editPublisherId}
                      onChange={(e) => setEditPublisherId(e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">—</option>
                      {publishers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (Array.isArray(r.publishers) ? r.publishers[0]?.name : r.publishers?.name) ?? "—"
                  )}
                </td>
                <td className="p-3 font-medium">
                  {editingId === r.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Kaynak adı"
                      className="w-full min-w-[200px] rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    r.name
                  )}
                </td>
                <td className="p-3">
                  {editingId === r.id ? (
                    <select
                      value={editSubjectId}
                      onChange={(e) => setEditSubjectId(e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">—</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      {(Array.isArray(r.subjects) ? r.subjects[0]?.name : (r.subjects as Subject)?.name) ?? "—"}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {editingId === r.id ? (
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as typeof editType)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="soru_bankasi">Soru Bankası</option>
                      <option value="video_ders_kitabi">Video Ders Kitabı</option>
                      <option value="deneme_sinavi">Deneme Sınavı</option>
                      <option value="diger">Diğer</option>
                    </select>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400">
                      {r.resource_type === "deneme_sinavi"
                        ? "Deneme Sınavı"
                        : r.resource_type === "video_ders_kitabi"
                          ? "Video Ders Kitabı"
                          : r.resource_type === "diger"
                            ? "Diğer"
                            : "Soru Bankası"}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {editingId === r.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="url"
                        value={editIconUrl}
                        onChange={(e) => setEditIconUrl(e.target.value)}
                        placeholder="Görsel URL (https://...)"
                        className="w-48 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSave(r.id)}
                          disabled={loading}
                          className="text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-slate-500 hover:underline"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={loading}
                        className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                      >
                        Sil
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
