"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/lib/actions/auth";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const other = mode === "login" ? "signup" : "login";
  return (
    <form action={action} className="card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-extrabold">{mode === "login" ? "Log in" : "Create your account"}</h1>
      <input type="hidden" name="next" value={next} />
      {mode === "signup" && (
        <label className="block">
          <span className="label">Name</span>
          <input name="name" required className="input" autoComplete="name" />
        </label>
      )}
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required className="input" autoComplete="email" />
        {mode === "signup" && <span className="mt-1 block text-xs text-slate-500">Use your BYU or UVU email to get a verified student badge.</span>}
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required minLength={mode === "signup" ? 8 : undefined} className="input" autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {state?.error && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{state.error}</div>}
      <button className="btn-primary w-full" disabled={pending}>{mode === "login" ? "Log in" : "Sign up"}</button>
      <p className="text-center text-sm text-slate-600">
        {mode === "login" ? "New here?" : "Have an account?"}{" "}
        <Link href={`/${other}?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600">
          {mode === "login" ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
