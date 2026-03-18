import { ref } from 'vue'

const API_URL = '/api'
const PLACEHOLDER_IMG = '/img/no-image.svg'

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem('avito_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const userRef = ref(readUserFromStorage())

export function getToken() {
  return localStorage.getItem('avito_token') || ''
}

export function setToken(token) {
  if (token) localStorage.setItem('avito_token', token)
}

export function clearToken() {
  localStorage.removeItem('avito_token')
}

export function getCurrentUser() {
  return userRef.value
}

export function setCurrentUser(user) {
  localStorage.setItem('avito_user', JSON.stringify(user))
  userRef.value = user
}

export function logout() {
  clearToken()
  localStorage.removeItem('avito_user')
  userRef.value = null
}

export { userRef }

function baseUrl() {
  return (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin + API_URL
    : API_URL
}

export async function apiRequest(path, options = {}) {
  const url = baseUrl() + path
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(url, { ...options, headers })
  let data = null
  const text = await response.text()
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (response.status === 401) {
    const isAuthAttempt = path === '/auth/login' || path === '/auth/register'
    if (isAuthAttempt) {
      throw new Error((data?.message) || 'Неверный email или пароль')
    }
    logout()
    window.location.href = '/#/auth?expired=1'
    throw new Error('Сессия истекла. Войдите снова.')
  }
  if (!response.ok) throw new Error((data?.message) || 'Ошибка запроса')
  return data
}

export function assertAuthPayload(data) {
  if (!data?.token || !data?.user) throw new Error('Некорректный ответ сервера')
  return data
}

export function getSafeImageUrl(url) {
  const s = (url && String(url).trim()) || ''
  if (!s) return PLACEHOLDER_IMG
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:') || s.startsWith('/')) return s
  if (s.startsWith('//')) return 'https:' + s
  return 'https://' + s
}

/** Максимальный размер фото при загрузке — 2 МБ */
const MAX_PHOTO_SIZE = 2 * 1024 * 1024

export async function uploadPhoto(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Выберите изображение (JPG, PNG, GIF, WebP)')
  if (file.size > MAX_PHOTO_SIZE) throw new Error('Файл слишком большой. Максимум 2 МБ.')
  const url = baseUrl() + '/upload'
  const form = new FormData()
  form.append('photo', file)
  const headers = {}
  if (getToken()) headers.Authorization = 'Bearer ' + getToken()
  const res = await fetch(url, { method: 'POST', body: form, headers })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = {} }
  if (res.status === 401) {
    logout()
    window.location.href = '/#/auth?expired=1'
    throw new Error('Сессия истекла')
  }
  if (!res.ok) throw new Error(data?.message || 'Ошибка загрузки')
  return data?.url || null
}

export { PLACEHOLDER_IMG }
