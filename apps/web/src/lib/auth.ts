import { cookies } from "next/headers";

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");
  if (!token) return null;

  const res = await fetch(`${process.env.BACKEND_URL}/api/v1/auth/me`, {
    headers: { Cookie: `access_token=${token.value}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}