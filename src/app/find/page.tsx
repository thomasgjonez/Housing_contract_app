import { currentUser } from "@/lib/auth";
import { saveQuiz } from "@/lib/actions/buyers";
import { profileForUser } from "@/lib/data/buyers";
import { DEFAULT_PREFERENCES, QUIZ_FIELDS, parsePreferences } from "@/lib/preferences";
import { QuizFields } from "@/components/PreferenceFields";

// The quick quiz: the first questions of the buyer profile.
export default async function Find({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const profile = user ? profileForUser(user.id) : null;
  // Start from the buyer's profile, then any answers carried in the URL.
  const p = parsePreferences(sp, profile ?? DEFAULT_PREFERENCES, QUIZ_FIELDS);

  return (
    <form action={saveQuiz} className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">What are you looking for?</h1>
        <p className="text-slate-600">Leave anything on its default if you don&apos;t care.</p>
        <p className="mt-2 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
          {user ? (
            <>This is the start of your buyer profile. <a href="/profile" className="font-semibold underline">Fill in the rest</a> for better ranking and alerts when new contracts are posted.</>
          ) : (
            <>This is the quick version. <a href="/signup?next=/profile" className="font-semibold underline">Make an account</a> to save it as a buyer profile and get alerts when a match is posted.</>
          )}
        </p>
      </div>

      <div className="card space-y-5 p-5">
        <QuizFields p={p} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button name="view" value="match" className="btn-primary py-3">♥ See matches</button>
        <button name="view" value="map" className="btn-ghost py-3">◎ Show on map</button>
      </div>
    </form>
  );
}
