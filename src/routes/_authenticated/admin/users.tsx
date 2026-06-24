import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Loader2, UserPlus, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createPetugas,
  deletePetugas,
  listPetugas,
  updatePetugas,
} from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();

  const fnList = useServerFn(listPetugas);
  const fnCreate = useServerFn(createPetugas);
  const fnDelete = useServerFn(deletePetugas);
  const fnUpdate = useServerFn(updatePetugas);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    password: "",
    no_hp: "",
    nik: "",
  });

  const [editingPetugas, setEditingPetugas] = useState<null | {
    id: string;
    nama: string;
    email: string;
    no_hp: string | null;
    nik: string | null;
  }>(null);

  const [editForm, setEditForm] = useState({
    nama: "",
    email: "",
    password: "",
    no_hp: "",
    nik: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-petugas"],
    queryFn: () => fnList(),
    enabled: isAdmin,
  });

  const createMut = useMutation({
    mutationFn: (payload: typeof form) => fnCreate({ data: payload }),
    onSuccess: () => {
      toast.success("Akun petugas berhasil dibuat");
      setForm({ nama: "", email: "", password: "", no_hp: "", nik: "" });
      qc.invalidateQueries({ queryKey: ["admin-petugas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (payload: {
      userId: string;
      email?: string;
      password?: string;
      nama?: string;
      no_hp?: string;
      nik?: string;
    }) => fnUpdate({ data: payload }),
    onSuccess: () => {
      toast.success("Akun petugas berhasil diperbarui");
      setEditingPetugas(null);
      qc.invalidateQueries({ queryKey: ["admin-petugas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => fnDelete({ data: { userId } }),
    onSuccess: () => {
      toast.success("Akun dihapus");
      qc.invalidateQueries({ queryKey: ["admin-petugas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin)
    return (
      <p className="text-sm text-muted-foreground">
        Hanya admin yang dapat mengakses halaman ini.
      </p>
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.email || !form.password) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }
    createMut.mutate(form);
  };

  const startEdit = (p: any) => {
    setEditingPetugas(p);
    setEditForm({
      nama: p.nama,
      email: p.email,
      password: "",
      no_hp: p.no_hp ?? "",
      nik: p.nik ?? "",
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetugas) return;
    if (!editForm.nama || !editForm.email) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    const payload: any = {
      userId: editingPetugas.id,
      nama: editForm.nama,
      email: editForm.email,
      no_hp: editForm.no_hp || null,
      nik: editForm.nik || null,
    };

    if (editForm.password) {
      if (editForm.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
      }
      payload.password = editForm.password;
    }

    updateMut.mutate(payload);
  };

  const hapus = (id: string, nama: string) => {
    if (!confirm(`Hapus akun petugas ${nama}?`)) return;
    deleteMut.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Kelola User
        </h1>
        <p className="text-sm text-muted-foreground">
          Tambah akun petugas baru untuk membantu memverifikasi pengajuan warga.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card className="border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-bold">
              Tambah Akun Petugas
            </h3>
          </div>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <div>
              <Label>Nama Lengkap *</Label>
              <Input
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama petugas"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="petugas@kecamatan.go.id"
              />
            </div>
            <div>
              <Label>Password *</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <Label>NIK</Label>
              <Input
                value={form.nik}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
                placeholder="Opsional"
              />
            </div>
            <div>
              <Label>No. HP</Label>
              <Input
                value={form.no_hp}
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                placeholder="Opsional"
              />
            </div>
            <Button
              type="submit"
              disabled={createMut.isPending}
              className="w-full bg-gradient-hero text-primary-foreground hover:opacity-95"
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              Tambah Petugas
            </Button>
          </form>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <div className="border-b px-5 py-3">
            <h3 className="font-display text-lg font-bold">Daftar Petugas</h3>
            <p className="text-xs text-muted-foreground">
              {data?.length ?? 0} akun petugas aktif
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">No. HP</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Memuat…
                    </td>
                  </tr>
                )}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Belum ada akun petugas.
                    </td>
                  </tr>
                )}
                {(data ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.no_hp ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(p)}
                        disabled={deleteMut.isPending}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => hapus(p.id, p.nama)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {editingPetugas && (
        <Dialog open={!!editingPetugas} onOpenChange={(open) => !open && setEditingPetugas(null)}>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Edit Akun Petugas</DialogTitle>
              <DialogDescription>
                Perbarui informasi akun petugas atau ubah password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submitEdit} className="space-y-4 pt-2">
              <div>
                <Label>Nama Lengkap *</Label>
                <Input
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  placeholder="Nama petugas"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="petugas@kecamatan.go.id"
                />
              </div>
              <div>
                <Label>Password Baru (Kosongkan jika tidak diubah)</Label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <Label>NIK</Label>
                <Input
                  value={editForm.nik}
                  onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })}
                  placeholder="Opsional"
                />
              </div>
              <div>
                <Label>No. HP</Label>
                <Input
                  value={editForm.no_hp}
                  onChange={(e) => setEditForm({ ...editForm, no_hp: e.target.value })}
                  placeholder="Opsional"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPetugas(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={updateMut.isPending}
                  className="bg-gradient-hero text-primary-foreground hover:opacity-95"
                >
                  {updateMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
