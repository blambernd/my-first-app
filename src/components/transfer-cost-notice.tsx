import { Download, Eye, FileSpreadsheet, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  describeStock,
  hasAnything,
  type CostStock,
} from "@/lib/transfer-costs";

interface TransferCostNoticeProps {
  vehicleId: string;
  stock: CostStock;
}

/**
 * Was beim Annehmen des Transfers aus dem Fahrzeug verschwindet (PROJ-32).
 *
 * Steht **vor** dem Absenden, weil der Vorbesitzer danach nichts mehr sichern
 * kann: Beim Annehmen sind die Beträge weg. Der Abschnitt bleibt auch bei
 * einem bereits offenen Transfer stehen — solange nicht angenommen wurde, ist
 * der Export noch möglich.
 */
export function TransferCostNotice({
  vehicleId,
  stock,
}: TransferCostNoticeProps) {
  // Ohne jede Kostenerfassung gibt es nichts zu verlieren. Der Abschnitt
  // erschiene sonst als Warnung vor einem Verlust, den es nicht gibt.
  if (!hasAnything(stock)) {
    return null;
  }

  const posten = describeStock(stock);
  const nurBetrag = posten.filter((p) => p.onlyAmount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kostendaten</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">
            Beim Annehmen wird aus dem Fahrzeug entfernt:
          </p>
          <ul className="mt-2 space-y-1">
            {posten.map((p) => (
              <li
                key={p.label}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {nurBetrag.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Die Historie bleibt vollständig.</strong> Bei Scheckheft
              und Tankbuch verschwindet nur der Betrag — Datum, Kilometerstand,
              Beschreibung, Werkstatt, Liter und die verknüpften Dokumente
              bleiben unverändert beim Fahrzeug. Genau dafür ist die Übergabe
              da.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Das gilt auch, wenn du als Betrachter im Fahrzeug bleibst: Die
            Beträge werden <strong>gelöscht</strong>, nicht nur ausgeblendet.
            Auch du siehst sie danach nicht mehr.
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium">Vorher sichern</p>
                <p className="text-sm text-muted-foreground">
                  Lade deine Kostendaten als Tabelle herunter, bevor du
                  überträgst. Sie enthält genau die Beträge, die entfernt
                  werden — mit Datum und Bezeichnung, zum Weiterrechnen in
                  Excel oder einem anderen Programm. Entfernt ist entfernt: Es
                  gibt keine Wiederherstellung.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                {/* Kein next/link: Der Browser soll die Antwort herunterladen,
                    nicht als Seite zu öffnen versuchen. */}
                <a href={`/api/vehicles/${vehicleId}/kosten-export`} download>
                  <Download className="mr-2 h-4 w-4" />
                  Kostendaten als Tabelle sichern
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
