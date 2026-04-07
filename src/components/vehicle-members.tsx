"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MembersList } from "@/components/members-list";
import { InviteMemberForm } from "@/components/invite-member-form";
import { PendingInvitations } from "@/components/pending-invitations";
import type { VehicleMember, VehicleInvitation } from "@/lib/validations/member";

interface VehicleMembersProps {
  vehicleId: string;
  initialMembers: VehicleMember[];
  initialInvitations: VehicleInvitation[];
}

export function VehicleMembers({
  vehicleId,
  initialMembers,
  initialInvitations,
}: VehicleMembersProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    setInvitations(initialInvitations);
  }, [initialInvitations]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Invite section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nutzer einladen</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteMemberForm vehicleId={vehicleId} onSuccess={refresh} />
        </CardContent>
      </Card>

      {/* Pending invitations */}
      <PendingInvitations invitations={invitations} onUpdate={refresh} />

      {/* Members list */}
      <div>
        <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">
          Berechtigte Nutzer
        </h3>
        <MembersList
          vehicleId={vehicleId}
          members={members}
          onUpdate={refresh}
        />
      </div>
    </div>
  );
}
