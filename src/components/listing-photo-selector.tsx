"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ImageIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Photo {
  id: string;
  storage_path: string;
  label: string;
  source: "vehicle" | "milestone";
}

interface ListingPhotoSelectorProps {
  photos: Photo[];
  selectedIds: string[];
  photoOrder: string[];
  onSelectionChange: (ids: string[]) => void;
  onOrderChange: (order: string[]) => void;
}

function getImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function SortablePhoto({
  photo,
  index,
}: {
  photo: Photo;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-md overflow-hidden bg-muted/30 aspect-square group"
    >
      <img
        src={getImageUrl(photo.storage_path)}
        alt={photo.label}
        className="w-full h-full object-cover"
      />
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-black/50 rounded p-0.5 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-white" />
      </div>
      <Badge
        variant="secondary"
        className="absolute top-1 right-1 text-xs px-1.5 py-0"
      >
        {index + 1}
      </Badge>
      {index === 0 && (
        <Badge className="absolute bottom-1 left-1 text-xs px-1.5 py-0">
          Titelbild
        </Badge>
      )}
    </div>
  );
}

export function ListingPhotoSelector({
  photos,
  selectedIds,
  photoOrder,
  onSelectionChange,
  onOrderChange,
}: ListingPhotoSelectorProps) {
  const [showAll, setShowAll] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const togglePhoto = (id: string) => {
    if (selectedIds.includes(id)) {
      const newSelected = selectedIds.filter((x) => x !== id);
      onSelectionChange(newSelected);
      onOrderChange(photoOrder.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
      onOrderChange([...photoOrder, id]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photoOrder.indexOf(active.id as string);
      const newIndex = photoOrder.indexOf(over.id as string);
      onOrderChange(arrayMove(photoOrder, oldIndex, newIndex));
    }
  };

  // Sort selected photos by order
  const orderedSelectedPhotos = photoOrder
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as Photo[];

  const unselectedPhotos = photos.filter((p) => !selectedIds.includes(p.id));

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        <p>Keine Fotos vorhanden.</p>
        <p className="text-xs mt-1">
          Inserate mit Fotos erzielen deutlich höhere Aufmerksamkeit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected photos with drag & drop ordering */}
      {orderedSelectedPhotos.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {orderedSelectedPhotos.length} Foto{orderedSelectedPhotos.length !== 1 ? "s" : ""} ausgewählt
            — ziehen zum Sortieren
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photoOrder}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {orderedSelectedPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative">
                    <SortablePhoto photo={photo} index={index} />
                    <button
                      type="button"
                      onClick={() => togglePhoto(photo.id)}
                      className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Unselected photos */}
      {unselectedPhotos.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-muted-foreground hover:text-foreground mb-2 underline"
          >
            {showAll
              ? `Verfügbare Fotos ausblenden (${unselectedPhotos.length})`
              : `Weitere Fotos anzeigen (${unselectedPhotos.length})`}
          </button>
          {showAll && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {unselectedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-md overflow-hidden bg-muted/30 aspect-square cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => togglePhoto(photo.id)}
                >
                  <img
                    src={getImageUrl(photo.storage_path)}
                    alt={photo.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Checkbox
                      checked={false}
                      className="bg-white/80"
                    />
                  </div>
                  {photo.source === "milestone" && (
                    <Badge
                      variant="outline"
                      className="absolute top-1 right-1 text-[10px] px-1 py-0 bg-white/80"
                    >
                      Historie
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
