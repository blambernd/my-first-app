import Link from "next/link";
import { CalendarCheck, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DUE_HORIZON_DAYS,
  formatDate,
  formatDueDistance,
  isOverdue,
  type WorkshopDue,
} from "@/lib/workshop-dashboard";

interface WorkshopDueListProps {
  dues: WorkshopDue[];
  /** Stichtag als ISO-Datum, serverseitig gesetzt (PROJ-37) */
  today: string;
}

/**
 * Anstehende Arbeiten über alle Kundenfahrzeuge hinweg (PROJ-37).
 *
 * Überfällige stehen oben, weil die Liste aufsteigend nach Datum sortiert ist
 * — dafür braucht es keine Sonderbehandlung. Gekennzeichnet werden sie
 * doppelt: durch die Farbe und durch den Text daneben. Wer die Seite in
 * Graustufen oder mit einer Farbfehlsichtigkeit liest, verliert die
 * Information sonst vollständig.
 */
export function WorkshopDueList({ dues, today }: WorkshopDueListProps) {
  const reference = new Date(`${today}T00:00:00Z`);
  const overdueCount = dues.filter((d) => isOverdue(d.dueDate, reference)).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          Anstehende Arbeiten
        </CardTitle>
        {overdueCount > 0 && (
          <Badge variant="destructive">
            {overdueCount} überfällig
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {dues.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Keine Termine in den nächsten {DUE_HORIZON_DAYS} Tagen.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {dues.map((due, index) => {
              const overdue = isOverdue(due.dueDate, reference);

              return (
                <li key={`${due.vehicleId}-${due.dueDate}-${due.label}-${index}`}>
                  <Link
                    href={`/vehicles/${due.vehicleId}`}
                    className="flex flex-col gap-1 py-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{due.vehicleLabel}</p>
                      <p className="text-sm text-muted-foreground">{due.label}</p>
                    </div>

                    <div className="flex items-center gap-3 sm:justify-end">
                      <span
                        className={
                          overdue
                            ? "text-sm font-medium text-destructive"
                            : "text-sm text-muted-foreground"
                        }
                      >
                        {formatDueDistance(due.dueDate, reference)}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatDate(due.dueDate)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
