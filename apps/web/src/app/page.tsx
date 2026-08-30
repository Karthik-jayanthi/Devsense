import { redirect } from "next/navigation";
import Image from "next/image";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="text-center">
        <Image
          src="/devsense-logo.png"
          alt="DevSense"
          width={280}
          height={52}
          priority
          className="mx-auto mb-6"
          style={{ width: "220px", height: "auto" }}
        />
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Where code meets intuition
        </p>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`}
          className="inline-block bg-[var(--accent)] text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Sign in with GitHub
        </a>
      </div>
    </main>
  );
}
