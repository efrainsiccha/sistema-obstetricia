import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GoogleRecaptcha from "../components/GoogleRecaptcha";
import ReCAPTCHA from "react-google-recaptcha";
import {
  getAttemptsLeft,
  decAttempt,
  resetAttempts,
  isBlocked,
  getBlockTimeRemaining,
  formatTimeRemaining,
} from "../lib/attempts";

// Importa las funciones de Firebase Auth
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
// Importa tu app de Firebase (la que lee las variables .env)
import { app } from "../lib/firebaseConfig";

// PASO 1: Cambiamos 'username' por 'email' y validamos que sea un email
const schema = z.object({
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(1, "Ingrese la contraseña"),
});

type FormData = z.infer<typeof schema>;

// PASO 2: Inicializamos el servicio de Autenticación
const auth = getAuth(app);

export default function Login() {
  const navigate = useNavigate();
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(getAttemptsLeft());
  const [blocked, setBlocked] = useState(isBlocked());
  const [timeRemaining, setTimeRemaining] = useState(getBlockTimeRemaining());
  const [hasFailedAttempts, setHasFailedAttempts] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Tu useEffect de bloqueo está perfecto, no se toca
  useEffect(() => {
    const interval = setInterval(() => {
      const isCurrentlyBlocked = isBlocked();
      const remaining = getBlockTimeRemaining();

      setBlocked(isCurrentlyBlocked);
      setTimeRemaining(remaining);

      if (!isCurrentlyBlocked && blocked) {
        setAttemptsLeft(getAttemptsLeft());
        setHasFailedAttempts(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blocked]);

  // Tus funciones de reCAPTCHA están perfectas
  function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
  }

  function onRecaptchaExpired() {
    setRecaptchaToken(null);
    toast.error("El reCAPTCHA ha expirado. Por favor, verifique nuevamente.");
  }

  function onRecaptchaError() {
    setRecaptchaToken(null);
    toast.error("Error en reCAPTCHA. Por favor, inténtelo nuevamente.");
  }

  function resetRecaptcha() {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRecaptchaToken(null);
  }

  function onForgotPassword() {
    toast("Si olvidó su contraseña, contacte con el jefe de su área.");
  }

  // PASO 3: Actualizamos la función onSubmit
  const onSubmit = async (data: FormData) => {
    if (blocked) {
      toast.error(
        `Cuenta bloqueada. Inténtelo en ${formatTimeRemaining(timeRemaining)}`
      );
      return;
    }

    if (!recaptchaToken) {
      toast.error("Por favor, complete la verificación reCAPTCHA.");
      return;
    }

    try {
      // ESTA ES LA LÓGICA REAL DE FIREBASE
      // Usamos data.email y data.password
      await signInWithEmailAndPassword(auth, data.email, data.password);

      // Login exitoso
      toast.success("¡Bienvenido al sistema!");
      resetAttempts(); // Reseteamos contador de intentos
      setAttemptsLeft(getAttemptsLeft());
      setHasFailedAttempts(false);
      navigate("/home"); // Navegamos al Home
    } catch (error: any) {
      // Manejo de errores de Firebase
      const left = decAttempt();
      setAttemptsLeft(left);
      setHasFailedAttempts(true);
      resetRecaptcha();

      // Damos mensajes de error específicos
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        toast.error(
          `Correo o contraseña incorrectos. Intentos restantes: ${left}`
        );
      } else {
        // Otro error (ej: sin conexión)
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema Obstetricia
            </h1>
            <p className="text-gray-600">Ingrese sus credenciales para continuar</p>
          </div>

          {/* Alerta de intentos - Solo mostrar después del primer error o cuando está bloqueado */}
          {(hasFailedAttempts || blocked) && (
            <div
              className={`p-4 rounded-lg border ${
                blocked
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-orange-50 border-orange-200 text-orange-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {blocked
                      ? "Cuenta bloqueada temporalmente"
                      : `Intentos restantes: ${attemptsLeft}`}
                  </span>
                  {blocked && timeRemaining > 0 && (
                    <span className="text-sm mt-1">
                      Tiempo restante: {formatTimeRemaining(timeRemaining)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Campo Correo Electrónico (en lugar de Usuario) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email" // Cambiamos tipo a email
              placeholder="Ingrese su correo electrónico"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              {...register("email")} // Registramos 'email'
            />
            {errors.email && ( // Mostramos errores de 'email'
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  // Ojo cerrado/tachado
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  // Ojo abierto
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Campo reCAPTCHA */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Verificación de seguridad
            </label>
            <GoogleRecaptcha
              ref={recaptchaRef}
              onChange={onRecaptchaChange}
              onExpired={onRecaptchaExpired}
              onError={onRecaptchaError}
            />
            {!recaptchaToken && hasFailedAttempts && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Por favor, complete la verificación reCAPTCHA
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="space-y-4">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
              disabled={blocked || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Ingresando...
                </div>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>

            <button
              type="button"
              className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
              onClick={onForgotPassword}
            >
              ¿Olvidó su contraseña?
            </button>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Información importante</p>
                <p>
                  Si olvidó su contraseña, contacte con el jefe de su área para
                  restablecerla.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}