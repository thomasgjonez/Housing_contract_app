import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { complexOptions } from "@/lib/data/complexes";
import { CAMPUS } from "@/lib/geo";
import { SellForm } from "./SellForm";

export default async function Sell() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="card mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-3xl font-semibold">List your contract</h1>
        <p className="text-slate-600">Make a free account so buyers can message you. It takes 30 seconds.</p>
        <div className="flex justify-center gap-2">
          <Link href="/signup?next=/sell" className="btn-primary">Sign up</Link>
          <Link href="/login?next=/sell" className="btn-ghost">Log in</Link>
        </div>
      </div>
    );
  }
  const complexes = complexOptions();
  return <SellForm complexes={complexes} campus={CAMPUS} isAdmin={!!user.is_admin} phone={user.phone ?? ""} />;
}
