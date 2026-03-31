import type { RegistrableApp } from 'qiankun'

export const microApps: RegistrableApp<any>[] = [
  {
    name: 'admin-trading',
    entry: '//localhost:3001',
    container: '#subapp-trading',
    activeRule: '/admin/trading',
  },
  {
    name: 'admin-community',
    entry: '//localhost:3002',
    container: '#subapp-community',
    activeRule: '/admin/community',
  },
]

export function getMicroApps() {
  return microApps
}
