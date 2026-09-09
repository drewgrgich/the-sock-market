import { LINE_NAMES, type GameState, type Purchase } from "../engine/index.ts"
import { canDump, canShop, dumpMax, laundromatGain } from "../engine/index.ts"
import { LINE_COLORS } from "./theme.ts"

type Mode = "choose" | "shop" | "dump"

type Props = {
  state: GameState
  seat: number
  mode: Mode
  shopBuys: number
  dumpLine: number | null
  onShop: () => void
  onDump: () => void
  onLaundromat: () => void
  onPurchase: (purchase: Purchase) => void
  onDoneShopping: () => void
  onUndoShop: () => void
  onPickDumpLine: (line: number) => void
  onDumpAmount: (count: number) => void
  onCancelDump: () => void
}

export function ActionPanel(props: Props) {
  const { state, seat, mode } = props
  const gain = laundromatGain(state, seat)
  const dumpHave = props.dumpLine === null ? 0 : dumpMax(state, seat, props.dumpLine)

  if (mode === "shop") {
    return (
      <section className="actions">
        <h2>{props.shopBuys === 0 ? "Shop — click a Row card or the Bin" : "Shop — second sock, or done"}</h2>
        <div className="row-btns">
          {props.shopBuys > 0 && (
            <button type="button" className="btn primary" onClick={props.onDoneShopping}>
              Done shopping
            </button>
          )}
          <button type="button" className="btn" onClick={props.onUndoShop}>
            Undo
          </button>
        </div>
      </section>
    )
  }

  if (mode === "dump") {
    return (
      <section className="actions">
        <h2>Dump — sell one line</h2>
        <div className="buy-grid">
          {LINE_NAMES.map((name, line) => {
            const have = dumpMax(state, seat, line)
            const c = LINE_COLORS[line]
            return (
              <button
                key={name}
                type="button"
                className={props.dumpLine === line ? "card-btn selected" : "card-btn"}
                disabled={have < 1}
                style={{ background: c?.fill, color: c?.ink }}
                onClick={() => props.onPickDumpLine(line)}
              >
                {name}
                <span>{have < 1 ? "none in hand" : `hold ${have} · sell @ ${state.prices[line]}`}</span>
              </button>
            )
          })}
        </div>
        {props.dumpLine !== null && (
          <div className="row-btns">
            {Array.from({ length: dumpHave }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className="btn"
                onClick={() => props.onDumpAmount(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button type="button" className="btn primary" onClick={() => props.onDumpAmount(dumpHave)}>
              All
            </button>
          </div>
        )}
        <div className="row-btns">
          <button type="button" className="btn" onClick={props.onCancelDump}>
            Cancel
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="actions">
      <h2>Your turn — pick one action</h2>
      <div className="row-btns">
        <button type="button" className="btn primary" disabled={!canShop(state, seat)} onClick={props.onShop}>
          Shop
        </button>
        <button type="button" className="btn" disabled={!canDump(state, seat)} onClick={props.onDump}>
          Dump
        </button>
        <button type="button" className="btn" onClick={props.onLaundromat}>
          Laundromat (+{gain})
        </button>
      </div>
    </section>
  )
}
