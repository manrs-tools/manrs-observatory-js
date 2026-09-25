import { describe, expect, it } from "vitest";
import { Client } from "../../src/client";
import { createMockFetch } from "../test-utils";

const TESTIMONIAL_DATA = {
  attribution: "Alice, CEO",
  body: "Great service!",
  name: "Alice Corp",
  participantID: "part-001",
  showcase: true,
};

describe("TestimonialsResource", () => {
  it("find() unwraps the `testimonials` envelope", async () => {
    const { fetch, calls } = createMockFetch([{ body: { testimonials: [TESTIMONIAL_DATA] } }]);
    const client = new Client({ fetch });

    const testimonials = await client.testimonials.find();

    expect(testimonials).toEqual([TESTIMONIAL_DATA]);
    expect(calls[0]!.url).toBe("https://observatory.manrs.org/api/v2/testimonials");
  });

  it("find(filter) sends filter params", async () => {
    const { fetch, calls } = createMockFetch([{ body: { testimonials: [] } }]);
    const client = new Client({ fetch });

    await client.testimonials.find({ showcase: true, participantID: "part-001" });

    expect(calls[0]!.url).toContain("showcase=true");
    expect(calls[0]!.url).toContain("participantID=part-001");
  });

  it("find() returns an empty list when there are no testimonials", async () => {
    const { fetch } = createMockFetch([{ body: { testimonials: [] } }]);
    const client = new Client({ fetch });

    const testimonials = await client.testimonials.find();

    expect(testimonials).toEqual([]);
  });

  it("findPaged() iterates across pages and forwards the page token", async () => {
    const { fetch, calls } = createMockFetch([
      { body: { testimonials: [TESTIMONIAL_DATA], nextPageToken: "tok2" } },
      { body: { testimonials: [] } },
    ]);
    const client = new Client({ fetch });

    const pages = await client.testimonials.findPaged().toArray();

    expect(pages).toEqual([TESTIMONIAL_DATA]);
    expect(calls[1]!.url).toContain("pageToken=tok2");
  });
});
