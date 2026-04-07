"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Car,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandLogoWithText } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase";

interface TransferInfo {
  vehicleName: string;
  fromEmail: string;
  expiresAt: string;
  keepAsViewer: boolean;
}

type TransferState =
  | { status: "loading" }
  | { status: "valid"; info: TransferInfo }
  | { status: "accepted" }
  | { status: "declined" }
  | { status: "expired" }
  | { status: "invalid" }
  | { status: "error"; message: string }
  | { status: "needs_auth"; info: TransferInfo };

export default function TransferAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<TransferState>({ status: "loading" });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTransfer();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTransfer() {
    try {
      const res = await fetch(`/api/transfers/${token}`);
      const data = await res.json();

      if (!res.ok || data.status === "invalid") {
        setState({ status: "invalid" });
        return;
      }

      if (data.status === "accepted") {
        setState({ status: "accepted" });
        return;
      }

      if (data.status === "declined") {
        setState({ status: "declined" });
        return;
      }

      if (data.status === "expired") {
        setState({ status: "expired" });
        return;
      }

      const info: TransferInfo = {
        vehicleName: data.vehicleName,
        fromEmail: data.fromEmail,
        expiresAt: data.expiresAt,
        keepAsViewer: data.keepAsViewer,
      };

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "needs_auth", info });
        return;
      }

      setState({ status: "valid", info });
    } catch {
      setState({
        status: "error",
        message: "Transfer konnte nicht geladen werden",
      });
    }
  }

  async function handleAccept() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/transfers/${token}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Transfer konnte nicht angenommen werden");
      }

      setState({ status: "accepted" });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Ein Fehler ist aufgetreten",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDecline() {
    setProcessing(true);
    try {
      const res = await fetch(`/api/transfers/${token}/decline`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Transfer konnte nicht abgelehnt werden");
      }

      setState({ status: "declined" });
    } catch {
      setState({
        status: "error",
        message: "Fehler beim Ablehnen des Transfers",
      });
    } finally {
      setProcessing(false);
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
                Transfer wird geladen...
              </p>
            </CardContent>
          </Card>
        )}

        {(state.status === "valid" || state.status === "needs_auth") && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Fahrzeug-Transfer</CardTitle>
              <CardDescription>
                Du wurdest als neuer Besitzer eines Fahrzeugs vorgeschlagen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fahrzeug</span>
                  <span className="font-medium">{state.info.vehicleName}</span>
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
                    Melde dich an oder registriere dich, um den Transfer
                    anzunehmen.
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/login?redirect=/transfer/${token}`}>
                        Anmelden
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/register?redirect=/transfer/${token}`}>
                        Registrieren
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={handleAccept}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Wird verarbeitet...
                      </>
                    ) : (
                      "Transfer annehmen"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleDecline}
                    disabled={processing}
                  >
                    Ablehnen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {state.status === "accepted" && (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                Transfer abgeschlossen!
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Das Fahrzeug gehört jetzt dir. Du findest es in deinem Dashboard.
              </p>
              <Button asChild>
                <Link href="/dashboard">Zum Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {state.status === "declined" && (
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                Transfer abgelehnt
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Du hast den Transfer abgelehnt. Der bisherige Besitzer wurde
                benachrichtigt.
              </p>
              <Button variant="outline" asChild>
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
                Transfer abgelaufen
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Dieser Transfer-Link ist nicht mehr gültig. Bitte den
                Fahrzeug-Besitzer, einen neuen Transfer zu starten.
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
                Ungültiger Transfer
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Dieser Transfer-Link existiert nicht oder wurde bereits
                verwendet.
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
