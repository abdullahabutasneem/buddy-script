import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Buddy Script account",
};

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
