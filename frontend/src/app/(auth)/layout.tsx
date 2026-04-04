import { Poppins } from "next/font/google";
import "@/styles/bootstrap.min.css";
import "@/styles/common.css";
import "@/styles/main.css";
import "@/styles/responsive.css";

const poppins = Poppins({
  weight: ["100", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={poppins.className}>{children}</div>;
}
