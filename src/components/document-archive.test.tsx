import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentArchive } from "./document-archive";
import type { VehicleDocument } from "@/lib/validations/vehicle-document";
import type { VehicleMilestoneWithImages } from "@/lib/validations/milestone";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({}),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/document-upload-form", () => ({
  DocumentUploadForm: () => null,
}));

const SUPABASE_URL = "https://example.test";

function makeDoc(overrides: Partial<VehicleDocument> = {}): VehicleDocument {
  return {
    id: "doc-1",
    vehicle_id: "veh-1",
    title: "TÜV-Bericht 2024",
    category: "tuev_bericht",
    document_date: "2024-03-12",
    description: null,
    storage_path: "veh-1/tuev.pdf",
    file_name: "tuev.pdf",
    file_size: 1_200_000,
    mime_type: "application/pdf",
    service_entry_id: null,
    milestone_id: null,
    created_by: "user-1",
    created_at: "2024-03-12T00:00:00Z",
    updated_at: "2024-03-12T00:00:00Z",
    ...overrides,
  };
}

function makeMilestone(): VehicleMilestoneWithImages {
  return {
    id: "ms-1",
    vehicle_id: "veh-1",
    title: "Lackierung abgeschlossen",
    category: "restauration",
    milestone_date: "2023-05-14",
    description: null,
    created_at: "2023-05-14T00:00:00Z",
    updated_at: "2023-05-14T00:00:00Z",
    vehicle_milestone_images: [
      {
        id: "msimg-1",
        milestone_id: "ms-1",
        storage_path: "veh-1/lack.jpg",
        position: 0,
        caption: "Frisch lackiert",
        created_at: "2023-05-14T00:00:00Z",
      },
    ],
  } as unknown as VehicleMilestoneWithImages;
}

const DOCS: VehicleDocument[] = [
  makeDoc(),
  makeDoc({
    id: "doc-2",
    title: "Rechnung Getriebe",
    category: "rechnung",
    document_date: "2024-01-04",
    file_name: "rechnung-getriebe.pdf",
    file_size: 840_000,
  }),
  makeDoc({
    id: "doc-3",
    title: "Motor nach Revision",
    category: "sonstiges",
    document_date: "2023-11-22",
    storage_path: "veh-1/motor.jpg",
    file_name: "motor.jpg",
    file_size: 3_100_000,
    mime_type: "image/jpeg",
    description: "Zylinderkopf geplant",
  }),
];

function setup(props: Partial<Parameters<typeof DocumentArchive>[0]> = {}) {
  return render(
    <DocumentArchive
      vehicleId="veh-1"
      initialDocuments={DOCS}
      serviceEntries={[]}
      milestones={[makeMilestone()]}
      supabaseUrl={SUPABASE_URL}
      userId="user-1"
      {...props}
    />
  );
}

/**
 * Titel der aktuell im Raster sichtbaren Karten, in Reihenfolge.
 * Nur die Kartenüberschrift trägt ein title-Attribut.
 */
function visibleTitles(): string[] {
  return Array.from(document.querySelectorAll("p[title]")).map(
    (el) => el.getAttribute("title")!
  );
}

/**
 * Radix aktiviert Reiter im Automatikmodus über den Fokus, nicht über den Klick.
 * Ein reines fireEvent.click würde den Reiter nicht umschalten.
 */
function selectTab(name: string) {
  const trigger = screen.getByRole("tab", { name });
  trigger.focus();
  fireEvent.focus(trigger);
  fireEvent.click(trigger);
}

describe("DocumentArchive", () => {
  it("zählt alle Quellen in der Kopfzeile zusammen", () => {
    setup();

    // 3 Dokumente + 1 Historie-Bild
    expect(screen.getByText(/4 Dateien/)).toBeInTheDocument();
    // 1 Bild-Dokument + 1 Historie-Bild
    expect(screen.getByText(/2 Bilder/)).toBeInTheDocument();
    expect(screen.getByText(/2 PDF/)).toBeInTheDocument();
  });

  it("beschriftet die Reiter mit den jeweiligen Anzahlen", () => {
    setup();

    expect(screen.getByRole("tab", { name: "Alle 4" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dokumente 2" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Bilder 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Historie 1" })).toBeInTheDocument();
  });

  it("zeigt im Reiter 'Alle' Dokumente, Bilder und Historie gemeinsam", () => {
    setup();

    expect(visibleTitles()).toContain("TÜV-Bericht 2024");
    expect(visibleTitles()).toContain("Motor nach Revision");
    expect(visibleTitles()).toContain("Lackierung abgeschlossen");
  });

  it("beschränkt den Reiter 'Dokumente' auf Nicht-Bilder", () => {
    setup();

    selectTab("Dokumente 2");

    expect(visibleTitles()).toContain("TÜV-Bericht 2024");
    expect(visibleTitles()).not.toContain("Motor nach Revision");
    expect(visibleTitles()).not.toContain("Lackierung abgeschlossen");
  });

  it("beschränkt den Reiter 'Historie' auf Meilenstein-Bilder", () => {
    setup();

    selectTab("Historie 1");

    expect(visibleTitles()).toEqual(["Lackierung abgeschlossen"]);
  });

  it("durchsucht Titel", () => {
    setup();

    fireEvent.change(screen.getByLabelText("Dokumente durchsuchen"), {
      target: { value: "getriebe" },
    });

    expect(visibleTitles()).toEqual(["Rechnung Getriebe"]);
  });

  it("durchsucht auch Dateinamen und Beschreibungen", () => {
    setup();

    fireEvent.change(screen.getByLabelText("Dokumente durchsuchen"), {
      target: { value: "zylinderkopf" },
    });
    expect(visibleTitles()).toEqual(["Motor nach Revision"]);

    fireEvent.change(screen.getByLabelText("Dokumente durchsuchen"), {
      target: { value: "rechnung-getriebe.pdf" },
    });
    expect(visibleTitles()).toEqual(["Rechnung Getriebe"]);
  });

  it("meldet einen Leerzustand, wenn die Suche nichts findet", () => {
    setup();

    fireEvent.change(screen.getByLabelText("Dokumente durchsuchen"), {
      target: { value: "gibtesnicht" },
    });

    expect(
      screen.getByText("Nichts gefunden. Passe Suche oder Filter an.")
    ).toBeInTheDocument();
  });

  it("zeigt den Erst-Leerzustand, wenn gar nichts hinterlegt ist", () => {
    setup({ initialDocuments: [], milestones: [] });

    expect(
      screen.getByText("Noch keine Dokumente. Lade das erste Dokument hoch.")
    ).toBeInTheDocument();
  });

  it("blendet die Hochladen-Schaltfläche für Betrachter aus", () => {
    setup({ canEdit: false });

    expect(screen.queryByRole("button", { name: /Hochladen/ })).not.toBeInTheDocument();
  });

  it("bietet Historie-Bildern kein Löschen an", () => {
    setup();

    selectTab("Historie 1");

    expect(
      screen.queryByLabelText("Lackierung abgeschlossen löschen")
    ).not.toBeInTheDocument();
  });

  it("bietet Dokumenten Herunterladen und Löschen an", () => {
    setup();

    selectTab("Dokumente 2");

    expect(screen.getByLabelText("TÜV-Bericht 2024 herunterladen")).toBeInTheDocument();
    expect(screen.getByLabelText("TÜV-Bericht 2024 löschen")).toBeInTheDocument();
  });
});
