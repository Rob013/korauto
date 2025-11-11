import { describe, expect, it } from "vitest";
import { resolveFuelFromSources, localizeFuel } from "@/utils/fuel";

describe("resolveFuelFromSources", () => {
  it("normalizes direct fuel strings", () => {
    const result = resolveFuelFromSources({ fuel: "diesel" });
    expect(result).toBe("Diesel");
  });

  it("detects fuel inside specification arrays with localized labels", () => {
    const source = {
      specifications: [
        { label: "Karburant", value: "Benzin" },
        { label: "Transmisioni", value: "Automatik" },
      ],
    };

    const result = resolveFuelFromSources(source);
    expect(result).toBe("Gasoline");
    expect(localizeFuel(result, "sq")).toBe("Benzin");
  });

  it("finds fuel from deeply nested technical specifications", () => {
    const source = {
      details: {
        technicalSpecifications: {
          performance: {
            horsepower: "180",
          },
          fuelType: "Diesel",
        },
      },
    };

    expect(resolveFuelFromSources(source)).toBe("Diesel");
  });

  it("extracts fuel from summary spec entries with mixed casing keys", () => {
    const source = {
      summary: {
        specs: [
          { name: "Karburanti", data: "LPG" },
          { name: "Ngjyra", data: "E zezë" },
        ],
      },
    };

    const result = resolveFuelFromSources(source);
    expect(result).toBe("LPG");
  });

  it("falls back to later sources when earlier ones are empty", () => {
    const emptySource = {};
    const attributesSource = {
      attributes: {
        fuel: "Electric",
      },
    };

    expect(resolveFuelFromSources(emptySource, attributesSource)).toBe("Electric");
  });
});

