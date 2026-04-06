import { redirect } from "next/navigation";

/** Root URL shows the app entry — send visitors to login. */
export default function Home() {
  redirect("/login");
}
