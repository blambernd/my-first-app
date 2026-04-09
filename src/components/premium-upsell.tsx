"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check, Lock } from "lucide-react";
import { UpgradeDialog } from "@/components/upgrade-dialog";

interface PremiumUpsellProps {
  feature: string;
  description: string;
}

const benefits = [
  "Unbegrenzte Fahrzeuge anlegen",
  "5 GB Speicher für Dokumente & Fotos",
  "Verkaufsassistent mit Marktpreis-Analyse",
  "PDF-Export und Kurzprofil-Sharing",
  "Prioritäts-Support",
];

export function PremiumUpsell({ feature, description }: PremiumUpsellProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full border-amber-200">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>

            <h2 className="text-xl font-bold mb-2">{feature}</h2>
            <p className="text-muted-foreground mb-6">{description}</p>

            <div className="text-left mx-auto max-w-xs mb-6">
              <p className="text-sm font-medium mb-3">
                Mit Premium bekommst du:
              </p>
              <ul className="space-y-2">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setUpgradeOpen(true)}
              className="bg-amber-500 hover:bg-amber-600"
              size="lg"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade auf Premium — ab 4,99 €/Monat
            </Button>
          </CardContent>
        </Card>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
