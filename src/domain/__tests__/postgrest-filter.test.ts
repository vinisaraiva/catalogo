import { describe, expect, it } from "vitest";
import { escapePostgrestFilterValue } from "../postgrest-filter";

describe("escapePostgrestFilterValue", () => {
  it("wraps a plain value in double quotes", () => {
    expect(escapePostgrestFilterValue("%flamengo%")).toBe('"%flamengo%"');
  });

  it("escapes a comma so it can't be read as a filter separator", () => {
    expect(escapePostgrestFilterValue("%retrô, 1994%")).toBe('"%retrô, 1994%"');
  });

  it("escapes parentheses", () => {
    expect(escapePostgrestFilterValue("%time (reserva)%")).toBe('"%time (reserva)%"');
  });

  it("escapes an embedded double quote", () => {
    expect(escapePostgrestFilterValue('%"special"%')).toBe('"%\\"special\\"%"');
  });

  it("escapes an embedded backslash before escaping quotes", () => {
    expect(escapePostgrestFilterValue("%a\\b%")).toBe('"%a\\\\b%"');
  });
});
