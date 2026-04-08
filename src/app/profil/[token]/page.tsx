import type { Metadata } from "next";
import { PublicProfile } from "@/components/public-profile";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface ProfilPageProps {
  params: Promise<{ token: string }>;
}

export default async function ProfilPage({ params }: ProfilPageProps) {
  const { token } = await params;
  return <PublicProfile token={token} />;
}
