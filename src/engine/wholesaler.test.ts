import { describe, expect, it } from "vitest"
import { resolveOrderCard } from "./wholesaler.ts"
import { createTestState } from "./state.ts"
import { setupGame } from "./state.ts"
import { runGame } from "./play.ts"

describe("wholesaler order cards", () => {
  it("BULK ORDER buys 1 of the HOT line at trade price and still raises the track", () => {
    const state = createTestState({
      prices: [3, 5, 3, 3, 3],
      row: [1, 0, 2, 3, 4, 0],
      coins: [9, 9, 9],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "BULK_ORDER")
    expect(next.hands[1]![1]).toBe(1)
    expect(next.coins[1]).toBe(9 - 4)
    expect(next.prices[1]).toBe(6)
  })

  it("BULK ORDER unaffordable HOT falls back to highest affordable row card", () => {
    const state = createTestState({
      prices: [3, 9, 4, 3, 3],
      row: [1, 2, 0, 3, 4, 0],
      coins: [3, 3, 8],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "BULK_ORDER")
    expect(next.hands[1]![2]).toBe(1)
    expect(next.coins[1]).toBe(3 - 3)
    expect(next.prices[2]).toBe(5)
  })

  it("BARGAIN HUNT buys 2 of COLD, re-checking between purchases", () => {
    const state = createTestState({
      prices: [2, 5, 5, 5, 5],
      row: [0, 0, 1, 2, 3, 4],
      bin: [1, 1, 1, 1],
      coins: [9, 9, 9],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "BARGAIN_HUNT")
    expect(next.hands[1]![0]).toBe(2)
    expect(next.prices[0]).toBe(4)
  })

  it("BACK ROOM buys 2 from the Bin at 2 coins each into Stash", () => {
    const state = createTestState({
      bin: [4, 3],
      coins: [9, 9, 9],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "BACK_ROOM")
    expect(next.bin.length).toBe(0)
    expect(next.coins[1]).toBe(5)
    expect(next.hands[1]![3]).toBe(1)
    expect(next.hands[1]![4]).toBe(1)
  })

  it("BACK ROOM with empty Bin buys 1 cheapest affordable Row card", () => {
    const state = createTestState({
      prices: [4, 2, 5, 5, 5],
      row: [0, 1, 2, 3, 4, 0],
      bin: [],
      coins: [9, 9, 9],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "BACK_ROOM")
    expect(next.hands[1]![1]).toBe(1)
    expect(next.prices[1]).toBe(3)
  })

  it("CASH OUT sells the entire priciest held stack at full market price", () => {
    const state = createTestState({
      prices: [3, 5, 3, 3, 3],
      hands: [
        [0, 0, 0, 0, 0],
        [1, 4, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "CASH_OUT")
    expect(next.coins[1]).toBe(9 + 20)
    expect(next.hands[1]![1]).toBe(0)
    expect(next.receipts[1]![1]).toBe(4)
    expect(next.prices[1]).toBe(1)
  })

  it("CASH OUT on a price-0 stack resolves as BARGAIN HUNT", () => {
    const state = createTestState({
      prices: [0, 0, 0, 0, 0],
      hands: [
        [0, 0, 0, 0, 0],
        [2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      row: [0, 1, 2, 3, 4, 1],
      bin: [2, 2],
      coins: [8, 9, 10],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "CASH_OUT")
    expect(next.receipts[1]![0]).toBe(0)
    expect((next.hands[1] ?? []).reduce((a, b) => a + b, 0)).toBeGreaterThan(2)
  })

  it("FLOOD sells the entire BIGGEST stack", () => {
    const state = createTestState({
      prices: [4, 4, 4, 4, 4],
      hands: [
        [0, 0, 0, 0, 0],
        [1, 3, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "FLOOD")
    expect(next.hands[1]![1]).toBe(0)
    expect(next.receipts[1]![1]).toBe(3)
    expect(next.coins[1]).toBe(9 + 12)
  })

  it("CLEARS THE FLOOR sells every stack priciest-first and skips price-0", () => {
    const state = createTestState({
      prices: [4, 0, 6, 3, 3],
      hands: [
        [0, 0, 0, 0, 0],
        [1, 2, 1, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      coins: [8, 9, 10],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "CLEARS_THE_FLOOR")
    expect(next.hands[1]![1]).toBe(2)
    expect(next.hands[1]![2]).toBe(0)
    expect(next.hands[1]![0]).toBe(0)
    expect(next.receipts[1]![2]).toBe(1)
    expect(next.receipts[1]![0]).toBe(1)
  })

  it("empty Stash on a selling card resolves as BARGAIN HUNT", () => {
    const state = createTestState({
      hands: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      prices: [3, 2, 5, 4, 4],
      row: [1, 0, 2, 3, 4, 0],
      bin: [2, 2],
      coins: [8, 9, 10],
      current: 1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    const next = resolveOrderCard(state, "CASH_OUT")
    expect((next.hands[1] ?? []).reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
  })

  it("Wholesaler starts with 9 coins on a 1-human table", () => {
    const state = setupGame({
      seed: "w9",
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "wholesaler", style: null },
      ],
    })
    expect(state.coins[1]).toBe(9)
    expect(state.coins[2]).toBe(9)
    expect(state.orderPile.length).toBe(8)
  })

  it("difficulty dial subtracts from every Wholesaler", () => {
    const state = setupGame({
      seed: "dial",
      wholesalerCoinAdjust: -1,
      seats: [
        { kind: "human", style: null },
        { kind: "wholesaler", style: null },
        { kind: "ai", style: "balanced" },
      ],
    })
    expect(state.coins[1]).toBe(8)
  })

  it("a 4-seat game with two Wholesalers finishes", () => {
    const start = setupGame({
      seed: "pause3w",
      seats: [
        { kind: "human", style: null },
        { kind: "ai", style: "balanced" },
        { kind: "wholesaler", style: null },
        { kind: "wholesaler", style: null },
      ],
    })
    const { state, scores } = runGame(start)
    expect(state.gameOver).toBe(true)
    expect(scores.winners.length).toBeGreaterThanOrEqual(1)
  })
})
