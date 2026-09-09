import { useState } from "react"
import { CREST, WORDMARK } from "./art.ts"

const STEPS: { title: string; body: string[] }[] = [
  {
    title: "Most coins wins",
    body: [
      "You are a sock collector on Wool Street. Buy low, sell high.",
      "Socks left in your hand are worth 0. Receipts that match your secret Client pay +2 each.",
    ],
  },
  {
    title: "One action a turn",
    body: [
      "Shop, Dump, or Laundromat — pick exactly one.",
      "Laundromat is the cash drip: +2 if you have 5 coins or fewer, otherwise +1.",
    ],
  },
  {
    title: "Shop",
    body: [
      "Buy 1 or 2 sock cards, one at a time, from the Market Row or the Bargain Bin.",
      "Row: pay that line’s price, then the price goes up 1 (max 9). Bin: pay 2, take the top card face-down. Price does not move.",
    ],
  },
  {
    title: "Dump",
    body: [
      "Sell 1 or more cards of one sock line from your hand.",
      "You collect cards × the price at the start of the Dump, then that price drops 1 per card sold (min 0). Sold cards become face-up Receipts.",
    ],
  },
  {
    title: "The market closes",
    body: [
      "When the Bargain Bin runs out, finish the round, then each seat takes one last turn with no Bin and no refills.",
      "AI collectors play the real game with a hidden hand. The Wholesaler is the boxed automa: face-up Stash, Order cards, and he can win.",
    ],
  },
]

type Props = {
  onSkip: () => void
  onDone: () => void
}

export function Tutorial({ onSkip, onDone }: Props) {
  const [i, setI] = useState(0)
  const step = STEPS[i]!
  const last = i === STEPS.length - 1

  return (
    <main className="setup tutorial">
      <img className="crest" src={CREST} alt="" />
      <img className="wordmark" src={WORDMARK} alt="The Sock Market" />
      <p className="tag">
        How to play · {i + 1} / {STEPS.length}
      </p>
      <h2>{step.title}</h2>
      {step.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div className="dots" aria-hidden="true">
        {STEPS.map((_, n) => (
          <span key={n} className={n === i ? "dot on" : "dot"} />
        ))}
      </div>
      <div className="tutorial-nav">
        <button type="button" className="link" onClick={onSkip}>
          Skip
        </button>
        <div className="row-btns">
          {i > 0 && (
            <button type="button" className="btn" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          {last ? (
            <button type="button" className="btn primary" onClick={onDone}>
              Set up a table
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={() => setI(i + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
