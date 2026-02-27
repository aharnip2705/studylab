"use client";

import { useState, useRef } from "react";
import { addPublisher, updatePublisher, deletePublisher, uploadPublisherLogoFile } from "@/lib/actions/admin-resources";
import { Upload, Image } from "lucide-react";

type Publisher = { id: string; name: string; sort_order?: number; logo_url?: string | null };

export function AdminPublishersList({ publishers }: { publishers: Publisher[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
    const res = await addPublisher(newName.trim());
    setLoading(false);
    if (res.error) setError(res.error);
    else setNewName("");
  }

  async function handleSave(id: string) {
    setLoading(true);
    setError(null);
    const logoVal = editLogoUrl.trim();
    const logo_url =
      logoVal && (logoVal.startsWith("http://") || logoVal.startsWith("https://")) ? logoVal : null;
    const res = await updatePublisher(id, editName.trim(), logo_url);
    setLoading(false);
    if (res.error) setError(res.error);
    else {
      setEditingId(null);
      setEditLogoUrl("");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const id = uploadingForId;
    e.target.value = "";
    setUploadingForId(null);
    if (!file || !id) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const res = await uploadPublisherLogoFile(id, formData);
    setLoading(false);
    if (res.error) setError(res.error);
    else setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu yayın evini silmek istediğinize emin misiniz? Altındaki kaynaklar \"yayın evi yok\" olarak kalabilir.")) return;
    setLoading(true);
    setError(null);
    const res = await deletePublisher(id);
    setLoading(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />
      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="new_publisher" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Yeni yayın evi
          </label>
          <input
            id="new_publisher"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yayın evi adı"
            className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Ekle
        </button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="p-3 font-medium">Logo</th>
              <th className="p-3 font-medium">Yayın evi</th>
              <th className="p-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {publishers.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="p-3">
                  {editingId === p.id ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={editLogoUrl}
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                        placeholder="Logo URL (https://...)"
                        className="w-48 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadingForId(p.id);
                            setTimeout(() => fileInputRef.current?.click(), 0);
                          }}
                          disabled={loading}
                          className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                          <Upload className="h-3 w-3" />
                          Dosya yükle
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.logo_url}
                          alt={p.name}
                          className="h-8 w-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Image className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3 font-medium">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full min-w-[180px] rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    p.name
                  )}
                </td>
                <td className="p-3">
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSave(p.id)}
                        disabled={loading}
                        className="text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                      >
                        Kaydet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditLogoUrl("");
                        }}
                        className="text-slate-500 hover:underline"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditName(p.name);
                          setEditLogoUrl(p.logo_url || "");
                        }}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
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
      {publishers.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          Henüz yayın evi yok. Yukarıdan ekleyin.
        </p>
      )}
    </div>
  );
}
