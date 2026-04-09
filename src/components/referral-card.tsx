"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Check, Copy, Users, Clock } from "lucide-react";

interface ReferralData {
  referralCode: string;
  completedCount: number;
  pendingCount: number;
  bonusMonths: number;
}

const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === "true";

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReferral() {
      try {
        const res = await fetch("/api/referral");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchReferral();
  }, []);

  if (isBetaMode) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${data.referralCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          Freunde einladen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Empfiehl Oldtimer Docs und erhalte <strong>3 Monate Premium</strong> pro
          erfolgreicher Einladung.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono truncate">
            {referralLink}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            aria-label="Link kopieren"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{data.completedCount}</strong>{" "}
              erfolgreich
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              <strong className="text-foreground">{data.pendingCount}</strong>{" "}
              offen
            </span>
          </div>
        </div>

        {data.bonusMonths > 0 && (
          <div className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {data.bonusMonths} Bonus-Monate verdient
          </div>
        )}
      </CardContent>
    </Card>
  );
}
