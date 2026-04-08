"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Share2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  SECTION_LABELS,
  type VehicleProfile,
  type ProfileConfig,
  type ProfileSections,
} from "@/lib/validations/vehicle-profile";

interface ProfileConfiguratorProps {
  vehicleId: string;
  images: { id: string; storage_path: string; position: number }[];
  serviceEntries: { id: string; description: string; service_date: string }[];
  milestones: { id: string; title: string; milestone_date: string }[];
  documents: { id: string; title: string; category: string }[];
}

export function ProfileConfigurator({
  vehicleId,
  images,
  serviceEntries,
  milestones,
  documents,
}: ProfileConfiguratorProps) {
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const [sections, setSections] = useState<ProfileSections>({
    stammdaten: true,
    fotos: true,
    scheckheft: true,
    meilensteine: true,
    dokumente: true,
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedServiceEntries, setSelectedServiceEntries] = useState<string[]>([]);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/profile`);
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        const config = data.profile.config as ProfileConfig;
        setSections(config.sections);
        setSelectedImages(config.selected_images);
        setSelectedServiceEntries(config.selected_service_entries);
        setSelectedMilestones(config.selected_milestones);
        setSelectedDocuments(config.selected_documents);
      }
    } catch {
      toast.error("Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/profile`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      const config = data.profile.config as ProfileConfig;
      setSections(config.sections);
      toast.success("Kurzprofil erstellt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const config: ProfileConfig = {
        sections,
        selected_images: selectedImages,
        selected_service_entries: selectedServiceEntries,
        selected_milestones: selectedMilestones,
        selected_documents: selectedDocuments,
      };
      const res = await fetch(`/api/vehicles/${vehicleId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      toast.success("Profil gespeichert");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    id: string
  ) => {
    setList(
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
    );
  };

  const toggleAllItems = (
    items: { id: string }[],
    list: string[],
    setList: (v: string[]) => void
  ) => {
    if (list.length === items.length) {
      setList([]);
    } else {
      setList(items.map((i) => i.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No profile yet — show create button
  if (!profile) {
    return (
      <div className="text-center py-12">
        <Share2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">Kurzprofil erstellen</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Erstelle ein öffentliches Kurzprofil deines Fahrzeugs, das du per Link
          mit potenziellen Käufern teilen kannst.
        </p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Kurzprofil erstellen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sichtbare Abschnitte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(SECTION_LABELS) as (keyof ProfileSections)[]).map(
            (key) => (
              <div key={key}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {sections[key] ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      {SECTION_LABELS[key]}
                    </span>
                  </div>
                  <Switch
                    checked={sections[key]}
                    onCheckedChange={(checked) =>
                      setSections((s) => ({ ...s, [key]: checked }))
                    }
                  />
                </div>

                {/* Per-item selection when section is enabled */}
                {sections[key] && key === "fotos" && images.length > 0 && (
                  <ItemSelector
                    items={images.map((img) => ({
                      id: img.id,
                      label: `Foto ${img.position + 1}`,
                    }))}
                    selected={selectedImages}
                    setSelected={setSelectedImages}
                    toggleItem={toggleItem}
                    toggleAll={toggleAllItems}
                    emptyLabel="alle Fotos"
                  />
                )}
                {sections[key] &&
                  key === "scheckheft" &&
                  serviceEntries.length > 0 && (
                    <ItemSelector
                      items={serviceEntries.map((e) => ({
                        id: e.id,
                        label: `${e.description} (${new Date(e.service_date).toLocaleDateString("de-DE")})`,
                      }))}
                      selected={selectedServiceEntries}
                      setSelected={setSelectedServiceEntries}
                      toggleItem={toggleItem}
                      toggleAll={toggleAllItems}
                      emptyLabel="alle Einträge"
                    />
                  )}
                {sections[key] &&
                  key === "meilensteine" &&
                  milestones.length > 0 && (
                    <ItemSelector
                      items={milestones.map((m) => ({
                        id: m.id,
                        label: `${m.title} (${new Date(m.milestone_date).toLocaleDateString("de-DE")})`,
                      }))}
                      selected={selectedMilestones}
                      setSelected={setSelectedMilestones}
                      toggleItem={toggleItem}
                      toggleAll={toggleAllItems}
                      emptyLabel="alle Meilensteine"
                    />
                  )}
                {sections[key] &&
                  key === "dokumente" &&
                  documents.length > 0 && (
                    <ItemSelector
                      items={documents.map((d) => ({
                        id: d.id,
                        label: `${d.title} (${d.category})`,
                      }))}
                      selected={selectedDocuments}
                      setSelected={setSelectedDocuments}
                      toggleItem={toggleItem}
                      toggleAll={toggleAllItems}
                      emptyLabel="alle Dokumente"
                    />
                  )}

                <Separator />
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Änderungen speichern
        </Button>
      </div>
    </div>
  );
}

function ItemSelector({
  items,
  selected,
  setSelected,
  toggleItem,
  toggleAll,
  emptyLabel,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  setSelected: (v: string[]) => void;
  toggleItem: (list: string[], setList: (v: string[]) => void, id: string) => void;
  toggleAll: (items: { id: string }[], list: string[], setList: (v: string[]) => void) => void;
  emptyLabel: string;
}) {
  const allSelected = selected.length === 0;

  return (
    <div className="ml-6 mb-3 space-y-1.5">
      <p className="text-xs text-muted-foreground mb-2">
        {allSelected
          ? `Zeigt ${emptyLabel}`
          : `${selected.length} von ${items.length} ausgewählt`}
      </p>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          checked={allSelected}
          onCheckedChange={() => {
            if (!allSelected) {
              setSelected([]);
            } else {
              toggleAll(items, selected, setSelected);
            }
          }}
        />
        <span className="text-muted-foreground">
          Alle anzeigen
        </span>
      </label>
      {!allSelected && (
        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-sm cursor-pointer py-0.5"
            >
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={() =>
                  toggleItem(selected, setSelected, item.id)
                }
              />
              <span className="truncate">{item.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
