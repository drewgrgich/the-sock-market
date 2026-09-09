import { useState } from "react"

const DENOMS = [20, 10, 5, 2, 1] as const

function greedy(total: number): number[] {
  let left = Math.max(0, total)
  return DENOMS.map((d) => {
    const n = Math.floor(left / d)
    left -= n * d
    return n
  })
}

function valueOf(counts: number[]): number {
  return counts.reduce((sum, n, i) => sum + n * DENOMS[i]!, 0)
}

type Props = {
  total: number
}

export function CoinPile({ total }: Props) {
  const [override, setOverride] = useState<{ total: number; counts: number[] } | null>(null)
  const [open, setOpen] = useState(false)
  const counts = override && override.total === total ? override.counts : greedy(total)

  function setCounts(next: number[]) {
    setOverride({ total, counts: next })
  }

  function breakCoin(i: number) {
    const d = DENOMS[i]!
    if ((counts[i] ?? 0) < 1 || d === 1) return
    const next = counts.slice()
    next[i] = (next[i] ?? 0) - 1
    let rest = d
    for (let j = i + 1; j < DENOMS.length; j++) {
      const n = Math.floor(rest / DENOMS[j]!)
      next[j] = (next[j] ?? 0) + n
      rest -= n * DENOMS[j]!
    }
    setCounts(next)
  }

  return (
    <div className="coin-pile">
      <button type="button" className="link" onClick={() => setOpen((v) => !v)}>
        {total} coins
      </button>
      <div className="coin-row">
        {DENOMS.map((d, i) =>
          (counts[i] ?? 0) > 0 ? (
            <span key={d} className="coin">
              {counts[i]}×{d}
            </span>
          ) : null,
        )}
      </div>
      {open && (
        <div className="change">
          <p>Make change — total stays {valueOf(counts)}.</p>
          <div className="row-btns">
            {DENOMS.slice(0, 4).map((d, i) => (
              <button
                key={d}
                type="button"
                className="btn"
                disabled={(counts[i] ?? 0) < 1}
                onClick={() => breakCoin(i)}
              >
                Break a {d}
              </button>
            ))}
            <button type="button" className="btn" onClick={() => setCounts(greedy(total))}>
              Combine
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
