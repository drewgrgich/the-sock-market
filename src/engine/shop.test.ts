import { describe, expect, it } from "vitest"
import { applyAction, applyPurchase, finishShop, firstRowIndexOf } from "./rules.ts"
import { checkInvariants, createTestState } from "./state.ts"
import { IllegalActionError } from "./types.ts"
import { canShop, isLegalAction } from "./validators.ts"

describe("shop resolution", () => {
  it("row buy at price 3 pays 3, raises price to 4, then refills row to 6", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [2, 2, 2],
      prices: [3, 3, 3, 3, 3],
      coins: [8, 9, 10],
    })
    const idx = firstRowIndexOf(state, 0)
    const next = applyAction(state, { type: "shop", purchases: [{ source: "row", index: idx }] })
    expect(next.coins[0]).toBe(5)
    expect(next.prices[0]).toBe(4)
    expect(next.hands[0]![0]).toBe(1)
    expect(next.row.length).toBe(6)
    expect(next.bin.length).toBe(2)
    checkInvariants(next)
  })

  it("two row buys of the same line cost 3 then 4; price ends at 5", () => {
    const state = createTestState({
      row: [0, 0, 1, 2, 3, 4],
      bin: [1, 1, 1, 1],
      prices: [3, 3, 3, 3, 3],
      coins: [10, 9, 10],
    })
    const first = firstRowIndexOf(state, 0)
    const afterFirstRow = state.row.slice()
    afterFirstRow.splice(first, 1)
    afterFirstRow.push(state.bin[state.bin.length - 1]!)
    const second = afterFirstRow.indexOf(0)
    const next = applyAction(state, {
      type: "shop",
      purchases: [
        { source: "row", index: first },
        { source: "row", index: second },
      ],
    })
    expect(next.coins[0]).toBe(10 - 3 - 4)
    expect(next.prices[0]).toBe(5)
    expect(next.hands[0]![0]).toBe(2)
  })

  it("row buy at price 9 pays 9 and price stays 9", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [2, 2],
      prices: [9, 3, 3, 3, 3],
      coins: [9, 9, 10],
    })
    const next = applyAction(state, {
      type: "shop",
      purchases: [{ source: "row", index: firstRowIndexOf(state, 0) }],
    })
    expect(next.coins[0]).toBe(0)
    expect(next.prices[0]).toBe(9)
  })

  it("row buy at price 0 pays 0 and price ticks to 1", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [2, 2],
      prices: [0, 3, 3, 3, 3],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, {
      type: "shop",
      purchases: [{ source: "row", index: firstRowIndexOf(state, 0) }],
    })
    expect(next.coins[0]).toBe(8)
    expect(next.prices[0]).toBe(1)
  })

  it("bin buy pays 2, takes top card, price unchanged", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [4, 3],
      prices: [3, 3, 3, 3, 3],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, { type: "shop", purchases: [{ source: "bin" }] })
    expect(next.coins[0]).toBe(6)
    expect(next.hands[0]![3]).toBe(1)
    expect(next.prices).toEqual([3, 3, 3, 3, 3])
    expect(next.bin).toEqual([4])
  })

  it("two bin buys cost 4 and both cards go to hand", () => {
    const state = createTestState({
      bin: [1, 2, 3],
      coins: [8, 9, 10],
    })
    const next = applyAction(state, {
      type: "shop",
      purchases: [{ source: "bin" }, { source: "bin" }],
    })
    expect(next.coins[0]).toBe(4)
    expect(next.hands[0]![3]).toBe(1)
    expect(next.hands[0]![2]).toBe(1)
    expect(next.bin).toEqual([1])
  })

  it("mixed row + bin: row resolves and refills before bin buy", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [4, 2],
      prices: [3, 3, 3, 3, 3],
      coins: [10, 9, 10],
    })
    const topBefore = state.bin[state.bin.length - 1]
    expect(topBefore).toBe(2)
    const next = applyAction(state, {
      type: "shop",
      purchases: [{ source: "row", index: firstRowIndexOf(state, 0) }, { source: "bin" }],
    })
    expect(next.hands[0]![0]).toBe(1)
    expect(next.row).toContain(2)
    expect(next.hands[0]![4]).toBe(1)
    expect(next.coins[0]).toBe(10 - 3 - 2)
    expect(next.bin.length).toBe(0)
  })

  it("shop with no affordable row and empty bin is illegal", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [],
      prices: [3, 3, 3, 3, 3],
      coins: [0, 9, 10],
    })
    expect(canShop(state, 0)).toBe(false)
    expect(isLegalAction(state, { type: "shop", purchases: [{ source: "row", index: 0 }] })).toBe(false)
    expect(() => applyAction(state, { type: "shop", purchases: [{ source: "row", index: 0 }] })).toThrow(
      IllegalActionError,
    )
  })

  it("two-step shop: first purchase refills before the second, then finishShop ends the turn", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [4, 2],
      prices: [3, 3, 3, 3, 3],
      coins: [10, 9, 10],
      consecLaundromat: 2,
    })
    const afterFirst = applyPurchase(state, { source: "row", index: 0 })
    expect(afterFirst.current).toBe(0)
    expect(afterFirst.row.length).toBe(6)
    expect(afterFirst.row).toContain(2)
    const afterSecond = applyPurchase(afterFirst, { source: "bin" })
    const done = finishShop(afterSecond)
    expect(done.current).toBe(1)
    expect(done.consecLaundromat).toBe(0)
    expect(done.turnsTaken).toBe(1)
  })

  it("late-game row stays smaller than 6 when bin cannot refill", () => {
    const state = createTestState({
      row: [0, 1, 2],
      bin: [],
      prices: [3, 3, 3, 3, 3],
      coins: [8, 9, 10],
      inFinal: false,
    })
    const next = applyAction(state, {
      type: "shop",
      purchases: [{ source: "row", index: firstRowIndexOf(state, 0) }],
    })
    expect(next.row.length).toBe(2)
    expect(next.row).toEqual([1, 2])
    expect(next.hands[0]![0]).toBe(1)
  })
})
