import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";

export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/studio";
  if (await getCurrentUser()) redirect(next);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-10">
        <LoginForm mode={config.authMode} next={next} freeCredits={config.freeCredits} callbackError={searchParams.error === "callback"} />
      </main>
    </>
  );
}
