import { describe, expect, it } from "vitest"
import { applyAction, playTurn } from "./rules.ts"
import { createTestState } from "./state.ts"
import { IllegalActionError } from "./types.ts"
import { isLegalAction } from "./validators.ts"

describe("dump pricing", () => {
  it("dump at price 5 with 3 cards pays 15 and drops price to 2", () => {
    const state = createTestState({
      prices: [5, 3, 3, 3, 3],
      hands: [[3, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, { type: "dump", line: 0, count: 3 })
    expect(next.coins[0]).toBe(8 + 15)
    expect(next.prices[0]).toBe(2)
    expect(next.hands[0]![0]).toBe(0)
    expect(next.receipts[0]![0]).toBe(3)
  })

  it("dump at price 0 pays 0 and leaves price at 0", () => {
    const state = createTestState({
      prices: [0, 3, 3, 3, 3],
      hands: [[2, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, { type: "dump", line: 0, count: 2 })
    expect(next.coins[0]).toBe(8)
    expect(next.prices[0]).toBe(0)
  })

  it("dumping 5 cards at price 3 sets price to 0 not -2", () => {
    const state = createTestState({
      prices: [3, 3, 3, 3, 3],
      hands: [[5, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, { type: "dump", line: 0, count: 5 })
    expect(next.coins[0]).toBe(8 + 15)
    expect(next.prices[0]).toBe(0)
  })

  it("dump of 1 card is one action", () => {
    const state = createTestState({
      prices: [4, 3, 3, 3, 3],
      hands: [[2, 1, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
      coins: [8, 9, 10],
    })
    const next = playTurn(state, { type: "dump", line: 0, count: 1 })
    expect(next.turnsTaken).toBe(1)
    expect(next.current).toBe(1)
    expect(next.hands[0]![0]).toBe(1)
    expect(next.receipts[0]![0]).toBe(1)
  })

  it("dump of all cards of one line empties that hand slot", () => {
    const state = createTestState({
      hands: [[4, 2, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
    })
    const next = applyAction(state, { type: "dump", line: 0, count: 4 })
    expect(next.hands[0]![0]).toBe(0)
    expect(next.hands[0]![1]).toBe(2)
  })

  it("dump of a line you do not hold is illegal", () => {
    const state = createTestState({
      hands: [[0, 3, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
    })
    expect(isLegalAction(state, { type: "dump", line: 0, count: 1 })).toBe(false)
    expect(() => applyAction(state, { type: "dump", line: 0, count: 1 })).toThrow(IllegalActionError)
  })

  it("dump with 0 of the chosen line is illegal", () => {
    const state = createTestState({
      hands: [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
    })
    expect(isLegalAction(state, { type: "dump", line: 1, count: 1 })).toBe(false)
  })

  it("dump pays first then crashes — opponent holding same line sees value drop", () => {
    const state = createTestState({
      prices: [5, 3, 3, 3, 3],
      hands: [
        [2, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, { type: "dump", line: 0, count: 2 })
    expect(next.coins[0]).toBe(8 + 10)
    expect(next.prices[0]).toBe(3)
    expect(next.hands[1]![0]).toBe(1)
    const oppValueBefore = 1 * 5
    const oppValueAfter = 1 * 3
    expect(oppValueAfter).toBeLessThan(oppValueBefore)
  })
})
