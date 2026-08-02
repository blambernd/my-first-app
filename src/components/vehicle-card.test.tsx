import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VehicleCard } from "./vehicle-card";
import type { VehicleWithImages } from "@/lib/validations/vehicle";

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.test/${path}` },
        }),
      }),
    },
  }),
}));

function makeVehicle(overrides: Partial<VehicleWithImages> = {}): VehicleWithImages {
  return {
    id: "veh-1",
    user_id: "user-1",
    make: "Porsche",
    model: "911",
    year: 1973,
    year_estimated: false,
    first_registration_date: null,
    vin: null,
    license_plate: null,
    body_type: null,
    factory_code: null,
    color: null,
    engine_type: null,
    displacement_ccm: null,
    horsepower: null,
    mileage_km: null,
    mileage_date: null,
    condition_grade: null,
    insurance_company: null,
    insurance_policy_number: null,
    is_locked: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    vehicle_images: [],
    ...overrides,
  };
}

describe("VehicleCard — Gesperrt-Badge (BUG-4)", () => {
  it("zeigt das Badge im Free-Plan, wenn das Fahrzeug gesperrt ist", () => {
    render(<VehicleCard vehicle={makeVehicle({ is_locked: true })} hasPremium={false} />);
    expect(screen.getByText("Gesperrt")).toBeInTheDocument();
  });

  it("versteckt das Badge bei Premium-Zugriff trotz gesetztem is_locked", () => {
    render(<VehicleCard vehicle={makeVehicle({ is_locked: true })} hasPremium={true} />);
    expect(screen.queryByText("Gesperrt")).not.toBeInTheDocument();
  });

  it("zeigt kein Badge, wenn das Fahrzeug nicht gesperrt ist", () => {
    render(<VehicleCard vehicle={makeVehicle({ is_locked: false })} hasPremium={false} />);
    expect(screen.queryByText("Gesperrt")).not.toBeInTheDocument();
  });

  it("behandelt ein fehlendes hasPremium-Prop als Free-Plan", () => {
    render(<VehicleCard vehicle={makeVehicle({ is_locked: true })} />);
    expect(screen.getByText("Gesperrt")).toBeInTheDocument();
  });

  it("rendert weiterhin Fahrzeugdaten und Link", () => {
    render(<VehicleCard vehicle={makeVehicle({ license_plate: "S-PO 911H" })} hasPremium />);
    expect(screen.getByText("Porsche 911")).toBeInTheDocument();
    expect(screen.getByText("S-PO 911H")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/vehicles/veh-1");
  });
});
