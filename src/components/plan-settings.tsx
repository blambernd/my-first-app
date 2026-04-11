"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Sparkles, ExternalLink, Gift, Loader2 } from "lucide-react";
import { UpgradeDialog } from "@/components/upgrade-dialog";

const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === "true";
const isMvpMode = process.env.NEXT_PUBLIC_MVP_MODE === "true";

export function PlanSettings() {
  const { data, loading, isPremium } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  if (isBetaMode) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const bonusMonths = data.referralBonusMonths ?? 0;
  const bonusUntil = data.referralBonusUntil ? new Date(data.referralBonusUntil) : null;
  const bonusActive = bonusUntil && bonusUntil > new Date();

  // Calculate remaining months using calendar month difference
  let bonusMonthsRemaining = 0;
  if (bonusActive) {
    const now = new Date();
    bonusMonthsRemaining = (bonusUntil.getFullYear() - now.getFullYear()) * 12
      + (bonusUntil.getMonth() - now.getMonth());
    if (bonusUntil.getDate() > now.getDate()) bonusMonthsRemaining++;
    bonusMonthsRemaining = Math.max(0, Math.min(bonusMonthsRemaining, bonusMonths));
  }
  const bonusMonthsUsed = bonusMonths - bonusMonthsRemaining;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Kundenportal konnte nicht geöffnet werden.");
      }
    } catch {
      alert("Verbindungsfehler. Bitte versuche es erneut.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {isPremium ? (
                <Crown className="h-4 w-4 text-amber-500" />
              ) : (
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              )}
              Mein Plan
            </CardTitle>
            <Badge
              variant={isPremium ? "default" : "secondary"}
              className={isPremium ? "bg-amber-500 hover:bg-amber-600" : ""}
            >
              {data.plan === "trial"
                ? "Trial"
                : data.plan === "premium"
                  ? "Premium"
                  : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fahrzeuge</span>
              <span className="font-medium">
                {data.vehicleCount}
                {data.limits.maxVehicles === -1
                  ? " (unbegrenzt)"
                  : ` / ${data.limits.maxVehicles}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Speicher</span>
              <span className="font-medium">
                {data.storageMb ?? 0} MB
                {data.limits.maxStorageMb === -1
                  ? " / 5 GB"
                  : ` / ${data.limits.maxStorageMb} MB`}
              </span>
            </div>
          </div>

          {/* Renewal / cancel info */}
          {isPremium && data.currentPeriodEnd && !data.cancelAtPeriodEnd && data.stripeCustomerId && (
            <p className="text-xs text-muted-foreground">
              Nächste Verlängerung: {new Date(data.currentPeriodEnd).toLocaleDateString("de-DE")}
            </p>
          )}
          {data.cancelAtPeriodEnd && data.currentPeriodEnd && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              Dein Abo endet am{" "}
              {new Date(data.currentPeriodEnd).toLocaleDateString("de-DE")}.
            </div>
          )}

          {/* Referral Bonus Section */}
          {bonusMonths > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4 text-primary" />
                Empfehlungs-Bonus
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Verdient</span>
                  <p className="font-medium">{bonusMonths} {bonusMonths === 1 ? "Monat" : "Monate"}</p>
                </div>
                {bonusActive ? (
                  <div>
                    <span className="text-muted-foreground">Verbleibend</span>
                    <p className="font-medium text-green-600">
                      {bonusMonthsRemaining} {bonusMonthsRemaining === 1 ? "Monat" : "Monate"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium text-muted-foreground">Aufgebraucht</p>
                  </div>
                )}
              </div>
              {bonusActive && (
                <p className="text-xs text-muted-foreground">
                  Aktiv bis {bonusUntil.toLocaleDateString("de-DE")}
                  {bonusMonthsUsed > 0 && ` (${bonusMonthsUsed} ${bonusMonthsUsed === 1 ? "Monat" : "Monate"} verbraucht)`}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {isPremium && data.stripeCustomerId && (
            <Button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {portalLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              )}
              Abo verwalten
            </Button>
          )}

          {!isPremium && (
            <Button
              onClick={() => setUpgradeOpen(true)}
              size="sm"
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              {isMvpMode ? "Premium — Coming Soon" : "Upgrade auf Premium"}
            </Button>
          )}
        </CardContent>
      </Card>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
