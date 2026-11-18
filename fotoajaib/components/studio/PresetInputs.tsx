"use client";

import type { PublicPreset } from "@/lib/presets";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Props {
  preset: PublicPreset;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  consent: boolean;
  onConsent: (v: boolean) => void;
}

export function PresetInputs({ preset, values, onChange, consent, onConsent }: Props) {
  const fields = (preset.inputTambahan ?? []).filter((f) => f.tipe !== "image");
  const set = (k: string, v: string) => onChange({ ...values, [k]: v });

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        // input "custom" hanya muncul jika select memilih "Tulis sendiri"
        if (f.nama === "custom" && !Object.values(values).includes("custom")) return null;
        const current = values[f.nama] ?? f.default ?? "";

        if (f.tipe === "select") {
          return (
            <div key={f.nama} className="space-y-2">
              <Label>{f.label}</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={f.label}>
                {f.opsi?.map((o) => {
                  const active = current === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set(f.nama, o.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/60",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={f.nama} className="space-y-2">
            <Label htmlFor={`in-${f.nama}`}>{f.label}</Label>
            <Input
              id={`in-${f.nama}`}
              value={current}
              maxLength={200}
              placeholder={f.placeholder}
              onChange={(e) => set(f.nama, e.target.value)}
            />
          </div>
        );
      })}

      {preset.butuhPersetujuan && (
        <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => onConsent(v === true)} className="mt-0.5" />
          <span>
            Saya sudah mendapat <b>izin dari semua orang</b> yang wajahnya ada di foto ini, dan tidak akan memakai hasilnya untuk
            menipu, merendahkan, atau melanggar privasi orang lain.
          </span>
        </label>
      )}
    </div>
  );
}
