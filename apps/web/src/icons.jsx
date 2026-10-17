import { BankIcon, BuildingsIcon, ScalesIcon, ShieldCheckIcon, FingerprintIcon, GlobeHemisphereEastIcon, MonitorIcon, IdentificationCardIcon, FlagIcon } from '@phosphor-icons/react'

const icons = { parliament: BankIcon, chamber: BankIcon, senate: BankIcon, government: BuildingsIcon, presidency: FlagIcon, justice: ScalesIcon, security: ShieldCheckIcon, authority: BankIcon, agency: BuildingsIcon, digital: MonitorIcon, finance: BankIcon, identity: IdentificationCardIcon, mai: ShieldCheckIcon }
export function InstitutionIcon({ kind, size = 32, ...props }) {
  const Icon = icons[kind] || GlobeHemisphereEastIcon
  return <Icon size={size} weight="light" aria-hidden="true" {...props} />
}
