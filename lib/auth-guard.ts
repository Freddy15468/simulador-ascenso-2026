import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../app/api/auth/[...nextauth]/route";

export async function requireSession() {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  if (session.error === "cuenta_compartida") {
    redirect("/login?error=cuenta_compartida");
  }

  return session;
}