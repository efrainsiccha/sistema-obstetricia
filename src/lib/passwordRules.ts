export const MIN_PASSWORD_LEN = 10; // cámbialo a 8 si tu política lo requiere


export function checkPassword(pwd: string) {
const hasLetter = /[A-Za-z]/.test(pwd);
const hasNumber = /\d/.test(pwd);
const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]/.test(pwd);
const hasMin = pwd.length >= MIN_PASSWORD_LEN;
const valid = hasLetter && hasNumber && hasSpecial && hasMin;
return { hasLetter, hasNumber, hasSpecial, hasMin, valid };
}