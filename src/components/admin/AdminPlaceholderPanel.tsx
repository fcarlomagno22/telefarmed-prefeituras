type AdminPlaceholderPanelProps = {
  title: string
}

export function AdminPlaceholderPanel({ title }: AdminPlaceholderPanelProps) {
  return (
    <section
      className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-label={`${title} — em construção`}
    >
      <p className="text-sm font-medium text-gray-500">Em construção</p>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">
        Esta área do painel administrativo será disponibilizada em breve.
      </p>
    </section>
  )
}
