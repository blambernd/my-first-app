"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import type { CustomerNote } from "@/lib/workshop-customers";

interface VehicleCustomerCardProps {
  vehicleId: string;
  initial: CustomerNote | null;
}

/**
 * Die Kundenangabe an einem selbst angelegten Fahrzeug (PROJ-39).
 *
 * ## Wer das sieht
 *
 * Nur der Besitzer des Fahrzeugs — also die Werkstatt, die es angelegt hat.
 * Die Angaben liegen in einer eigenen Tabelle und nicht an `vehicles`, weil
 * alles am Fahrzeug auch für dessen Mitglieder lesbar wäre: Betrachter,
 * eingeladene Werkstätten und nach einer Übergabe der neue Besitzer.
 *
 * ## Warum so wenige Felder
 *
 * Name, Telefon, E-Mail — mehr braucht es nicht, um bei sechzig Fahrzeugen
 * zu wissen, wem das hier gehört. Je weniger Daten Dritter hier liegen,
 * desto kleiner die Verantwortung der Werkstatt dafür. Bei der Übergabe
 * werden sie gelöscht (PROJ-40).
 */
export function VehicleCustomerCard({
  vehicleId,
  initial,
}: VehicleCustomerCardProps) {
  const [gespeichert, setGespeichert] = useState<CustomerNote | null>(initial);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entwurf, setEntwurf] = useState<CustomerNote>({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
  });

  const speichern = async () => {
    setSaving(true);

    // Leere Felder werden zu null, damit „nichts eingetragen" und
    // „Leerzeichen eingetragen" nicht zwei verschiedene Zustände sind.
    const bereinigt: CustomerNote = {
      name: entwurf.name?.trim() || null,
      phone: entwurf.phone?.trim() || null,
      email: entwurf.email?.trim() || null,
    };

    try {
      const supabase = createClient();
      const { error } = await supabase.from("vehicle_customers").upsert(
        {
          vehicle_id: vehicleId,
          customer_name: bereinigt.name,
          customer_phone: bereinigt.phone,
          customer_email: bereinigt.email,
        },
        { onConflict: "vehicle_id" }
      );

      if (error) throw error;

      setGespeichert(bereinigt);
      setBearbeiten(false);
      toast.success("Kundenangabe gespeichert");
    } catch {
      toast.error("Kundenangabe konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  const hatAngabe = Boolean(
    gespeichert?.name || gespeichert?.phone || gespeichert?.email
  );

  if (!bearbeiten) {
    return (
      <section className="rounded-lg border p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <User className="text-muted-foreground h-4 w-4" />
            Kunde
          </h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBearbeiten(true)}
            aria-label={hatAngabe ? "Kundenangabe bearbeiten" : "Kunde hinterlegen"}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        {hatAngabe ? (
          <dl className="mt-2 space-y-1 text-sm">
            {gespeichert?.name && <dd className="font-medium">{gespeichert.name}</dd>}
            {gespeichert?.phone && (
              <dd className="text-muted-foreground">{gespeichert.phone}</dd>
            )}
            {gespeichert?.email && (
              <dd className="text-muted-foreground break-all">
                {gespeichert.email}
              </dd>
            )}
          </dl>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">
            Noch kein Kunde hinterlegt. Nur du siehst diese Angabe.
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <User className="text-muted-foreground h-4 w-4" />
          Kunde
        </h2>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEntwurf({
              name: gespeichert?.name ?? "",
              phone: gespeichert?.phone ?? "",
              email: gespeichert?.email ?? "",
            });
            setBearbeiten(false);
          }}
          aria-label="Abbrechen"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="kunde-name" className="text-xs font-normal">
            Name
          </Label>
          <Input
            id="kunde-name"
            value={entwurf.name ?? ""}
            onChange={(e) => setEntwurf({ ...entwurf, name: e.target.value })}
            placeholder="Vor- und Nachname"
            maxLength={120}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="kunde-telefon" className="text-xs font-normal">
            Telefon
          </Label>
          <Input
            id="kunde-telefon"
            type="tel"
            value={entwurf.phone ?? ""}
            onChange={(e) => setEntwurf({ ...entwurf, phone: e.target.value })}
            maxLength={40}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="kunde-email" className="text-xs font-normal">
            E-Mail
          </Label>
          <Input
            id="kunde-email"
            type="email"
            value={entwurf.email ?? ""}
            onChange={(e) => setEntwurf({ ...entwurf, email: e.target.value })}
            placeholder="Für die spätere Übergabe"
            maxLength={200}
          />
        </div>

        <Button onClick={speichern} disabled={saving} size="sm" className="w-full">
          {saving ? "Wird gespeichert…" : "Speichern"}
        </Button>

        <p className="text-muted-foreground text-xs">
          Diese Angaben siehst nur du. Sie werden nicht mitübertragen, wenn du
          das Fahrzeug an den Kunden übergibst.
        </p>
      </div>
    </section>
  );
}
