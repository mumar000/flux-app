import { requireSession } from "@/lib/auth";

export default async function GoalsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireSession();

  return children;
}
