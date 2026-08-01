import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { ImageLightbox, type LightboxImage } from "./image-lightbox";

function makeImages(count: number): LightboxImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    url: `https://example.test/bild-${i}.jpg`,
    title: `Bild ${i}`,
  }));
}

describe("ImageLightbox", () => {
  it("rendert nichts, solange kein Index gesetzt ist", () => {
    render(
      <ImageLightbox
        images={makeImages(3)}
        index={null}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rendert nichts, wenn es keine Bilder gibt", () => {
    render(
      <ImageLightbox images={[]} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("zeigt das Bild am übergebenen Index samt Zähler", async () => {
    render(
      <ImageLightbox
        images={makeImages(4)}
        index={2}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "src",
      "https://example.test/bild-2.jpg"
    );
    expect(screen.getByText("3 von 4")).toBeInTheDocument();
  });

  it("meldet den nächsten Index beim Vorwärtsblättern", async () => {
    const onIndexChange = vi.fn();
    render(
      <ImageLightbox
        images={makeImages(3)}
        index={0}
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Nächstes Bild"));

    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it("läuft am Ende auf das erste Bild um", async () => {
    const onIndexChange = vi.fn();
    render(
      <ImageLightbox
        images={makeImages(3)}
        index={2}
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Nächstes Bild"));

    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("läuft am Anfang auf das letzte Bild um", async () => {
    const onIndexChange = vi.fn();
    render(
      <ImageLightbox
        images={makeImages(3)}
        index={0}
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByLabelText("Vorheriges Bild"));

    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it("blättert per Pfeiltasten", async () => {
    const onIndexChange = vi.fn();
    render(
      <ImageLightbox
        images={makeImages(3)}
        index={1}
        onIndexChange={onIndexChange}
        onClose={vi.fn()}
      />
    );
    await screen.findByRole("dialog");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenCalledWith(2);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it("zeigt weder Blätter-Schalter noch Zähler bei einem einzelnen Bild", async () => {
    render(
      <ImageLightbox
        images={makeImages(1)}
        index={0}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Nächstes Bild")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Vorheriges Bild")).not.toBeInTheDocument();
    expect(screen.queryByText("1 von 1")).not.toBeInTheDocument();
  });

  it("zeigt die Bildunterschrift, wenn vorhanden", async () => {
    render(
      <ImageLightbox
        images={[
          {
            id: "a",
            url: "https://example.test/a.jpg",
            title: "Motor",
            caption: "Motor nach der Revision",
          },
        ]}
        index={0}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText("Motor nach der Revision")).toBeInTheDocument();
  });

  it("fängt einen Index ab, der über die Bildzahl hinausgeht", async () => {
    // Kann auftreten, wenn ein Bild gelöscht wird, während die Ansicht offen ist.
    render(
      <ImageLightbox
        images={makeImages(2)}
        index={5}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "src",
      "https://example.test/bild-1.jpg"
    );
  });
});
