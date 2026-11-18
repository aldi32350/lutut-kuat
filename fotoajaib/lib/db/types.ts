export type Role = "user" | "admin";
export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  plan: Plan;
  planExpiresAt: string | null;
  credits: number;
  createdAt: string;
}

export interface Generation {
  id: string;
  userId: string;
  presetId: string;
  inputUrl: string;
  outputUrl: string | null;
  status: "pending" | "success" | "failed";
  saved: boolean;
  error: string | null;
  createdAt: string;
}

export interface Payment {
  id: string; // order id
  userId: string;
  packageId: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  provider: string;
  providerRef: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface PresetOverride {
  id: string;
  aktif?: boolean;
  nama?: string;
  deskripsi?: string;
  promptTemplate?: string;
  updatedAt?: string;
}

export interface Stats {
  users: number;
  generations: number;
  generationsToday: number;
  revenue: number;
  paidOrders: number;
}

export interface ProfileWithUsage extends Profile {
  generationCount: number;
}

export interface Db {
  /** buat profil bila belum ada; akun baru mendapat kredit gratis */
  ensureProfile(input: { id: string; email: string; name: string }, freeCredits: number): Promise<Profile>;
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(): Promise<ProfileWithUsage[]>;
  updateProfile(id: string, patch: Partial<Pick<Profile, "role" | "plan" | "planExpiresAt" | "name">>): Promise<void>;

  /** tambah (atau kurangi dengan angka negatif) kredit + catat di ledger; kembalikan saldo baru */
  addCredits(userId: string, amount: number, reason: string, ref?: string): Promise<number>;
  /** potong 1 kredit secara atomik; false kalau saldo habis */
  consumeCredit(userId: string, ref: string): Promise<boolean>;

  createGeneration(g: Omit<Generation, "createdAt">): Promise<void>;
  updateGeneration(id: string, patch: Partial<Pick<Generation, "outputUrl" | "status" | "saved" | "error">>): Promise<void>;
  getGeneration(id: string): Promise<Generation | null>;
  listGenerations(userId: string, opts?: { savedOnly?: boolean; limit?: number }): Promise<Generation[]>;
  deleteGeneration(id: string): Promise<void>;
  countGenerationsSince(userId: string, sinceIso: string): Promise<number>;

  createPayment(p: Omit<Payment, "createdAt" | "paidAt" | "providerRef" | "status">): Promise<void>;
  getPayment(id: string): Promise<Payment | null>;
  listPayments(userId: string): Promise<Payment[]>;
  /** tandai lunas; true kalau status benar-benar berubah (mencegah kredit dobel dari webhook berulang) */
  markPaymentPaid(id: string, providerRef: string | null): Promise<boolean>;
  markPaymentFailed(id: string): Promise<void>;

  getPresetOverrides(): Promise<PresetOverride[]>;
  upsertPresetOverride(o: PresetOverride): Promise<void>;
  deletePresetOverride(id: string): Promise<void>;

  stats(): Promise<Stats>;
}
