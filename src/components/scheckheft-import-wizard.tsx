"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  X,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CameraCapture } from "@/components/camera-capture";
import { ImportEntryCard } from "@/components/import-entry-card";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import {
  findMileageConflicts,
  getMissingFields,
  IMPORT_FALLBACK_ERROR,
  type ImportDraftEntry,
  type ImportJob,
  type ImportQuota,
} from "@/lib/validations/scheckheft-import";

const POLL_INTERVAL_MS = 3000;
const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp";

type ChainEntry = Pick<
  ServiceEntry,
  "service_date" | "mileage_km" | "is_odometer_correction"
>;

interface ScheckheftImportWizardProps {
  vehicleId: string;
  supabaseUrl: string;
  existingEntries: ChainEntry[];
  initialJob: ImportJob | null;
  initialQuota: ImportQuota;
}

export function ScheckheftImportWizard({
  vehicleId,
  supabaseUrl,
  existingEntries,
  initialJob,
  initialQuota,
}: ScheckheftImportWizardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quota = initialQuota;
  const [job, setJob] = useState<ImportJob | null>(initialJob);
  const [files, setFiles] = useState<File[]>([]);
  const [drafts, setDrafts] = useState<ImportDraftEntry[]>(initialJob?.drafts ?? []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [corrections, setCorrections] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const status = job?.status ?? "idle";
  const isProcessing = status === "queued" || status === "running";

  // Auftrag abfragen, solange er läuft
  useEffect(() => {
    if (!job || !isProcessing) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/vehicles/${vehicleId}/scheckheft-import/${job.id}`
        );
        if (!res.ok) return;
        const updated: ImportJob = await res.json();
        setJob(updated);
        if (updated.status === "ready") {
          setDrafts(updated.drafts);
        }
      } catch {
        // Netzwerkaussetzer: beim nächsten Durchlauf erneut versuchen
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [job, isProcessing, vehicleId]);

  const conflicts = useMemo(() => {
    const selectedDrafts = drafts.filter(
      (d) => selected.has(d.id) && !corrections.has(d.id)
    );
    return findMileageConflicts(selectedDrafts, existingEntries);
  }, [drafts, selected, corrections, existingEntries]);

  const selectedDrafts = useMemo(
    () => drafts.filter((d) => selected.has(d.id)),
    [drafts, selected]
  );

  const incompleteCount = selectedDrafts.filter(
    (d) => getMissingFields(d).length > 0
  ).length;

  const canConfirm =
    selectedDrafts.length > 0 && incompleteCount === 0 && !confirming;

  const addFiles = useCallback(
    (incoming: File[]) => {
      setFiles((prev) => {
        const room = Math.max(0, quota.remaining - prev.length);
        if (room === 0) {
          toast.error("Das Kontingent für dieses Fahrzeug ist ausgeschöpft.");
          return prev;
        }
        if (incoming.length > room) {
          toast.warning(
            `Es passen noch ${room} Seiten in dein Kontingent — der Rest wurde nicht übernommen.`
          );
        }
        return [...prev, ...incoming.slice(0, room)];
      });
    },
    [quota.remaining]
  );

  const handleStart = async () => {
    if (files.length === 0) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      for (const file of files) body.append("files", file);

      const res = await fetch(`/api/vehicles/${vehicleId}/scheckheft-import`, {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error ?? "Der Import konnte nicht gestartet werden.");
        return;
      }

      const created: ImportJob = await res.json();
      setJob(created);
      setFiles([]);
      toast.success(
        "Die Auswertung läuft. Du kannst das Fenster schließen — wir sagen Bescheid."
      );
    } catch {
      toast.error("Der Import konnte nicht gestartet werden.");
    } finally {
      setSubmitting(false);
    }
  };

  const patchDraft = (id: string, patch: Partial<ImportDraftEntry>) => {
    setDrafts((prev) =>
      prev.map((draft) => {
        if (draft.id !== id) return draft;
        const origins = { ...draft.field_origins };
        for (const key of Object.keys(patch)) {
          origins[key as keyof typeof origins] = "edited";
        }
        return { ...draft, ...patch, field_origins: origins };
      })
    );
  };

  const handleConfirm = async () => {
    if (!job || !canConfirm) return;
    setConfirming(true);
    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/scheckheft-import/${job.id}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: selectedDrafts.map((draft) => ({
              ...draft,
              is_odometer_correction: corrections.has(draft.id),
            })),
          }),
        }
      );

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error ?? "Die Einträge konnten nicht übernommen werden.");
        return;
      }

      toast.success(
        selectedDrafts.length === 1
          ? "Ein Eintrag wurde ins Scheckheft übernommen."
          : `${selectedDrafts.length} Einträge wurden ins Scheckheft übernommen.`
      );
      router.push(`/vehicles/${vehicleId}/scheckheft`);
      router.refresh();
    } catch {
      toast.error("Die Einträge konnten nicht übernommen werden.");
    } finally {
      setConfirming(false);
    }
  };

  const handleDiscard = async () => {
    if (!job) {
      router.push(`/vehicles/${vehicleId}/scheckheft`);
      return;
    }
    try {
      await fetch(
        `/api/vehicles/${vehicleId}/scheckheft-import/${job.id}/discard`,
        { method: "POST" }
      );
    } catch {
      // Verwerfen ist nicht kritisch — der Auftrag verfällt ohnehin
    }
    toast.info("Der Import wurde verworfen. Es wurde kein Eintrag angelegt.");
    router.push(`/vehicles/${vehicleId}/scheckheft`);
    router.refresh();
  };

  const documentUrl = (page: number) => {
    const doc =
      job?.documents.find((d) => d.page_number === page) ?? job?.documents[0];
    if (!doc) return null;
    return `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
  };

  // ---------------------------------------------------------------- Schritt 1

  if (!job || status === "completed") {
    const exhausted = quota.remaining === 0;

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Scheckheft importieren</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fotografiere die Seiten deines Papier-Scheckhefts oder lade eine
            Werkstattrechnung hoch. Wir lesen die Angaben aus und legen sie dir zur
            Prüfung vor — gespeichert wird nichts ohne deine Bestätigung.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Badge variant={exhausted ? "destructive" : "secondary"}>
            {exhausted
              ? "Kontingent ausgeschöpft"
              : `Noch ${quota.remaining} von ${quota.limit} Seiten`}
          </Badge>
          {exhausted && (
            <span className="text-muted-foreground">
              Einträge von Hand anzulegen bleibt jederzeit möglich.
            </span>
          )}
        </div>

        {!exhausted && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <CameraCapture
                onCapture={addFiles}
                enableCrop
                maxFiles={quota.remaining}
                disabled={submitting}
              />

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">oder</span>
                <Separator className="flex-1" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Dateien wählen (PDF oder Bild)
              </Button>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {files.length} {files.length === 1 ? "Seite" : "Seiten"} bereit
                  </p>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          aria-label={`${file.name} entfernen`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/vehicles/${vehicleId}/scheckheft`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Scheckheft
          </Button>
          <Button onClick={handleStart} disabled={files.length === 0 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gestartet…
              </>
            ) : (
              "Auswertung starten"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- Schritt 2

  if (isProcessing) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Auswertung läuft</h1>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">
                {job.page_count} {job.page_count === 1 ? "Seite wird" : "Seiten werden"}{" "}
                ausgewertet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Das dauert einen Moment. Du kannst dieses Fenster schließen — wir
                benachrichtigen dich, sobald die Ergebnisse zur Prüfung bereitliegen.
              </p>
            </div>
            <Progress value={status === "running" ? 66 : 25} className="max-w-sm mx-auto" />
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/vehicles/${vehicleId}/scheckheft`)}
          >
            Zum Scheckheft
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------ Fehlgeschlagen

  if (status === "failed") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Auswertung fehlgeschlagen</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Es hat nicht geklappt</AlertTitle>
          <AlertDescription>{job.error_reason ?? IMPORT_FALLBACK_ERROR}</AlertDescription>
        </Alert>
        <Alert>
          <AlertDescription>
            Achte auf gleichmässiges Licht, halte die Seite flach und fotografiere
            möglichst gerade von oben. Dieser Versuch wurde deinem Kontingent nicht
            angerechnet.
          </AlertDescription>
        </Alert>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/vehicles/${vehicleId}/scheckheft`)}
          >
            Zum Scheckheft
          </Button>
          <Button
            onClick={() => {
              setJob(null);
              setDrafts([]);
            }}
          >
            Noch einmal versuchen
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- Schritt 3

  const url = documentUrl(activePage);
  const noResults = drafts.length === 0;

  return (
    <div className="space-y-4 pb-28">
      <div>
        <h1 className="text-xl font-semibold">Erkannte Einträge prüfen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nichts ist vorausgewählt. Hake an, was ins Scheckheft übernommen werden
          soll — und korrigiere, was falsch gelesen wurde.
        </p>
      </div>

      {noResults ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Keine Einträge erkannt</AlertTitle>
          <AlertDescription>
            Auf den hochgeladenen Seiten liess sich nichts Verwertbares finden. Das
            passiert bei unscharfen oder schrägen Aufnahmen. Versuche es mit besserem
            Licht und einer geraden Aufnahme von oben.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Beleg</p>
                  {job.documents.length > 1 && (
                    <div className="flex gap-1">
                      {job.documents.map((doc) => (
                        <Button
                          key={doc.id}
                          size="sm"
                          variant={doc.page_number === activePage ? "default" : "outline"}
                          className="h-7 w-7 p-0"
                          onClick={() => setActivePage(doc.page_number)}
                        >
                          {doc.page_number}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Hochgeladene Seite ${activePage}`}
                      className="w-full rounded-md border max-h-[60vh] object-contain bg-muted"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vorschau nicht verfügbar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {drafts.map((draft) => (
              <ImportEntryCard
                key={draft.id}
                draft={draft}
                selected={selected.has(draft.id)}
                onSelectedChange={(value) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    if (value) next.add(draft.id);
                    else next.delete(draft.id);
                    return next;
                  })
                }
                onChange={(patch) => patchDraft(draft.id, patch)}
                conflictPreviousKm={conflicts.get(draft.id)}
                markAsCorrection={corrections.has(draft.id)}
                onMarkAsCorrectionChange={(value) =>
                  setCorrections((prev) => {
                    const next = new Set(prev);
                    if (value) next.add(draft.id);
                    else next.delete(draft.id);
                    return next;
                  })
                }
                onShowSource={setActivePage}
              />
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur p-3 sm:p-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <span className="font-medium">
              {selectedDrafts.length} von {drafts.length} ausgewählt
            </span>
            {incompleteCount > 0 && (
              <span className="ml-2 text-amber-600 dark:text-amber-500">
                {incompleteCount === 1
                  ? "1 Eintrag ist unvollständig"
                  : `${incompleteCount} Einträge sind unvollständig`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDiscard} disabled={confirming}>
              Verwerfen
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird übernommen…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Übernehmen
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
