import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getOptionalSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/auth");
  }

  return session;
}
