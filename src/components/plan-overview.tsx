"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Sparkles, ExternalLink } from "lucide-react";
import { UpgradeDialog } from "@/components/upgrade-dialog";

const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === "true";

export function PlanOverview() {
  const { data, loading, isPremium, isTrial, trialDaysLeft } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isBetaMode) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const vehiclePercent =
    data.limits.maxVehicles === Infinity
      ? 0
      : Math.round((data.vehicleCount / data.limits.maxVehicles) * 100);

  const storagePercent =
    data.limits.maxStorageMb === Infinity
      ? 0
      : Math.round(((data.storageMb ?? 0) / data.limits.maxStorageMb) * 100);

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
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
              Dein Plan
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
          {/* Trial countdown */}
          {isTrial && trialDaysLeft !== null && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
              <span className="font-medium text-amber-800">
                {trialDaysLeft > 0
                  ? `Dein Trial endet in ${trialDaysLeft} ${trialDaysLeft === 1 ? "Tag" : "Tagen"}`
                  : "Dein Trial ist abgelaufen"}
              </span>
              <span className="text-amber-700"> — </span>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="text-amber-800 underline font-medium hover:text-amber-900"
              >
                jetzt upgraden
              </button>
            </div>
          )}

          {/* Cancel notice */}
          {data.cancelAtPeriodEnd && data.currentPeriodEnd && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
              Dein Abo endet am{" "}
              {new Date(data.currentPeriodEnd).toLocaleDateString("de-DE")}.
              Danach wirst du auf den Free-Plan herabgestuft.
            </div>
          )}

          {/* Vehicle usage */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Fahrzeuge</span>
              <span className="font-medium">
                {data.vehicleCount} /{" "}
                {data.limits.maxVehicles === Infinity
                  ? "∞"
                  : data.limits.maxVehicles}
              </span>
            </div>
            {data.limits.maxVehicles !== Infinity && (
              <Progress value={vehiclePercent} className="h-2" />
            )}
          </div>

          {/* Storage usage */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Speicher</span>
              <span className="font-medium">
                {data.storageMb ?? 0} MB /{" "}
                {data.limits.maxStorageMb === Infinity
                  ? "∞"
                  : data.limits.maxStorageMb >= 1024
                    ? `${(data.limits.maxStorageMb / 1024).toFixed(0)} GB`
                    : `${data.limits.maxStorageMb} MB`}
              </span>
            </div>
            {data.limits.maxStorageMb !== Infinity && (
              <Progress value={storagePercent} className="h-2" />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!isPremium ? (
              <Button
                onClick={() => setUpgradeOpen(true)}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600"
              >
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                Upgrade auf Premium
              </Button>
            ) : data.stripeCustomerId ? (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Abo verwalten
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
