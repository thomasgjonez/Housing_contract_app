// Small helpers for reading FormData in server actions.

export type FormState = { error?: string } | undefined;

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function pick<T extends string>(v: string, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback;
}

/** Only same-site paths, so ?next= can't send someone to another site. */
export function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
