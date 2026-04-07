"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users, Shield, Eye, Wrench, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase";
import {
  ROLE_LABELS,
  type VehicleMember,
  type MemberRole,
  type InviteRole,
} from "@/lib/validations/member";

const ROLE_ICONS: Record<MemberRole, typeof Shield> = {
  besitzer: Shield,
  werkstatt: Wrench,
  betrachter: Eye,
};

const ROLE_BADGE_COLORS: Record<MemberRole, string> = {
  besitzer: "bg-primary/10 text-primary",
  werkstatt: "bg-amber-100 text-amber-800",
  betrachter: "bg-gray-100 text-gray-800",
};

interface MembersListProps {
  vehicleId: string;
  members: VehicleMember[];
  onUpdate: () => void;
}

export function MembersList({ vehicleId, members, onUpdate }: MembersListProps) {
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleRoleChange = async (memberId: string, newRole: InviteRole) => {
    setChangingRole(memberId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_members")
        .update({ role: newRole })
        .eq("id", memberId)
        .eq("vehicle_id", vehicleId);

      if (error) throw error;
      toast.success("Rolle geändert");
      onUpdate();
    } catch {
      toast.error("Fehler beim Ändern der Rolle");
    } finally {
      setChangingRole(null);
    }
  };

  const handleRevoke = async (memberId: string, email: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_members")
        .delete()
        .eq("id", memberId)
        .eq("vehicle_id", vehicleId);

      if (error) throw error;
      toast.success(`Zugriff für ${email} entfernt`);
      onUpdate();
    } catch {
      toast.error("Fehler beim Entfernen des Zugriffs");
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          Noch keine Mitglieder. Lade jemanden ein!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {members.map((member) => {
        const Icon = ROLE_ICONS[member.role];
        const isOwner = member.role === "besitzer";

        return (
          <div
            key={member.id}
            className="flex items-center justify-between py-3 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.user_email ?? "Unbekannt"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Beigetreten{" "}
                  {new Date(member.joined_at).toLocaleDateString("de-DE")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwner ? (
                <Badge className={`${ROLE_BADGE_COLORS.besitzer} border-0`}>
                  {ROLE_LABELS.besitzer}
                </Badge>
              ) : (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      handleRoleChange(member.id, value as InviteRole)
                    }
                    disabled={changingRole === member.id}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="werkstatt">Werkstatt</SelectItem>
                      <SelectItem value="betrachter">Betrachter</SelectItem>
                    </SelectContent>
                  </Select>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Zugriff entziehen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {member.user_email} verliert den Zugriff auf dieses
                          Fahrzeug. Diese Aktion kann rückgängig gemacht werden,
                          indem du erneut einlädst.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleRevoke(member.id, member.user_email ?? "")
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Zugriff entziehen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
