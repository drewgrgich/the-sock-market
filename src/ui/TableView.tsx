import { useEffect, useState } from "react"
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
  playTurn,
  scoreGame,
  type GameState,
  type Purchase,
} from "../engine/index.ts"
import { ActionPanel } from "./ActionPanel.tsx"
import { CLIENT_ART, CLIENT_BACK, WORDMARK } from "./art.ts"
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
  const [showClient, setShowClient] = useState(false)
  const [revealAll, setRevealAll] = useState(false)
  const [revealSeat, setRevealSeat] = useState<Record<number, boolean>>({})
  const [how, setHow] = useState(false)
  const [mode, setMode] = useState<Mode>("choose")
  const [shopBuys, setShopBuys] = useState(0)
  const [undo, setUndo] = useState<GameState | null>(null)
  const [dumpLine, setDumpLine] = useState<number | null>(null)

  const yourTurn = !state.gameOver && state.seats[state.current]?.kind === "human"

  useEffect(() => {
    if (state.gameOver) return
    if (state.seats[state.current]?.kind === "human") return
    const id = window.setTimeout(() => {
      onState(advanceSeat(state))
    }, 700)
    return () => window.clearTimeout(id)
  }, [state, onState])

  function startShop() {
    setUndo(cloneState(state))
    setShopBuys(0)
    setMode("shop")
  }

  function buy(purchase: Purchase) {
    const next = applyPurchase(state, purchase)
    const n = shopBuys + 1
    setShopBuys(n)
    if (n >= 2) {
      onState(finishShop(next))
      setMode("choose")
      setUndo(null)
      setShopBuys(0)
      return
    }
    onState(next)
  }

  function doneShopping() {
    onState(finishShop(state))
    setMode("choose")
    setUndo(null)
    setShopBuys(0)
  }

  function undoShop() {
    if (undo) onState(undo)
    setMode("choose")
    setUndo(null)
    setShopBuys(0)
  }

  function dumpAmount(count: number) {
    if (dumpLine === null) return
    const max = dumpMax(state, you, dumpLine)
    const n = Math.max(1, Math.min(count, max))
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
                  <p>
                    Client{" "}
                    <button type="button" className="link" onClick={() => setShowClient((v) => !v)}>
                      {showClient ? "Hide" : "Show"}
                    </button>
                  </p>
                  <img
                    className="client-card"
                    src={showClient ? CLIENT_ART[state.clients[seat] ?? 0] : CLIENT_BACK}
                    alt={showClient ? LINE_NAMES[state.clients[seat] ?? 0] : "hidden Client"}
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
          onShop={startShop}
          onDump={() => {
            setMode("dump")
            setDumpLine(null)
          }}
          onLaundromat={() => onState(playTurn(state, { type: "laundromat" }))}
          onPurchase={buy}
          onDoneShopping={doneShopping}
          onUndoShop={undoShop}
          onPickDumpLine={setDumpLine}
          onDumpAmount={dumpAmount}
          onCancelDump={() => setMode("choose")}
        />
      ) : (
        <section className="actions">
          <h2>{seatTitle(state, state.current)} is acting</h2>
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
          <ol>
            {state.log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ol>
          <label className="debug">
            <input type="checkbox" checked={revealAll} onChange={(e) => setRevealAll(e.target.checked)} />
            Reveal all hands
          </label>
        </aside>
      </div>

      {how && (
        <HowToPlay tiered={state.laundromatRule === "tiered"} onClose={() => setHow(false)} />
      )}
    </div>
  )
}
