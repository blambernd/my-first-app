"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Car, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandLogoWithText } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase";
import { ROLE_LABELS, type MemberRole } from "@/lib/validations/member";

interface InviteInfo {
  vehicleName: string;
  role: MemberRole;
  expiresAt: string;
}

type InviteState =
  | { status: "loading" }
  | { status: "valid"; info: InviteInfo }
  | { status: "accepted" }
  | { status: "expired" }
  | { status: "invalid" }
  | { status: "error"; message: string }
  | { status: "needs_auth"; info: InviteInfo };

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<InviteState>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    loadInvite();
  }, [token]);

  async function loadInvite() {
    try {
      const supabase = createClient();

      // Look up the invitation
      const { data: invitation, error } = await supabase
        .from("vehicle_invitations")
        .select("*, vehicles(make, model, year)")
        .eq("token", token)
        .single();

      if (error || !invitation) {
        setState({ status: "invalid" });
        return;
      }

      if (invitation.status === "angenommen") {
        setState({ status: "accepted" });
        return;
      }

      if (
        invitation.status === "widerrufen" ||
        invitation.status === "abgelaufen"
      ) {
        setState({ status: "expired" });
        return;
      }

      if (new Date(invitation.expires_at) < new Date()) {
        setState({ status: "expired" });
        return;
      }

      const vehicle = invitation.vehicles as { make: string; model: string; year: number } | null;
      const info: InviteInfo = {
        vehicleName: vehicle
          ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
          : "Fahrzeug",
        role: invitation.role,
        expiresAt: invitation.expires_at,
      };

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "needs_auth", info });
        return;
      }

      setState({ status: "valid", info });
    } catch {
      setState({ status: "error", message: "Einladung konnte nicht geladen werden" });
    }
  }

  async function acceptInvite() {
    setAccepting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({
          status: "needs_auth",
          info: (state as { info: InviteInfo }).info,
        });
        return;
      }

      // Get the invitation details
      const { data: invitation } = await supabase
        .from("vehicle_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "offen")
        .single();

      if (!invitation) {
        setState({ status: "invalid" });
        return;
      }

      // Create the membership
      const { error: memberError } = await supabase
        .from("vehicle_members")
        .insert({
          vehicle_id: invitation.vehicle_id,
          user_id: user.id,
          role: invitation.role,
          user_email: user.email,
        });

      if (memberError) {
        if (memberError.code === "23505") {
          setState({ status: "error", message: "Du bist bereits Mitglied dieses Fahrzeugs" });
          return;
        }
        throw memberError;
      }

      // Mark invitation as accepted
      await supabase
        .from("vehicle_invitations")
        .update({ status: "angenommen" })
        .eq("id", invitation.id);

      setState({ status: "accepted" });
    } catch {
      setState({ status: "error", message: "Einladung konnte nicht angenommen werden" });
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogoWithText />
        </div>

        {state.status === "loading" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-3">
                Einladung wird geladen...
              </p>
            </CardContent>
          </Card>
        )}

        {(state.status === "valid" || state.status === "needs_auth") && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Einladung zum Fahrzeug</CardTitle>
              <CardDescription>
                Du wurdest eingeladen, auf ein Fahrzeug zuzugreifen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fahrzeug</span>
                  <span className="font-medium">{state.info.vehicleName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deine Rolle</span>
                  <Badge variant="outline">
                    {ROLE_LABELS[state.info.role]}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gültig bis</span>
                  <span>
                    {new Date(state.info.expiresAt).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>

              {state.status === "needs_auth" ? (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Melde dich an oder registriere dich, um die Einladung
                    anzunehmen.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/login?redirect=/invite/${token}`}>
                        Anmelden
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/register?redirect=/invite/${token}`}>
                        Registrieren
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={acceptInvite}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Wird angenommen...
                    </>
                  ) : (
                    "Einladung annehmen"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {state.status === "accepted" && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                Einladung angenommen!
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Das Fahrzeug ist jetzt in deinem Dashboard sichtbar.
              </p>
              <Button asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "expired" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                Einladung abgelaufen
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Diese Einladung ist nicht mehr gültig. Bitte den
                Fahrzeug-Besitzer, dich erneut einzuladen.
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "invalid" && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive/50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                Ungültige Einladung
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Diese Einladung existiert nicht oder wurde bereits verwendet.
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "error" && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive/50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Fehler</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {state.message}
              </p>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
