export function Footer() {
  return (
    <footer className="portal-footer shrink-0">
      <div className="portal-footer-accent" aria-hidden />
      <div className="px-4 py-3 text-center text-sm text-white">
        <p>© {new Date().getFullYear()} All rights reserved</p>
        <p className="mt-1 text-xs text-white/75">Powered by Hijra Bank</p>
      </div>
    </footer>
  )
}
