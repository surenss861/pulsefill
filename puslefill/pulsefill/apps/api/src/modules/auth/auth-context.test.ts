import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveAuthSurfaces } from "./auth-context.js";

describe("deriveAuthSurfaces", () => {
  it("customer only → customer", () => {
    assert.deepEqual(deriveAuthSurfaces({ customer: true, staff: false }), {
      allowed_surfaces: ["customer"],
      default_surface: "customer",
    });
  });

  it("staff only → business", () => {
    assert.deepEqual(deriveAuthSurfaces({ customer: false, staff: true }), {
      allowed_surfaces: ["business"],
      default_surface: "business",
    });
  });

  it("dual role → picker", () => {
    assert.deepEqual(deriveAuthSurfaces({ customer: true, staff: true }), {
      allowed_surfaces: ["customer", "business"],
      default_surface: "picker",
    });
  });

  it("neither role → none", () => {
    assert.deepEqual(deriveAuthSurfaces({ customer: false, staff: false }), {
      allowed_surfaces: [],
      default_surface: "none",
    });
  });
});
