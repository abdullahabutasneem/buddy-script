import Link from "next/link";
import { ProfileAvatarForm } from "@/components/profile/ProfileAvatarForm";

export default function ProfilePage() {
  return (
    <main className="p-8 font-sans">
      <p className="mb-4">
        <Link href="/feed" className="text-blue-600 underline" prefetch={false}>
          ← Back to feed
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-zinc-600">
        Upload a profile photo (shown in the feed header). You can add one when you register, or
        update it here anytime.
      </p>
      <div className="mt-8">
        <ProfileAvatarForm />
      </div>
    </main>
  );
}
