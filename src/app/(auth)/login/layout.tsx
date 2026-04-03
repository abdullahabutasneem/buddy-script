import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Buddy Script",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
