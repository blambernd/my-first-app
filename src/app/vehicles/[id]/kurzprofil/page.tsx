import { redirect } from "next/navigation";

interface KurzprofilPageProps {
  params: Promise<{ id: string }>;
}

export default async function KurzprofilPage({ params }: KurzprofilPageProps) {
  const { id } = await params;
  redirect(`/vehicles/${id}/verkaufsassistent?schritt=2`);
}
