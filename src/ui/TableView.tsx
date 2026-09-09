import { useEffect, useRef, useState } from "react"
import {
  LINE_NAMES,
  PRICE_MAX,
  applyPurchase,
  cloneState,
  dumpMax,
  finishShop,
  ORDER_NAMES,
  advanceSeat,
  affordableRowIndices,
  canBuyBin,
  coachHint,
  gradePlay,
  playTurn,
  scoreGame,
  type CoachHint,
  type GameState,
  type Purchase,
  type ShopStep,
} from "../engine/index.ts"
import { ActionPanel } from "./ActionPanel.tsx"
import { CLIENT_ART, WORDMARK } from "./art.ts"
import { CoinPile } from "./CoinPile.tsx"
import { HowToPlay } from "./HowToPlay.tsx"
import { countsByLine, humanSeat, seatTitle } from "./labels.ts"
import { SockCard } from "./SockCard.tsx"
import { LINE_COLORS } from "./theme.ts"

type Props = {
  state: GameState
  onState: (state: GameState) => void
  onNewGame: () => void
}

type Mode = "choose" | "shop" | "dump"

export function TableView({ state, onState, onNewGame }: Props) {
  const you = humanSeat(state)
  const [showHand, setShowHand] = useState(true)
  const [revealAll, setRevealAll] = useState(false)
  const [revealSeat, setRevealSeat] = useState<Record<number, boolean>>({})
  const [how, setHow] = useState(false)
  const [mode, setMode] = useState<Mode>("choose")
  const [shopBuys, setShopBuys] = useState(0)
  const [undo, setUndo] = useState<GameState | null>(null)
  const [dumpLine, setDumpLine] = useState<number | null>(null)
  const [shopCart, setShopCart] = useState<ShopStep[]>([])
  const [coachTap, setCoachTap] = useState({ key: "", level: 0 as 0 | 1 | 2 })
  const [grade, setGrade] = useState<string | null>(null)
  const [turnCoach, setTurnCoach] = useState<{
    key: string
    hint: CoachHint | null
    at: GameState | null
  }>({ key: "", hint: null, at: null })
  const logRef = useRef<HTMLOListElement>(null)

  const yourTurn = !state.gameOver && state.seats[state.current]?.kind === "human"
  const turnKey = `${state.turnsTaken}:${state.current}`
  const hintLevel = coachTap.key === turnKey ? coachTap.level : 0
  const snap =
    turnCoach.key === turnKey
      ? turnCoach
      : {
          key: turnKey,
          hint: yourTurn ? coachHint(state, you) : null,
          at: yourTurn ? state : null,
        }
  if (turnCoach.key !== turnKey) setTurnCoach(snap)
  const recentLog = state.log.slice(-5)
  const startSeat = (state.current - (state.turnsTaken % state.n) + state.n) % state.n
  const humanReached = state.turnsTaken >= (you - startSeat + state.n) % state.n

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.log])

  useEffect(() => {
    if (state.gameOver) return
    if (state.seats[state.current]?.kind === "human") return
    if (!humanReached) return
    const id = window.setTimeout(() => {
      onState(advanceSeat(state))
    }, 1100)
    return () => window.clearTimeout(id)
  }, [state, onState, humanReached])

  function noteGrade(taken: Parameters<typeof gradePlay>[1]) {
    if (snap.hint && snap.at) setGrade(gradePlay(snap.hint, taken, snap.at))
  }

  function startShop() {
    setUndo(cloneState(state))
    setShopBuys(0)
    setShopCart([])
    setMode("shop")
  }

  function buy(purchase: Purchase) {
    const step: ShopStep =
      purchase.source === "bin" ? { source: "bin" } : { source: "row", line: state.row[purchase.index] ?? 0 }
    const nextCart = [...shopCart, step]
    const next = applyPurchase(state, purchase)
    const n = shopBuys + 1
    setShopBuys(n)
    setShopCart(nextCart)
    if (n >= 2) {
      noteGrade({ type: "shop", steps: nextCart })
      onState(finishShop(next))
      setMode("choose")
      setUndo(null)
      setShopBuys(0)
      setShopCart([])
      return
    }
    onState(next)
  }

  function doneShopping() {
    noteGrade({ type: "shop", steps: shopCart })
    onState(finishShop(state))
    setMode("choose")
    setUndo(null)
    setShopBuys(0)
    setShopCart([])
  }

  function undoShop() {
    if (undo) onState(undo)
    setMode("choose")
    setUndo(null)
    setShopBuys(0)
    setShopCart([])
  }

  function dumpAmount(count: number) {
    if (dumpLine === null) return
    const max = dumpMax(state, you, dumpLine)
    const n = Math.max(1, Math.min(count, max))
    noteGrade({ type: "dump", line: dumpLine, count: n })
    onState(playTurn(state, { type: "dump", line: dumpLine, count: n }))
    setMode("choose")
    setDumpLine(null)
  }

  function copyLog() {
    void navigator.clipboard.writeText(state.log.join("\n"))
  }

  const scores = state.gameOver ? scoreGame(state) : null

  const shopping = mode === "shop" && yourTurn
  const rowBuys = shopping ? affordableRowIndices(state, you) : []
  const binOk = shopping && canBuyBin(state, you)

  return (
    <div className="table-page">
      <header className="top">
        <div className="brand">
          <img className="wordmark" src={WORDMARK} alt="The Sock Market" />
          <p>
            Seed {state.seed}
            {state.gameOver
              ? ""
              : yourTurn
                ? " · Your turn"
                : ` · ${seatTitle(state, state.current)}'s turn`}
            {state.inFinal ? " · Final round" : ""}
            {state.endTriggered && !state.gameOver ? " · Market ending" : ""}
          </p>
        </div>
        <div className="row-btns">
          <button type="button" className="btn" onClick={() => setHow(true)}>
            How to Play
          </button>
          <button type="button" className="btn" onClick={onNewGame}>
            New game
          </button>
        </div>
      </header>

      <div className="board">
        <div className="board-main">
      <section className="mat">
        <div className="tracks">
          {LINE_NAMES.map((name, line) => {
            const c = LINE_COLORS[line]
            return (
              <div key={name} className="track">
                <div className="track-name" style={{ background: c?.fill, color: c?.ink }}>
                  {name}
                </div>
                <div className="cells">
                  {Array.from({ length: PRICE_MAX + 1 }, (_, p) => (
                    <span key={p} className={state.prices[line] === p ? "cell on" : "cell"}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="market">
        <div className="row-wrap">
          <h2>Market Row</h2>
          <div className="row-cards">
            {state.row.map((line, i) => (
              <SockCard
                key={`${i}-${line}`}
                line={line}
                price={state.prices[line]}
                disabled={shopping && !rowBuys.includes(i)}
                onClick={shopping ? () => buy({ source: "row", index: i }) : undefined}
              />
            ))}
            {state.row.length === 0 && <p>Row is empty.</p>}
          </div>
        </div>
        <div className="bin">
          <h2>Bin · {state.bin.length}</h2>
          <SockCard
            faceDown
            disabled={shopping && !binOk}
            onClick={shopping && binOk ? () => buy({ source: "bin" }) : undefined}
          />
        </div>
        {state.orderDiscard.length + state.orderPile.length > 0 && (
          <div className="orders">
            <h2>Orders · {state.orderPile.length} left</h2>
            <p className="order-discards">
              {state.orderDiscard.length
                ? state.orderDiscard.map((c) => ORDER_NAMES[c]).join(" · ")
                : "none discarded"}
            </p>
          </div>
        )}
      </section>

      <section className="seats">
        {state.seats.map((_, seat) => {
          const mine = seat === you
          const active = seat === state.current && !state.gameOver
          const kind = state.seats[seat]?.kind
          const peek = revealAll || revealSeat[seat] || state.gameOver
          return (
            <article key={seat} className={active ? "seat active" : "seat"}>
              <h3>{seatTitle(state, seat)}</h3>
              {mine ? (
                <CoinPile total={state.coins[seat] ?? 0} />
              ) : (
                <p>{state.coins[seat]} coins</p>
              )}
              <p>Receipts: {countsByLine(state.receipts[seat] ?? [])}</p>
              {mine && (
                <>
                  <p>
                    Hand{" "}
                    <button type="button" className="link" onClick={() => setShowHand((v) => !v)}>
                      {showHand ? "Hide" : "Show"}
                    </button>
                  </p>
                  {showHand && (
                    <div className="mini-row">
                      {(state.hands[seat] ?? []).flatMap((n, line) =>
                        Array.from({ length: n }, (_, i) => (
                          <SockCard key={`${line}-${i}`} line={line} compact />
                        )),
                      )}
                    </div>
                  )}
                  <p>Client · {LINE_NAMES[state.clients[seat] ?? 0]}</p>
                  <img
                    className="client-card yours"
                    src={CLIENT_ART[state.clients[seat] ?? 0]}
                    alt={LINE_NAMES[state.clients[seat] ?? 0]}
                  />
                </>
              )}
              {!mine && kind === "wholesaler" && (
                <>
                  <p>Stash</p>
                  <div className="mini-row">
                    {(state.hands[seat] ?? []).flatMap((n, line) =>
                      Array.from({ length: n }, (_, i) => (
                        <SockCard key={`${line}-${i}`} line={line} compact />
                      )),
                    )}
                  </div>
                  <p>Client: hidden until scoring</p>
                  {peek && (
                    <img
                      className="client-card"
                      src={CLIENT_ART[state.clients[seat] ?? 0]}
                      alt={LINE_NAMES[state.clients[seat] ?? 0]}
                    />
                  )}
                </>
              )}
              {!mine && kind === "ai" && (
                <>
                  <p>
                    Hand and Client hidden{" "}
                    <button
                      type="button"
                      className="link"
                      onClick={() => setRevealSeat((m) => ({ ...m, [seat]: !m[seat] }))}
                    >
                      {revealSeat[seat] ? "Hide" : "Reveal this AI"}
                    </button>
                  </p>
                  {peek && (
                    <>
                      <div className="mini-row">
                        {(state.hands[seat] ?? []).flatMap((n, line) =>
                          Array.from({ length: n }, (_, i) => (
                            <SockCard key={`${line}-${i}`} line={line} compact />
                          )),
                        )}
                      </div>
                      <img
                        className="client-card"
                        src={CLIENT_ART[state.clients[seat] ?? 0]}
                        alt={LINE_NAMES[state.clients[seat] ?? 0]}
                      />
                    </>
                  )}
                </>
              )}
            </article>
          )
        })}
      </section>

      {state.gameOver ? null : yourTurn ? (
        <ActionPanel
          state={state}
          seat={you}
          mode={mode}
          shopBuys={shopBuys}
          dumpLine={dumpLine}
          coachLevel={hintLevel}
          principle={snap.hint?.principle ?? ""}
          move={snap.hint?.move ?? ""}
          grade={grade}
          onCoach={() =>
            setCoachTap({
              key: turnKey,
              level: hintLevel >= 2 ? 2 : ((hintLevel + 1) as 0 | 1 | 2),
            })
          }
          onShop={startShop}
          onDump={() => {
            setMode("dump")
            setDumpLine(null)
          }}
          onLaundromat={() => {
            noteGrade({ type: "laundromat" })
            onState(playTurn(state, { type: "laundromat" }))
          }}
          onPurchase={buy}
          onDoneShopping={doneShopping}
          onUndoShop={undoShop}
          onPickDumpLine={setDumpLine}
          onDumpAmount={dumpAmount}
          onCancelDump={() => setMode("choose")}
        />
      ) : (
        <section className="actions">
          <h2>{seatTitle(state, state.current)} is up</h2>
          {grade && <p className="coach-grade">{grade}</p>}
          <ol className="last-act">
            {recentLog.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ol>
          {!humanReached && (
            <div className="row-btns">
              <button type="button" className="btn primary" onClick={() => onState(advanceSeat(state))}>
                See this turn
              </button>
            </div>
          )}
        </section>
      )}

      {scores && (
        <section className="results">
          <h2>Results</h2>
          <ul>
            {scores.total.map((total, seat) => (
              <li key={seat}>
                {seatTitle(state, seat)}: {scores.coins[seat]} + Client bonus {scores.bonus[seat]} ={" "}
                {total}
                {scores.winners.includes(seat) ? (scores.shared ? " · tie" : " · winner") : ""}
                <span className="muted">
                  {" "}
                  · Client {LINE_NAMES[state.clients[seat] ?? 0]} · hand{" "}
                  {(state.hands[seat] ?? []).reduce((a, b) => a + b, 0)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>

        <aside className="log">
          <div className="log-head">
            <h2>Log</h2>
            <button type="button" className="link" onClick={copyLog}>
              Copy
            </button>
          </div>
          <label className="debug">
            <input type="checkbox" checked={revealAll} onChange={(e) => setRevealAll(e.target.checked)} />
            Reveal all hands
          </label>
          <ol ref={logRef}>
            {state.log.map((line, i) => (
              <li key={`${i}-${line}`} className={i === state.log.length - 1 ? "fresh" : undefined}>
                {line}
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {how && (
        <HowToPlay tiered={state.laundromatRule === "tiered"} onClose={() => setHow(false)} />
      )}
    </div>
  )
}
