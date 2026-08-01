import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { VehicleGallery, type GalleryImage } from "./vehicle-gallery";

function makeImages(count: number): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    url: `https://example.test/bild-${i}.jpg`,
  }));
}

const NAME = "Mercedes-Benz SL380";

function mainImage(): HTMLImageElement {
  const button = screen.getByRole("button", {
    name: "Bild formatfüllend anzeigen",
  });
  return within(button).getByRole("img") as HTMLImageElement;
}

describe("VehicleGallery", () => {
  it("zeigt einen Platzhalter, wenn kein Bild vorhanden ist", () => {
    render(<VehicleGallery images={[]} vehicleName={NAME} />);

    expect(
      screen.queryByRole("button", { name: "Bild formatfüllend anzeigen" })
    ).not.toBeInTheDocument();
  });

  it("zeigt bei einem einzelnen Bild keine Thumbnail-Leiste", () => {
    render(<VehicleGallery images={makeImages(1)} vehicleName={NAME} />);

    expect(mainImage()).toHaveAttribute("src", "https://example.test/bild-0.jpg");
    expect(screen.queryByLabelText(/Bild 1 von/)).not.toBeInTheDocument();
  });

  it("tauscht das Hauptbild beim Klick auf ein Thumbnail", async () => {
    render(<VehicleGallery images={makeImages(4)} vehicleName={NAME} />);

    expect(mainImage()).toHaveAttribute("src", "https://example.test/bild-0.jpg");

    fireEvent.click(screen.getByLabelText("Bild 3 von 4 anzeigen"));

    expect(mainImage()).toHaveAttribute("src", "https://example.test/bild-2.jpg");
  });

  it("markiert das aktive Thumbnail für Screenreader", async () => {
    render(<VehicleGallery images={makeImages(3)} vehicleName={NAME} />);

    expect(screen.getByLabelText("Bild 1 von 3 anzeigen")).toHaveAttribute(
      "aria-current",
      "true"
    );

    fireEvent.click(screen.getByLabelText("Bild 2 von 3 anzeigen"));

    expect(screen.getByLabelText("Bild 2 von 3 anzeigen")).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(screen.getByLabelText("Bild 1 von 3 anzeigen")).toHaveAttribute(
      "aria-current",
      "false"
    );
  });

  it("öffnet die Vollbildansicht beim Klick auf das Hauptbild", async () => {
    render(<VehicleGallery images={makeImages(2)} vehicleName={NAME} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Bild formatfüllend anzeigen" })
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("1 von 2")).toBeInTheDocument();
  });

  it("blättert in der Vollbildansicht vorwärts und läuft am Ende um", async () => {
    render(<VehicleGallery images={makeImages(3)} vehicleName={NAME} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Bild formatfüllend anzeigen" })
    );
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByLabelText("Nächstes Bild"));
    expect(screen.getByText("2 von 3")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByLabelText("Nächstes Bild"));
    fireEvent.click(within(dialog).getByLabelText("Nächstes Bild"));
    expect(screen.getByText("1 von 3")).toBeInTheDocument();
  });

  it("läuft beim Zurückblättern vom ersten auf das letzte Bild", async () => {
    render(<VehicleGallery images={makeImages(3)} vehicleName={NAME} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Bild formatfüllend anzeigen" })
    );
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByLabelText("Vorheriges Bild"));
    expect(screen.getByText("3 von 3")).toBeInTheDocument();
  });

  it("zeigt in der Vollbildansicht keine Blätter-Schalter bei nur einem Bild", async () => {
    render(<VehicleGallery images={makeImages(1)} vehicleName={NAME} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Bild formatfüllend anzeigen" })
    );
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).queryByLabelText("Nächstes Bild")).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Vorheriges Bild")).not.toBeInTheDocument();
  });
});
