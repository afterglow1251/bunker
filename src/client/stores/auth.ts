import { ref } from 'vue'

function getOrCreateClientId(): string {
  let id = sessionStorage.getItem('bunker:clientId')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('bunker:clientId', id)
  }
  return id
}

export const clientId = ref(getOrCreateClientId())

export const nickname = ref(localStorage.getItem('bunker:nickname') ?? '')

export function setNickname(value: string) {
  nickname.value = value
  localStorage.setItem('bunker:nickname', value)
}
