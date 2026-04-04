import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "@/styles/bootstrap.min.css";
import "@/styles/common.css";
import "@/styles/main.css";
import "@/styles/responsive.css";
import "@/styles/feed-header.css";

const poppins = Poppins({
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Feed",
  description: "Buddy Script home feed",
};

export default function FeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={poppins.className}>{children}</div>;
}
