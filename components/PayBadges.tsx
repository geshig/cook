/** "Pay in one tap" reassurance shown next to buy buttons. */
export function PayBadges({ dark = false }: { dark?: boolean }) {
  return (
    <div className={"pay-badges" + (dark ? " dark" : "")}>
      <span className="pay-label">Плащаш с едно докосване:</span>
      <ul aria-label="Начини на плащане">
        <li> Apple Pay</li>
        <li>G Pay</li>
        <li>Revolut Pay</li>
        <li>Карта</li>
      </ul>
    </div>
  );
}
