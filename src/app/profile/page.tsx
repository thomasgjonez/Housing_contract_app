import { requireUser } from "@/lib/auth";
import { complexOptions } from "@/lib/data/complexes";
import { linkFormProfile, profileForUser } from "@/lib/data/buyers";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  await linkFormProfile(user);
  const profile = await profileForUser(user.id);
  return (
    <ProfileForm
      profile={profile}
      user={{ name: user.name, email: user.email, phone: user.phone ?? "" }}
      complexes={await complexOptions()}
    />
  );
}
