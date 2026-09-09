import { describe, expect, it } from "vitest"
import { coachHint, gradePlay, resolveShop } from "./coach.ts"
import { createTestState } from "./state.ts"
import { isLegalAction } from "./validators.ts"

describe("coach", () => {
  it("returns a legal balanced action", () => {
    const state = createTestState({
      prices: [5, 3, 3, 3, 3],
      hands: [
        [3, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
      current: 0,
    })
    const hint = coachHint(state, 0)
    expect(isLegalAction(state, hint.action)).toBe(true)
    expect(hint.principle.length).toBeGreaterThan(10)
    expect(hint.move.length).toBeGreaterThan(3)
  })

  it("recommends dumping a hot stack and grades agreement", () => {
    const state = createTestState({
      prices: [6, 3, 3, 3, 3],
      hands: [
        [3, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
    })
    const hint = coachHint(state, 0)
    expect(hint.action.type).toBe("dump")
    expect(hint.move).toMatch(/Dump/)
    expect(gradePlay(hint, { type: "dump", line: 0, count: 3 }, state)).toBe("Coach agrees.")
  })

  it("grades a different action against the coach", () => {
    const state = createTestState({
      prices: [6, 3, 3, 3, 3],
      hands: [
        [3, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
    })
    const hint = coachHint(state, 0)
    const grade = gradePlay(hint, { type: "laundromat" }, state)
    expect(grade.startsWith("Coach would have")).toBe(true)
    expect(grade).toMatch(/Laundromat/)
  })

  it("resolves row shop steps by line, not index", () => {
    const state = createTestState({
      row: [2, 2, 0, 1, 3, 4],
      prices: [3, 3, 2, 3, 3],
      coins: [8, 9, 10],
    })
    const steps = resolveShop(state, [{ source: "row", index: 0 }])
    expect(steps).toEqual([{ source: "row", line: 2 }])
  })
})
