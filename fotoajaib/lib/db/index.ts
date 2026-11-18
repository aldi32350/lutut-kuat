import { config } from "@/lib/config";
import type { Db } from "./types";

export type * from "./types";

/** Supabase kalau .env lengkap, selain itu database demo lokal (.data/db.json). */
export async function getDb(): Promise<Db> {
  if (config.supabaseEnabled) return (await import("./supabase")).supabaseDb;
  return (await import("./local")).localDb;
}
