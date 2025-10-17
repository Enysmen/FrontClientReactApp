
// Разбор payload из JWT (base64url → JSON). Возвращает объект или null.
export function parseJwt(token) {
    if (!token || typeof token !== 'string' || token.split('.').length !== 3) return null
    const [, payload] = token.split('.')
    try {
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(base64)
        // decodeURIComponent/escape для корректной работы с UTF-8
        return JSON.parse(decodeURIComponent(escape(json)))
    } catch {
        return null
    }
}

// Достаём exp (в секундах Unix) из токена
export function getExp(token) {
    const p = parseJwt(token)
    return p?.exp ? Number(p.exp) : null
}

// Сколько секунд осталось до истечения exp
export function secondsLeft(exp) {
    if (!exp) return null
    const nowSec = Math.floor(Date.now() / 1000)
    return Math.max(0, exp - nowSec)
}

// Истечёт ли скоро (по умолчанию ≤ 60 сек)
export function willExpireSoon(exp, thresholdSec = 60) {
    const left = secondsLeft(exp)
    return left == null ? null : left <= thresholdSec
}