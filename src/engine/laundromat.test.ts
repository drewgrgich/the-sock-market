import { describe, expect, it } from "vitest"
import { applyAction } from "./rules.ts"
import { createTestState } from "./state.ts"
import { laundromatGain } from "./validators.ts"

describe("laundromat", () => {
  it("pays +2 when seat has ≤ 5 coins", () => {
    const state = createTestState({ coins: [4, 9, 10] })
    expect(laundromatGain(state, 0)).toBe(2)
    const next = applyAction(state, { type: "laundromat" })
    expect(next.coins[0]).toBe(6)
  })

  it("pays +1 when seat has ≥ 6 coins", () => {
    const state = createTestState({ coins: [7, 9, 10] })
    expect(laundromatGain(state, 0)).toBe(1)
    const next = applyAction(state, { type: "laundromat" })
    expect(next.coins[0]).toBe(8)
  })

  it("at exactly 5 coins pays +2", () => {
    const state = createTestState({ coins: [5, 9, 10] })
    expect(laundromatGain(state, 0)).toBe(2)
    const next = applyAction(state, { type: "laundromat" })
    expect(next.coins[0]).toBe(7)
  })

  it("at exactly 6 coins pays +1", () => {
    const state = createTestState({ coins: [6, 9, 10] })
    expect(laundromatGain(state, 0)).toBe(1)
    const next = applyAction(state, { type: "laundromat" })
    expect(next.coins[0]).toBe(7)
  })

  it("flat rule always pays +2", () => {
    const state = createTestState({ coins: [20, 9, 10], laundromatRule: "flat" })
    expect(laundromatGain(state, 0)).toBe(2)
    const next = applyAction(state, { type: "laundromat" })
    expect(next.coins[0]).toBe(22)
  })
})
