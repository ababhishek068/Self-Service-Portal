import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AmbientLayer } from '@/components/layout/AmbientLayer'

export function MainContent() {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="portal-main-bg relative min-h-0 flex-1 overflow-hidden">
      <AmbientLayer />
      <div ref={scrollRef} className="portal-scrollbar-light relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
