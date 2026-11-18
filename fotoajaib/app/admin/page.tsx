import { getDb } from "@/lib/db";
import { isProActive } from "@/lib/auth";
import { rupiah } from "@/lib/plans";
import { config } from "@/lib/config";
import { UserTable } from "@/components/admin/UserTable";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const db = await getDb();
  const [stats, users] = await Promise.all([db.stats(), db.listProfiles()]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kartu label="User" value={stats.users} />
        <Kartu label="Total generate" value={stats.generations} />
        <Kartu label="Generate hari ini" value={stats.generationsToday} />
        <Kartu label="Order lunas" value={stats.paidOrders} />
        <Kartu label="Pendapatan" value={rupiah(stats.revenue)} />
      </div>

      <p className="text-xs text-muted-foreground">
        Mode: database <b>{config.supabaseEnabled ? "Supabase" : "demo lokal"}</b> · pembayaran <b>{config.paymentProvider}</b> · AI{" "}
        <b>{process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "mock")}</b>
      </p>

      <UserTable
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: config.adminEmails.includes(u.email) ? "admin" : u.role,
          isPro: isProActive(u),
          planExpiresAt: u.planExpiresAt,
          credits: u.credits,
          generationCount: u.generationCount,
          createdAt: u.createdAt,
        }))}
      />
    </div>
  );
}

function Kartu({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
