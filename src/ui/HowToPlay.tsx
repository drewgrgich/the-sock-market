type Props = {
  tiered: boolean
  onClose: () => void
}

export function HowToPlay({ tiered, onClose }: Props) {
  return (
    <div className="overlay" role="dialog" aria-labelledby="how-title">
      <div className="overlay-card">
        <h2 id="how-title">How to Play</h2>
        <p className="tag">On your turn, take exactly one action.</p>
        <h3>1 · Shop</h3>
        <p>
          Buy 1 or 2 sock cards, one at a time. For each, choose either the Market Row or the
          Bargain Bin.
        </p>
        <p>
          <strong>Market Row</strong> — pay that line’s current price to the bank, take the card
          into your hand, then raise that line’s price by 1 (max 9), then refill the Row to 6 from
          the Bin. The refill happens before your second purchase.
        </p>
        <p>
          <strong>Bargain Bin</strong> — pay 2 coins, take the top card of the Bin into your hand
          without showing anyone. The price does not change.
        </p>
        <p>
          You do not announce 1 or 2 purchases in advance. A price-0 Row card costs 0 (its price
          still rises to 1). If you buy two cards of the same line from the Row, the second costs
          the new price.
        </p>
        <h3>2 · Dump</h3>
        <p>
          Choose one sock line. Sell 1 or more cards of it from your hand. Reveal all the cards,
          collect (cards sold) × (price at the start of the Dump) coins, then lower that price by 1
          per card sold (min 0). The price does not fall between cards. Sold cards go face-up into
          your Receipts. Dumping at price 0 is legal and pays 0.
        </p>
        <h3>3 · Laundromat</h3>
        {tiered ? (
          <p>
            If you have 5 coins or less, take 2 coins from the bank. If you have 6 coins or more,
            take 1 coin from the bank.
          </p>
        ) : (
          <p>Take 2 coins from the bank.</p>
        )}
        <h3>Game end</h3>
        <p>
          When the Bargain Bin runs out, finish the round, then each seat takes one final turn with
          no refills and no Bin. Most coins wins. Socks left in hand are worth 0. Matching Receipts
          to your Client pay +2 each.
        </p>
        <button type="button" className="btn primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
