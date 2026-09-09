import { LINE_NAMES } from "../engine/index.ts"
import { SOCK_ART, SOCK_BACK } from "./art.ts"

type Props = {
  line?: number
  faceDown?: boolean
  price?: number
  compact?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function SockCard({ line, faceDown, price, compact, disabled, onClick }: Props) {
  const src = faceDown || line === undefined ? SOCK_BACK : SOCK_ART[line]
  const name = line === undefined ? "Sock" : LINE_NAMES[line]
  const className = [
    "sock-face",
    compact ? "compact" : "",
    onClick ? "clickable" : "",
    disabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ")
  return (
    <figure className={className} onClick={disabled ? undefined : onClick}>
      <img src={src} alt={faceDown ? "face-down sock" : name} />
      {!faceDown && (
        <figcaption>
          {name}
          {price !== undefined ? ` · ${price}` : ""}
        </figcaption>
      )}
    </figure>
  )
}
