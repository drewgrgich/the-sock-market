import { describe, expect, it } from "vitest"
import { checkInvariants, countCards, setupGame } from "./state.ts"
import { SEAT_COINS } from "./types.ts"

function expectedCoins(n: number, start: number, wholesaler: boolean[] = []): number[] {
  const table = SEAT_COINS[n] ?? []
  return Array.from({ length: n }, (_, p) => {
    if (wholesaler[p]) return 9
    return table[(p - start + n) % n] ?? 8
  })
}

describe("setup", () => {
  it("3-seat game uses 45 cards (9 per line) and coins by start seat", () => {
    const state = setupGame({ seed: "42" })
    expect(state.n).toBe(3)
    expect(state.deckSize).toBe(45)
    expect(countCards(state)).toBe(45)
    expect(state.current).toBeGreaterThanOrEqual(0)
    expect(state.current).toBeLessThan(3)
    expect(state.coins).toEqual(expectedCoins(3, state.current))
    expect(state.row.length).toBe(6)
    for (const hand of state.hands) {
      expect(hand.reduce((a, b) => a + b, 0)).toBe(3)
    }
    expect(state.clients.length).toBe(3)
    expect(state.prices).toEqual([3, 3, 3, 3, 3])
    expect(state.seats[0]?.kind).toBe("human")
    expect(state.seats[1]?.kind).toBe("ai")
    expect(state.seats[2]?.kind).toBe("ai")
    checkInvariants(state)
  })

  it("same seed deals the same table and start seat", () => {
    const a = setupGame({ seed: "same" })
    const b = setupGame({ seed: "same" })
    expect(a.row).toEqual(b.row)
    expect(a.bin).toEqual(b.bin)
    expect(a.hands).toEqual(b.hands)
    expect(a.clients).toEqual(b.clients)
    expect(a.current).toBe(b.current)
    expect(a.coins).toEqual(b.coins)
  })

  it("start player is randomized across seeds", () => {
    const starts = new Set<number>()
    for (let i = 0; i < 40; i++) {
      starts.add(setupGame({ seed: `start-${i}` }).current)
    }
    expect(starts.size).toBeGreaterThan(1)
  })

  it("4-seat and 5-seat coins follow the table from the start seat", () => {
    const four = setupGame({ seed: "4", botCount: 3 })
    expect(four.n).toBe(4)
    expect(four.deckSize).toBe(55)
    expect(four.coins).toEqual(expectedCoins(4, four.current))
    const five = setupGame({ seed: "5", botCount: 4 })
    expect(five.n).toBe(5)
    expect(five.deckSize).toBe(65)
    expect(five.coins).toEqual(expectedCoins(5, five.current))
  })
})
