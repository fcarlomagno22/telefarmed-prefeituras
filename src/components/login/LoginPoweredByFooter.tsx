import { PoweredByTelefarmed } from '../brand/PoweredByTelefarmed'

export function LoginPoweredByFooter() {
  return (
    <footer className="pointer-events-none absolute bottom-4 right-4 z-20 sm:bottom-5 sm:right-6">
      <div className="flex items-center rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-md ring-1 ring-white/50">
        <PoweredByTelefarmed />
      </div>
    </footer>
  )
}
