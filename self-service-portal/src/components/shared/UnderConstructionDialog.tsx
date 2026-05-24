import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function useUnderConstruction() {
  const [open, setOpen] = useState(false)

  const trigger = () => setOpen(true)

  const dialog = open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <p className="text-lg font-semibold text-slate-900">Notice</p>
        <p className="mt-3 text-sm text-slate-700">Feature under construction — coming soon!</p>
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={() => setOpen(false)}>
            OK
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return { trigger, dialog }
}
