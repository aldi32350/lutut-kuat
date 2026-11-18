import {
  Baby, Box, Briefcase, Camera, Combine, Crown, Eraser, Expand, Gamepad2, GraduationCap, Heart, HeartHandshake,
  History, Hourglass, IdCard, ImageIcon, Landmark, Layers, Lock, MonitorPlay, Move3d, Package, Palette, PenTool,
  Shirt, ShoppingBag, Smile, Sparkles, Store, UserRound, Users, UtensilsCrossed, Wand2, type LucideIcon,
} from "lucide-react";

/** Peta nama ikon (string di lib/presets.ts) → komponen lucide. Tambahkan di sini saat butuh ikon baru. */
const ICONS: Record<string, LucideIcon> = {
  Baby, Box, Briefcase, Camera, Combine, Crown, Eraser, Expand, Gamepad2, GraduationCap, Heart, HeartHandshake,
  History, Hourglass, IdCard, ImageIcon, Landmark, Layers, Lock, MonitorPlay, Move3d, Package, Palette, PenTool,
  Shirt, ShoppingBag, Smile, Sparkles, Store, UserRound, Users, UtensilsCrossed, Wand2,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Sparkles;
  return <C className={className} aria-hidden />;
}
