"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Row {
  id: string;
  email: string;
  name: string;
  role: string;
  isPro: boolean;
  planExpiresAt: string | null;
  credits: number;
  generationCount: number;
  createdAt: string;
}

export function UserTable({ users }: { users: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? users.filter((u) => u.email.includes(n) || u.name.toLowerCase().includes(n)) : users;
  }, [users, q]);

  async function aksi(id: string, body: Record<string, unknown>, pesan: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return toast.error(data.error ?? "Gagal");
    toast.success(pesan);
    router.refresh();
  }

  function tambahKredit(u: Row) {
    const v = prompt(`Tambah kredit untuk ${u.email} (pakai angka minus untuk mengurangi):`, "10");
    const n = Math.trunc(Number(v));
    if (!v || !n) return;
    aksi(u.id, { addCredits: n }, `Kredit ${n > 0 ? "+" : ""}${n} untuk ${u.email}`);
  }

  return (
    <div className="rounded-2xl border">
      <div className="flex items-center gap-2 border-b p-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari email / nama" className="w-full bg-transparent text-sm outline-none" />
        <span className="shrink-0 text-xs text-muted-foreground">{list.length} user</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Paket</th>
              <th className="p-3 text-right">Kredit</th>
              <th className="p-3 text-right">Generate</th>
              <th className="p-3">Daftar</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t align-top">
                <td className="p-3">
                  <p className="font-medium">{u.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.role === "admin" && <Badge className="mt-1">admin</Badge>}
                </td>
                <td className="whitespace-nowrap p-3">
                  {u.isPro ? (
                    <span className="flex items-center gap-1">
                      <Crown className="h-4 w-4 text-accent" /> Pro s.d. {new Date(u.planExpiresAt!).toLocaleDateString("id-ID")}
                    </span>
                  ) : (
                    "Gratis"
                  )}
                </td>
                <td className="p-3 text-right font-mono">{u.credits}</td>
                <td className="p-3 text-right font-mono">{u.generationCount}</td>
                <td className="whitespace-nowrap p-3 text-xs">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => tambahKredit(u)}>
                      ± Kredit
                    </Button>
                    {u.isPro ? (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => aksi(u.id, { cabutPro: true }, "Pro dicabut")}>
                        Cabut Pro
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy === u.id} onClick={() => aksi(u.id, { proHari: 30 }, "Pro 30 hari diberikan")}>
                        Beri Pro 30h
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
