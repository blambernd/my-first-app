import { describe, it, expect } from "vitest";
import { vehicleSchema } from "./vehicle";

const validVehicle = {
  make: "Mercedes-Benz",
  model: "300 SL",
  year: 1955,
  year_estimated: false,
};

describe("vehicleSchema — required fields", () => {
  it("accepts valid required fields", () => {
    const result = vehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it("rejects empty make", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, make: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty model", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, model: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing year", () => {
    const { year: _, ...noYear } = validVehicle;
    const result = vehicleSchema.safeParse(noYear);
    expect(result.success).toBe(false);
  });

  it("rejects make longer than 100 characters", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, make: "A".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects model longer than 100 characters", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, model: "A".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("vehicleSchema — year validation", () => {
  it("accepts year 1886 (earliest valid)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: 1886 });
    expect(result.success).toBe(true);
  });

  it("accepts current year", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: new Date().getFullYear() });
    expect(result.success).toBe(true);
  });

  it("rejects year before 1886", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: 1885 });
    expect(result.success).toBe(false);
  });

  it("rejects year in the future", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: new Date().getFullYear() + 1 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer year", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: 1955.5 });
    expect(result.success).toBe(false);
  });

  it("coerces string year to number", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year: "1955" });
    expect(result.success).toBe(true);
  });
});

describe("vehicleSchema — VIN validation", () => {
  it("accepts valid 17-character VIN", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: "WDB1980361A123456" });
    expect(result.success).toBe(true);
  });

  it("accepts empty VIN (optional)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: "" });
    expect(result.success).toBe(true);
  });

  it("accepts missing VIN (optional)", () => {
    const result = vehicleSchema.safeParse(validVehicle);
    expect(result.success).toBe(true);
  });

  it("accepts VIN with any length (no minimum)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: "WDB198036" });
    expect(result.success).toBe(true);
  });

  it("rejects VIN with forbidden characters (I, O, Q)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: "WDB198036IA12345I" });
    expect(result.success).toBe(false);
  });

  it("rejects VIN with special characters", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, vin: "WDB1980361A1234-!" });
    expect(result.success).toBe(false);
  });
});

describe("vehicleSchema — optional string fields", () => {
  it("accepts all optional fields filled", () => {
    const result = vehicleSchema.safeParse({
      ...validVehicle,
      license_plate: "S-OL 1955H",
      color: "Silber Metallic",
      engine_type: "Reihen-6-Zylinder Benziner",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all optional fields empty", () => {
    const result = vehicleSchema.safeParse({
      ...validVehicle,
      license_plate: "",
      color: "",
      engine_type: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects license_plate longer than 15 characters", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, license_plate: "A".repeat(16) });
    expect(result.success).toBe(false);
  });

  it("rejects color longer than 50 characters", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, color: "A".repeat(51) });
    expect(result.success).toBe(false);
  });
});

describe("vehicleSchema — optional numeric fields", () => {
  it("accepts valid displacement, horsepower, mileage", () => {
    const result = vehicleSchema.safeParse({
      ...validVehicle,
      displacement_ccm: 2996,
      horsepower: 215,
      mileage_km: 85000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for numeric fields (form default)", () => {
    const result = vehicleSchema.safeParse({
      ...validVehicle,
      displacement_ccm: "",
      horsepower: "",
      mileage_km: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts mileage of 0", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, mileage_km: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects negative mileage", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, mileage_km: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects zero horsepower (must be positive)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, horsepower: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects zero displacement (must be positive)", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, displacement_ccm: 0 });
    expect(result.success).toBe(false);
  });
});

describe("vehicleSchema — year_estimated flag", () => {
  it("defaults to false when not provided", () => {
    const { year_estimated: _, ...withoutFlag } = validVehicle;
    const result = vehicleSchema.safeParse(withoutFlag);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.year_estimated).toBe(false);
    }
  });

  it("accepts true value", () => {
    const result = vehicleSchema.safeParse({ ...validVehicle, year_estimated: true });
    expect(result.success).toBe(true);
  });
});
