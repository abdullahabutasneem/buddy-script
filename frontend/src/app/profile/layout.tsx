import { requireSessionOrRedirect } from "@/lib/requireAuthServer";

export const dynamic = "force-dynamic";

export default async function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireSessionOrRedirect();
  return children;
}
