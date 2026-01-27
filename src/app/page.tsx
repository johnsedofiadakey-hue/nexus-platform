import { redirect } from "next/navigation";

export default function Home() {
  // Automatically redirect to the secure sign-in page
  redirect("/auth/signin");
}