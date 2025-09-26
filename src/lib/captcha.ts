export function generateCaptcha(len = 6) {
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I
let out = "";
for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
return out;
}


export function verifyCaptcha(input: string, expected: string) {
return input.trim().toUpperCase() === expected.trim().toUpperCase();
}