import { describe, expect, it } from "vitest";
import { Result } from "./result";

describe("Result", () => {
  describe("sequenceRecord", () => {
    it("should return Ok({}) when given an empty object", () => {
      const result = Result.sequenceRecord({});

      expect(result.unwrap()).toEqual({});
    });

    it("should return correct shape when given record of Oks", () => {
      const result = Result.sequenceRecord({
        a: Result.Ok(1),
        b: Result.Ok(2),
        c: Result.Ok(3),
      });

      expect(result.unwrap()).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("should return first error when given record of Errs", () => {
      const result = Result.sequenceRecord({
        a: Result.Ok(1),
        b: Result.Err("b"),
        c: Result.Err("c"),
      });

      expect(result.unwrapErr()).toEqual("b");
    });
  });
});
