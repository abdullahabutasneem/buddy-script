import Link from "next/link";

export default function MessagesPage() {
  return (
    <main className="p-8 font-sans">
      <p className="mb-4">
        <Link href="/feed" className="text-blue-600 underline" prefetch={false}>
          ← Back to feed
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Messages</h1>
      <p className="mt-2 text-zinc-600">Placeholder — wire this to your chat UI.</p>
    </main>
  );
}
