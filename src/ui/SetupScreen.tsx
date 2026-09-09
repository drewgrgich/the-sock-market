import { useState } from "react"
import {
  AI_STYLES,
  type AiStyle,
  type LaundromatRule,
  type Seat,
  type SetupOptions,
} from "../engine/index.ts"
import { CREST, WORDMARK } from "./art.ts"

type Bot = { kind: "ai" | "wholesaler"; style: AiStyle }

const STYLE_LABEL: Record<AiStyle, string> = {
  balanced: "Balanced",
  fast_flipper: "Fast Flipper",
  hoarder: "Hoarder",
  sniper: "Sniper",
  client_chaser: "Client Chaser",
}

function aiBots(n: number, style: AiStyle = "balanced"): Bot[] {
  return Array.from({ length: n }, () => ({ kind: "ai" as const, style }))
}

type Props = {
  onStart: (options: SetupOptions) => void
}

export function SetupScreen({ onStart }: Props) {
  const [seed, setSeed] = useState("pause3")
  const [rule, setRule] = useState<LaundromatRule>("tiered")
  const [bots, setBots] = useState<Bot[]>(aiBots(2))
  const [dial, setDial] = useState(0)
  const hasW = bots.some((b) => b.kind === "wholesaler")

  function setCount(n: 2 | 3 | 4) {
    setBots((prev) => {
      const next = prev.slice(0, n)
      while (next.length < n) next.push({ kind: "ai", style: "balanced" })
      return next
    })
  }

  function start() {
    const seats: Seat[] = [
      { kind: "human", style: null },
      ...bots.map((b) =>
        b.kind === "wholesaler"
          ? { kind: "wholesaler" as const, style: null }
          : { kind: "ai" as const, style: b.style },
      ),
    ]
    onStart({
      seed: seed.trim() || "pause3",
      seats,
      laundromatRule: rule,
      wholesalerCoinAdjust: hasW ? dial : 0,
    })
  }

  return (
    <main className="setup">
      <img className="crest" src={CREST} alt="" />
      <img className="wordmark" src={WORDMARK} alt="The Sock Market" />
      <p className="tag">No Cold Feet on Wool Street</p>
      <p>You vs 2 to 4 robots. Each robot is an AI collector or the Wholesaler dealer.</p>

      <h2>Quick tables</h2>
      <div className="row-btns">
        <button type="button" className="btn" onClick={() => setBots(aiBots(3))}>
          Three Balanced
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            setBots([
              { kind: "ai", style: "balanced" },
              { kind: "wholesaler", style: "balanced" },
              { kind: "wholesaler", style: "balanced" },
            ])
          }
        >
          One Balanced + two Wholesalers
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            setBots([
              { kind: "wholesaler", style: "balanced" },
              { kind: "wholesaler", style: "balanced" },
              { kind: "wholesaler", style: "balanced" },
              { kind: "wholesaler", style: "balanced" },
            ])
          }
        >
          Four Wholesalers
        </button>
      </div>

      <label className="field">
        Number of opponents
        <select
          value={bots.length}
          onChange={(e) => setCount(Number(e.target.value) as 2 | 3 | 4)}
        >
          <option value={2}>2 (3 seats)</option>
          <option value={3}>3 (4 seats)</option>
          <option value={4}>4 (5 seats)</option>
        </select>
      </label>

      {bots.map((bot, i) => (
        <div key={i} className="bot-row">
          <span>Seat {i + 2}</span>
          <label>
            <input
              type="radio"
              checked={bot.kind === "ai"}
              onChange={() =>
                setBots((prev) => prev.map((b, j) => (j === i ? { ...b, kind: "ai" } : b)))
              }
            />
            AI
          </label>
          <label>
            <input
              type="radio"
              checked={bot.kind === "wholesaler"}
              onChange={() =>
                setBots((prev) => prev.map((b, j) => (j === i ? { ...b, kind: "wholesaler" } : b)))
              }
            />
            Wholesaler
          </label>
          {bot.kind === "ai" && (
            <select
              value={bot.style}
              onChange={(e) =>
                setBots((prev) =>
                  prev.map((b, j) => (j === i ? { ...b, style: e.target.value as AiStyle } : b)),
                )
              }
            >
              {AI_STYLES.map((s) => (
                <option key={s} value={s}>
                  {STYLE_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {hasW && (
        <label className="field">
          Wholesaler starting coins ({9 + dial})
          <input
            type="range"
            min={-3}
            max={3}
            value={dial}
            onChange={(e) => setDial(Number(e.target.value))}
          />
        </label>
      )}

      <label className="field">
        Seed
        <input value={seed} onChange={(e) => setSeed(e.target.value)} />
      </label>
      <button type="button" className="btn" onClick={() => setSeed(String(Math.floor(Math.random() * 1e9)))}>
        Random seed
      </button>
      <label className="field">
        Laundromat
        <select value={rule} onChange={(e) => setRule(e.target.value as LaundromatRule)}>
          <option value="tiered">Tiered (5 or fewer coins → +2, else +1)</option>
          <option value="flat">Flat (always +2)</option>
        </select>
      </label>
      <button type="button" className="btn primary" onClick={start}>
        Start
      </button>
    </main>
  )
}
