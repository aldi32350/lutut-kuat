import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Db, Generation, Payment, PresetOverride, Profile, ProfileWithUsage, Stats } from "./types";

/**
 * Database mode demo: satu file JSON di .data/db.json.
 * Cukup untuk dicoba di laptop (1 proses). Produksi pakai Supabase (lib/db/supabase.ts).
 */

interface LocalUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

interface Ledger {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  ref: string | null;
  createdAt: string;
}

interface Data {
  users: LocalUser[];
  profiles: Profile[];
  credits: Ledger[];
  generations: Generation[];
  payments: Payment[];
  presetOverrides: PresetOverride[];
}

const FILE = path.join(process.cwd(), ".data", "db.json");
const g = globalThis as unknown as { __faDb?: Data; __faLock?: Promise<unknown> };

async function load(): Promise<Data> {
  if (g.__faDb) return g.__faDb;
  try {
    g.__faDb = JSON.parse(await fs.readFile(FILE, "utf8")) as Data;
  } catch {
    g.__faDb = { users: [], profiles: [], credits: [], generations: [], payments: [], presetOverrides: [] };
  }
  return g.__faDb;
}

/** Jalankan perubahan satu per satu (antre) lalu simpan ke disk. */
function write<T>(fn: (d: Data) => T): Promise<T> {
  const run = (g.__faLock ?? Promise.resolve()).then(async () => {
    const d = await load();
    const result = fn(d);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(d, null, 1));
    return result;
  });
  g.__faLock = run.catch(() => undefined);
  return run;
}

const now = () => new Date().toISOString();
const clone = <T>(x: T): T => structuredClone(x);

// ── khusus mode lokal: akun email + password ──
export async function findLocalUser(email: string) {
  const d = await load();
  return d.users.find((u) => u.email === email.toLowerCase()) ?? null;
}

export async function createLocalUser(email: string, name: string, passwordHash: string) {
  return write((d) => {
    const e = email.toLowerCase();
    if (d.users.some((u) => u.email === e)) return null;
    const user: LocalUser = { id: crypto.randomUUID(), email: e, name, passwordHash, createdAt: now() };
    d.users.push(user);
    return clone(user);
  });
}

function addLedger(d: Data, userId: string, amount: number, reason: string, ref?: string) {
  const p = d.profiles.find((x) => x.id === userId);
  if (!p) throw new Error("profil tidak ditemukan");
  p.credits += amount;
  d.credits.push({ id: crypto.randomUUID(), userId, amount, reason, ref: ref ?? null, createdAt: now() });
  return p.credits;
}

export const localDb: Db = {
  async ensureProfile({ id, email, name }, freeCredits) {
    return write((d) => {
      let p = d.profiles.find((x) => x.id === id);
      if (!p) {
        p = { id, email: email.toLowerCase(), name, role: "user", plan: "free", planExpiresAt: null, credits: 0, createdAt: now() };
        d.profiles.push(p);
        if (freeCredits > 0) addLedger(d, id, freeCredits, "free_trial");
      }
      return clone(p);
    });
  },

  async getProfile(id) {
    const d = await load();
    const p = d.profiles.find((x) => x.id === id);
    return p ? clone(p) : null;
  },

  async listProfiles() {
    const d = await load();
    return d.profiles
      .map<ProfileWithUsage>((p) => ({ ...clone(p), generationCount: d.generations.filter((x) => x.userId === p.id).length }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateProfile(id, patch) {
    await write((d) => {
      const p = d.profiles.find((x) => x.id === id);
      if (p) Object.assign(p, patch);
    });
  },

  async addCredits(userId, amount, reason, ref) {
    return write((d) => addLedger(d, userId, amount, reason, ref));
  },

  async consumeCredit(userId, ref) {
    return write((d) => {
      const p = d.profiles.find((x) => x.id === userId);
      if (!p || p.credits < 1) return false;
      addLedger(d, userId, -1, "generate", ref);
      return true;
    });
  },

  async createGeneration(gen) {
    await write((d) => {
      d.generations.push({ ...gen, createdAt: now() });
    });
  },

  async updateGeneration(id, patch) {
    await write((d) => {
      const x = d.generations.find((y) => y.id === id);
      if (x) Object.assign(x, patch);
    });
  },

  async getGeneration(id) {
    const d = await load();
    const x = d.generations.find((y) => y.id === id);
    return x ? clone(x) : null;
  },

  async listGenerations(userId, opts) {
    const d = await load();
    return clone(
      d.generations
        .filter((x) => x.userId === userId && x.status === "success" && (!opts?.savedOnly || x.saved))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, opts?.limit ?? 200),
    );
  },

  async deleteGeneration(id) {
    await write((d) => {
      d.generations = d.generations.filter((x) => x.id !== id);
    });
  },

  async countGenerationsSince(userId, sinceIso) {
    const d = await load();
    return d.generations.filter((x) => x.userId === userId && x.createdAt >= sinceIso).length;
  },

  async createPayment(p) {
    await write((d) => {
      d.payments.push({ ...p, status: "pending", providerRef: null, createdAt: now(), paidAt: null });
    });
  },

  async getPayment(id) {
    const d = await load();
    const x = d.payments.find((y) => y.id === id);
    return x ? clone(x) : null;
  },

  async listPayments(userId) {
    const d = await load();
    return clone(d.payments.filter((x) => x.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async markPaymentPaid(id, providerRef) {
    return write((d) => {
      const x = d.payments.find((y) => y.id === id);
      if (!x || x.status === "paid") return false;
      x.status = "paid";
      x.paidAt = now();
      x.providerRef = providerRef;
      return true;
    });
  },

  async markPaymentFailed(id) {
    await write((d) => {
      const x = d.payments.find((y) => y.id === id);
      if (x && x.status === "pending") x.status = "failed";
    });
  },

  async getPresetOverrides() {
    const d = await load();
    return clone(d.presetOverrides);
  },

  async upsertPresetOverride(o) {
    await write((d) => {
      const i = d.presetOverrides.findIndex((x) => x.id === o.id);
      const val = { ...(i >= 0 ? d.presetOverrides[i] : {}), ...o, updatedAt: now() };
      if (i >= 0) d.presetOverrides[i] = val;
      else d.presetOverrides.push(val);
    });
  },

  async deletePresetOverride(id) {
    await write((d) => {
      d.presetOverrides = d.presetOverrides.filter((x) => x.id !== id);
    });
  },

  async stats(): Promise<Stats> {
    const d = await load();
    const today = new Date().toISOString().slice(0, 10);
    const paid = d.payments.filter((x) => x.status === "paid");
    return {
      users: d.profiles.length,
      generations: d.generations.filter((x) => x.status === "success").length,
      generationsToday: d.generations.filter((x) => x.createdAt.startsWith(today)).length,
      revenue: paid.reduce((s, x) => s + x.amount, 0),
      paidOrders: paid.length,
    };
  },
};
