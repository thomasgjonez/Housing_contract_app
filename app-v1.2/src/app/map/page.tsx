import { currentUser } from "@/lib/auth";
import { currentPreferences } from "@/lib/currentPreferences";
import { matchListings } from "@/lib/data/listings";
import { CAMPUS } from "@/lib/geo";
import { PreferencesBar } from "@/components/PreferencesBar";
import { MapView } from "./MapView";

export default async function MapPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const user = await currentUser();
  const { prefs, source } = currentPreferences(sp, user);
  const listings = matchListings(prefs, { userId: user?.id });
  return (
    <div>
      <PreferencesBar prefs={prefs} source={source} view="map" count={listings.length} />
      <MapView listings={listings} campus={CAMPUS} />
    </div>
  );
}
