import { cookies } from "next/headers";

const COOKIE = "kr_auth";

export async function istAngemeldet(): Promise<boolean> {
  const pw = process.env.APP_PASSWORD || "accadis";
  const c = await cookies();
  return c.get(COOKIE)?.value === pw;
}

export async function anmelden(eingabe: string): Promise<boolean> {
  const pw = process.env.APP_PASSWORD || "accadis";
  if (eingabe !== pw) return false;
  const c = await cookies();
  c.set(COOKIE, pw, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  return true;
}
