import assert from "node:assert/strict";
import test from "node:test";

import { DIRECTORY_PUBLIC_BLURB, resolveDirectoryDisplayFields } from "./customer-directory.service.js";

test("resolveDirectoryDisplayFields uses public overrides when set", () => {
  const out = resolveDirectoryDisplayFields({
    name: "Legal Name LLC",
    category: "Internal",
    public_display_name: "Yorkville Wellness",
    public_description: "Custom blurb.",
    public_category: "Wellness clinic",
    public_city: "Toronto",
    public_neighborhood: "Yorkville",
    public_website: "https://example.com",
    public_phone: "+1 416-555-0100",
    public_logo_url: "https://cdn.example/logo.png",
    public_cover_image_url: "https://cdn.example/cover.png",
    public_join_note: "Same-day hygiene visits.",
    fallbackLocation: { name: "Main", city: "Mississauga" },
    fallbackBlurb: DIRECTORY_PUBLIC_BLURB,
  });
  assert.equal(out.name, "Yorkville Wellness");
  assert.equal(out.category, "Wellness clinic");
  assert.equal(out.city, "Toronto");
  assert.equal(out.neighborhood, "Yorkville");
  assert.equal(out.description, "Custom blurb.");
  assert.equal(out.website, "https://example.com");
  assert.equal(out.phone, "+1 416-555-0100");
  assert.equal(out.logo_url, "https://cdn.example/logo.png");
  assert.equal(out.cover_image_url, "https://cdn.example/cover.png");
  assert.equal(out.join_note, "Same-day hygiene visits.");
});

test("resolveDirectoryDisplayFields falls back to internal name, category, location, blurb", () => {
  const out = resolveDirectoryDisplayFields({
    name: "North Toronto Dental",
    category: "Dental",
    public_display_name: null,
    public_description: null,
    public_category: null,
    public_city: null,
    public_neighborhood: null,
    public_website: null,
    public_phone: null,
    public_logo_url: null,
    public_cover_image_url: null,
    public_join_note: null,
    fallbackLocation: { name: "Yorkville", city: "Toronto" },
    fallbackBlurb: DIRECTORY_PUBLIC_BLURB,
  });
  assert.equal(out.name, "North Toronto Dental");
  assert.equal(out.category, "Dental");
  assert.equal(out.city, "Toronto");
  assert.equal(out.neighborhood, "Yorkville");
  assert.equal(out.description, DIRECTORY_PUBLIC_BLURB);
  assert.equal(out.website, null);
  assert.equal(out.phone, null);
});

test("resolveDirectoryDisplayFields trims whitespace-only overrides", () => {
  const out = resolveDirectoryDisplayFields({
    name: "Fallback Name",
    category: null,
    public_display_name: "   ",
    public_description: "\n\t",
    public_category: "  ",
    public_city: "  ",
    public_neighborhood: "",
    public_website: null,
    public_phone: null,
    public_logo_url: null,
    public_cover_image_url: null,
    public_join_note: null,
    fallbackLocation: { name: "Queen West", city: null },
    fallbackBlurb: "BLURB",
  });
  assert.equal(out.name, "Fallback Name");
  assert.equal(out.category, null);
  assert.equal(out.neighborhood, "Queen West");
  assert.equal(out.description, "BLURB");
});
