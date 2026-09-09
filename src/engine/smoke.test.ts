import { describe, expect, it } from "vitest"
import { runGame } from "./play.ts"
import { checkInvariants, setupGame } from "./state.ts"

describe("3-seat smoke", () => {
  it("a seeded 3-player game finishes with a winner and conserved cards", () => {
    const start = setupGame({ seed: "pause1" })
    const { state, scores } = runGame(start)
    expect(state.gameOver).toBe(true)
    expect(state.n).toBe(3)
    expect(scores.winners.length).toBeGreaterThanOrEqual(1)
    expect(scores.total.length).toBe(3)
    checkInvariants(state)
  })

  it("five different seeds all finish", () => {
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const { state, scores } = runGame(setupGame({ seed }))
      expect(state.gameOver).toBe(true)
      expect(scores.winners.length).toBeGreaterThanOrEqual(1)
      checkInvariants(state)
    }
  })

  it("each named AI style can finish a 3-seat game", () => {
    const styles = ["balanced", "fast_flipper", "hoarder", "sniper", "client_chaser"] as const
    for (const style of styles) {
      const start = setupGame({
        seed: style,
        seats: [
          { kind: "human", style: null },
          { kind: "ai", style },
          { kind: "ai", style },
        ],
      })
      const { state } = runGame(start)
      expect(state.gameOver).toBe(true)
    }
  })
})
