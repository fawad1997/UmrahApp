import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Check if user has a role set
  if (!session.user.role) {
    redirect("/umrah/role");
  }

  // Redirect based on role
  if (session.user.role === "GUIDE") {
    redirect("/umrah/guide");
  } else {
    if (session.user.currentGroupId) {
      redirect("/umrah/chat");
    } else {
      redirect("/umrah/join");
    }
  }
}

