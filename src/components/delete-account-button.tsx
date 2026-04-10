"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CONFIRM_TEXT = "LÖSCHEN";

export function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [open, setOpen] = useState(false);

  const canDelete = confirmInput === CONFIRM_TEXT;

  async function handleDelete() {
    if (!canDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Löschen");
      }
      toast.success("Account gelöscht");
      window.location.href = "/";
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fehler beim Löschen des Accounts"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmInput(""); }}>
      <AlertDialogTrigger asChild>
        <button className="w-full text-left px-2 py-1.5 text-sm text-destructive flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Account löschen
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Account unwiderruflich löschen?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Alle deine Fahrzeuge, Einträge, Dokumente und Fotos werden
              endgültig gelöscht. Diese Aktion kann nicht rückgängig gemacht
              werden.
            </span>
            <span className="block font-medium">
              Tippe <strong>{CONFIRM_TEXT}</strong> ein, um zu bestätigen:
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={CONFIRM_TEXT}
          autoComplete="off"
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="h-4 w-4 mr-1.5" />
            Account löschen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
