import { ChevronDown } from 'lucide-react'
import {
  formatSystemDeploymentDate,
  systemRelease,
} from '../../config/systemRelease'

export function PrefeituraSystemReleaseFootnote() {
  const { appName, version, currentDeployment, deployments } = systemRelease
  const deployedAtLabel = formatSystemDeploymentDate(currentDeployment.deployedAt)

  return (
    <div className="relative shrink-0">
      <details className="group text-right">
        <summary className="inline-flex cursor-pointer select-none list-none items-center justify-end gap-1 rounded-md px-1 py-0.5 text-[10px] font-medium tracking-wide text-gray-400/90 transition hover:text-gray-500 [&::-webkit-details-marker]:hidden">
          <span>
            {appName} v{version}
          </span>
          <span className="text-gray-300" aria-hidden>
            ·
          </span>
          <span>Impl. {deployedAtLabel}</span>
          <ChevronDown
            className="ml-0.5 h-3 w-3 shrink-0 text-gray-400/70 transition group-open:rotate-180"
            strokeWidth={2}
            aria-hidden
          />
        </summary>

        <div
          className="absolute right-0 top-full z-20 mt-1.5 w-72 max-h-52 space-y-3 overflow-y-auto overscroll-y-contain rounded-lg border border-gray-200/90 bg-white px-3 py-2.5 text-left shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
          role="region"
          aria-label="Histórico de implantações"
        >
          {deployments.map((release) => (
            <div key={`${release.version}-${release.deployedAt}`}>
              <p className="text-[10px] font-semibold text-gray-500">
                v{release.version}
                <span className="font-normal text-gray-400">
                  {' '}
                  · {formatSystemDeploymentDate(release.deployedAt)}
                  {release.deploymentLabel ? ` · ${release.deploymentLabel}` : ''}
                </span>
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] leading-snug text-gray-400 marker:text-gray-300">
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
