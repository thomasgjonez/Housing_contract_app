import { requireUser } from "@/lib/auth";
import { inbox } from "@/lib/data/chat";
import { LiveInboxList } from "./LiveInboxList";

export default async function Inbox() {
  const user = await requireUser("/inbox");
  const rows = await inbox(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Inbox</h1>
      <LiveInboxList initialRows={rows} />
    </div>
  );
}
