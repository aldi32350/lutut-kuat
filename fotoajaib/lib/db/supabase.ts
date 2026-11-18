import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Db, Generation, Payment, PresetOverride, Profile } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProfile = (r: any): Profile => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role,
  plan: r.plan,
  planExpiresAt: r.plan_expires_at,
  credits: r.credits,
  createdAt: r.created_at,
});
const toGen = (r: any): Generation => ({
  id: r.id,
  userId: r.user_id,
  presetId: r.preset_id,
  inputUrl: r.input_url,
  outputUrl: r.output_url,
  status: r.status,
  saved: r.saved,
  error: r.error,
  createdAt: r.created_at,
});
const toPay = (r: any): Payment => ({
  id: r.id,
  userId: r.user_id,
  packageId: r.package_id,
  amount: r.amount,
  status: r.status,
  provider: r.provider,
  providerRef: r.provider_ref,
  createdAt: r.created_at,
  paidAt: r.paid_at,
});
const toOverride = (r: any): PresetOverride => ({
  id: r.id,
  aktif: r.aktif ?? undefined,
  nama: r.nama ?? undefined,
  deskripsi: r.deskripsi ?? undefined,
  promptTemplate: r.prompt_template ?? undefined,
  updatedAt: r.updated_at,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

const sb = () => supabaseAdmin();

export const supabaseDb: Db = {
  async ensureProfile({ id, email, name }, freeCredits) {
    const rows = check(await sb().rpc("ensure_profile", { p_id: id, p_email: email, p_name: name, p_free: freeCredits }));
    return toProfile((rows as unknown[])[0]);
  },

  async getProfile(id) {
    const r = check(await sb().from("profiles").select("*").eq("id", id).maybeSingle());
    return r ? toProfile(r) : null;
  },

  async listProfiles() {
    const rows = check(await sb().from("profiles").select("*, generations(count)").order("created_at", { ascending: false }));
    return (rows ?? []).map((r) => ({
      ...toProfile(r),
      generationCount: (r as { generations?: { count: number }[] }).generations?.[0]?.count ?? 0,
    }));
  },

  async updateProfile(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.role) row.role = patch.role;
    if (patch.plan) row.plan = patch.plan;
    if (patch.planExpiresAt !== undefined) row.plan_expires_at = patch.planExpiresAt;
    if (patch.name !== undefined) row.name = patch.name;
    check(await sb().from("profiles").update(row).eq("id", id));
  },

  async addCredits(userId, amount, reason, ref) {
    return check(await sb().rpc("add_credits", { p_user: userId, p_amount: amount, p_reason: reason, p_ref: ref ?? null })) as number;
  },

  async consumeCredit(userId, ref) {
    return check(await sb().rpc("consume_credit", { p_user: userId, p_ref: ref })) as boolean;
  },

  async createGeneration(g) {
    check(
      await sb().from("generations").insert({
        id: g.id,
        user_id: g.userId,
        preset_id: g.presetId,
        input_url: g.inputUrl,
        output_url: g.outputUrl,
        status: g.status,
        saved: g.saved,
        error: g.error,
      }),
    );
  },

  async updateGeneration(id, patch) {
    const row: Record<string, unknown> = {};
    if (patch.outputUrl !== undefined) row.output_url = patch.outputUrl;
    if (patch.status) row.status = patch.status;
    if (patch.saved !== undefined) row.saved = patch.saved;
    if (patch.error !== undefined) row.error = patch.error;
    check(await sb().from("generations").update(row).eq("id", id));
  },

  async getGeneration(id) {
    const r = check(await sb().from("generations").select("*").eq("id", id).maybeSingle());
    return r ? toGen(r) : null;
  },

  async listGenerations(userId, opts) {
    let q = sb().from("generations").select("*").eq("user_id", userId).eq("status", "success");
    if (opts?.savedOnly) q = q.eq("saved", true);
    const rows = check(await q.order("created_at", { ascending: false }).limit(opts?.limit ?? 200));
    return (rows ?? []).map(toGen);
  },

  async deleteGeneration(id) {
    check(await sb().from("generations").delete().eq("id", id));
  },

  async countGenerationsSince(userId, sinceIso) {
    const res = await sb().from("generations").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", sinceIso);
    if (res.error) throw new Error(res.error.message);
    return res.count ?? 0;
  },

  async createPayment(p) {
    check(
      await sb().from("payments").insert({
        id: p.id,
        user_id: p.userId,
        package_id: p.packageId,
        amount: p.amount,
        provider: p.provider,
      }),
    );
  },

  async getPayment(id) {
    const r = check(await sb().from("payments").select("*").eq("id", id).maybeSingle());
    return r ? toPay(r) : null;
  },

  async listPayments(userId) {
    const rows = check(await sb().from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }));
    return (rows ?? []).map(toPay);
  },

  async markPaymentPaid(id, providerRef) {
    return check(await sb().rpc("mark_payment_paid", { p_id: id, p_ref: providerRef })) as boolean;
  },

  async markPaymentFailed(id) {
    check(await sb().from("payments").update({ status: "failed" }).eq("id", id).eq("status", "pending"));
  },

  async getPresetOverrides() {
    const rows = check(await sb().from("preset_overrides").select("*"));
    return (rows ?? []).map(toOverride);
  },

  async upsertPresetOverride(o) {
    const row: Record<string, unknown> = { id: o.id, updated_at: new Date().toISOString() };
    if (o.aktif !== undefined) row.aktif = o.aktif;
    if (o.nama !== undefined) row.nama = o.nama;
    if (o.deskripsi !== undefined) row.deskripsi = o.deskripsi;
    if (o.promptTemplate !== undefined) row.prompt_template = o.promptTemplate;
    check(await sb().from("preset_overrides").upsert(row));
  },

  async deletePresetOverride(id) {
    check(await sb().from("preset_overrides").delete().eq("id", id));
  },

  async stats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [u, g, gt, paid] = await Promise.all([
      sb().from("profiles").select("id", { count: "exact", head: true }),
      sb().from("generations").select("id", { count: "exact", head: true }).eq("status", "success"),
      sb().from("generations").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      sb().from("payments").select("amount").eq("status", "paid"),
    ]);
    const paidRows = (paid.data ?? []) as { amount: number }[];
    return {
      users: u.count ?? 0,
      generations: g.count ?? 0,
      generationsToday: gt.count ?? 0,
      revenue: paidRows.reduce((s, r) => s + r.amount, 0),
      paidOrders: paidRows.length,
    };
  },
};
