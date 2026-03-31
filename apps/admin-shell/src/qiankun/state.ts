import { initGlobalState, MicroAppStateActions } from 'qiankun'

let actions: MicroAppStateActions | null = null

export function initState(token: string | null) {
  actions = initGlobalState({ token, role: 'ADMIN' })
  return actions
}

export function setGlobalToken(token: string) {
  if (actions) {
    actions.setGlobalState({ token, role: 'ADMIN' })
  }
}

export function destroyState() {
  actions?.offGlobalStateChange()
  actions = null
}
