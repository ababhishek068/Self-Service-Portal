/** Decorative floating orbs — pointer-events none, sits behind scrollable content */
export function AmbientLayer() {
  return (
    <div className="portal-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <span className="portal-orb portal-orb-navy" />
      <span className="portal-orb portal-orb-orange" />
      <span className="portal-orb portal-orb-mix" />
    </div>
  )
}
