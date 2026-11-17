import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession, userForSession } from "./data/users";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  school_email_verified: number;
  is_admin: number;
};

const COOKIE = "session";

export async function startSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  createSession(token, userId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) deleteSession(token);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return (userForSession(token) as User | undefined) ?? null;
}

export async function requireUser(next: string): Promise<User> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (!user.is_admin) redirect("/");
  return user;
}
