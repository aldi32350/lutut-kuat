import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground">Admin</span>
          <Link href="/admin" className="rounded-md px-3 py-1.5 hover:bg-muted">
            User &amp; pemakaian
          </Link>
          <Link href="/admin/presets" className="rounded-md px-3 py-1.5 hover:bg-muted">
            Kelola preset
          </Link>
        </div>
        {children}
      </div>
    </>
  );
}
