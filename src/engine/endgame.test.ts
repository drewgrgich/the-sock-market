import { describe, expect, it } from "vitest"
import { applyAction, playTurn } from "./rules.ts"
import { scoreGame } from "./scoring.ts"
import { createTestState } from "./state.ts"

describe("endgame", () => {
  it("bin becoming empty on a row refill triggers the end after the turn", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [2],
      coins: [8, 9, 10],
    })
    const next = playTurn(state, { type: "shop", purchases: [{ source: "row", index: 0 }] })
    expect(next.bin.length).toBe(0)
    expect(next.endTriggered).toBe(true)
    expect(next.gameOver).toBe(false)
  })

  it("after trigger, the round finishes then each seat gets one final turn", () => {
    let state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [],
      coins: [8, 9, 10],
      current: 2,
      turnsTaken: 2,
    })
    state = playTurn(state, { type: "laundromat" })
    expect(state.endTriggered).toBe(true)
    expect(state.inFinal).toBe(true)
    expect(state.finalLeft).toBe(3)
    expect(state.current).toBe(0)
    state = playTurn(state, { type: "laundromat" })
    state = playTurn(state, { type: "laundromat" })
    state = playTurn(state, { type: "laundromat" })
    expect(state.gameOver).toBe(true)
  })

  it("final round does not refill the row and bin is unavailable", () => {
    const state = createTestState({
      row: [0, 1, 2, 3, 4, 1],
      bin: [2, 2, 2],
      coins: [8, 9, 10],
      inFinal: true,
      endTriggered: true,
      finalLeft: 3,
    })
    const next = applyAction(state, { type: "shop", purchases: [{ source: "row", index: 0 }] })
    expect(next.row.length).toBe(5)
    expect(next.bin.length).toBe(3)
    expect(() => applyAction(state, { type: "shop", purchases: [{ source: "bin" }] })).toThrow()
  })

  it("stall rule fires after one full round of laundromat", () => {
    let state = createTestState({ coins: [8, 9, 10] })
    state = playTurn(state, { type: "laundromat" })
    state = playTurn(state, { type: "laundromat" })
    state = playTurn(state, { type: "laundromat" })
    expect(state.endTriggered).toBe(true)
    expect(state.inFinal).toBe(true)
  })

  it("client reveal awards +2 per matching receipt sock", () => {
    const state = createTestState({
      clients: [0, 1, 2],
      coins: [10, 10, 10],
      receipts: [
        [3, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      hands: [
        [2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
    })
    const scores = scoreGame(state)
    expect(scores.bonus).toEqual([6, 2, 0])
    expect(scores.total).toEqual([16, 12, 10])
    expect(scores.winners).toEqual([0])
  })

  it("coin tie breaks on fewest hand cards; second tie shares the win", () => {
    const tiebreak = scoreGame(
      createTestState({
        clients: [4, 4, 4],
        coins: [10, 10, 8],
        receipts: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        hands: [
          [2, 0, 0, 0, 0],
          [1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      }),
    )
    expect(tiebreak.winners).toEqual([1])
    expect(tiebreak.shared).toBe(false)

    const share = scoreGame(
      createTestState({
        clients: [4, 4, 4],
        coins: [10, 10, 8],
        receipts: [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
        hands: [
          [1, 0, 0, 0, 0],
          [1, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ],
      }),
    )
    expect(share.winners).toEqual([0, 1])
    expect(share.shared).toBe(true)
  })
})
