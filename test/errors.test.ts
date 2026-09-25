import { describe, expect, it } from "vitest";
import { errorMessageFromBody, ManrsError } from "../src/errors";

describe("ManrsError", () => {
  it("carries the status code and body", () => {
    const err = new ManrsError("boom", 404, { title: "Not Found" });
    expect(err.message).toBe("boom");
    expect(err.statusCode).toBe(404);
    expect(err.body).toEqual({ title: "Not Found" });
    expect(err.name).toBe("ManrsError");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ManrsError);
  });

  it("defaults status code and body when omitted", () => {
    const err = new ManrsError("boom");
    expect(err.statusCode).toBe(0);
    expect(err.body).toEqual({});
  });
});

describe("errorMessageFromBody", () => {
  it("prefers detail over title", () => {
    expect(errorMessageFromBody({ title: "Not Found", detail: "Participant not found" }, 404)).toBe(
      "Participant not found (HTTP 404)",
    );
  });

  it("falls back to title when detail is missing", () => {
    expect(errorMessageFromBody({ title: "Not Found" }, 404)).toBe("Not Found (HTTP 404)");
  });

  it("falls back to a bare status code when there is no title or detail", () => {
    expect(errorMessageFromBody({}, 500)).toBe("HTTP 500");
  });

  it("appends validation errors with their path", () => {
    const message = errorMessageFromBody(
      { detail: "Validation failed", errors: [{ message: "invalid id", path: "/id" }] },
      422,
    );
    expect(message).toBe("Validation failed (HTTP 422): invalid id (at /id)");
  });

  it("appends validation errors with their location, the key this API reports", () => {
    const message = errorMessageFromBody(
      {
        detail: "validation failed",
        errors: [{ message: "unexpected property", location: "body.favorite" }],
      },
      422,
    );
    expect(message).toBe("validation failed (HTTP 422): unexpected property (at body.favorite)");
  });

  it("joins multiple errors with a semicolon", () => {
    const message = errorMessageFromBody(
      {
        detail: "Validation failed",
        errors: [{ message: "invalid id" }, { message: "invalid name" }],
      },
      422,
    );
    expect(message).toBe("Validation failed (HTTP 422): invalid id; invalid name");
  });
});
