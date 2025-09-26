const KEY = "login_attempts_left";
const BLOCK_KEY = "login_blocked_until";
export const MAX_ATTEMPTS = 3;
export const BLOCK_DURATION_MINUTES = 5; // 5 minutos de bloqueo


export function getAttemptsLeft(): number {
const raw = sessionStorage.getItem(KEY);
return raw ? Number(raw) : MAX_ATTEMPTS;
}


export function setAttemptsLeft(n: number) {
sessionStorage.setItem(KEY, String(n));
}


export function decAttempt(): number {
const left = Math.max(0, getAttemptsLeft() - 1);
setAttemptsLeft(left);

// Si se agotan los intentos, establecer bloqueo temporal
if (left === 0) {
  const blockUntil = Date.now() + (BLOCK_DURATION_MINUTES * 60 * 1000);
  sessionStorage.setItem(BLOCK_KEY, String(blockUntil));
}

return left;
}


export function resetAttempts() {
setAttemptsLeft(MAX_ATTEMPTS);
sessionStorage.removeItem(BLOCK_KEY);
}


export function isBlocked(): boolean {
const blockUntil = sessionStorage.getItem(BLOCK_KEY);
if (!blockUntil) return false;

const now = Date.now();
const blockTime = Number(blockUntil);

if (now < blockTime) {
  return true;
} else {
  // El bloqueo ha expirado, limpiar y resetear intentos
  sessionStorage.removeItem(BLOCK_KEY);
  resetAttempts();
  return false;
}
}


export function getBlockTimeRemaining(): number {
const blockUntil = sessionStorage.getItem(BLOCK_KEY);
if (!blockUntil) return 0;

const remaining = Number(blockUntil) - Date.now();
return Math.max(0, remaining);
}


export function formatTimeRemaining(ms: number): string {
const minutes = Math.floor(ms / (1000 * 60));
const seconds = Math.floor((ms % (1000 * 60)) / 1000);
return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}