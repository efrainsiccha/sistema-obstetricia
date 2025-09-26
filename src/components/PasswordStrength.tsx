
import { useState } from "react";
import { MIN_PASSWORD_LEN } from "../lib/passwordRules";

type Props = {
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasMin: boolean;
  password: string;
};

export default function PasswordStrength({
  hasLetter,
  hasNumber,
  hasSpecial,
  hasMin,
  password,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  
  const requirements = [
    { met: hasLetter, text: "Letras (A-z)", icon: "🔤" },
    { met: hasNumber, text: "Números (0-9)", icon: "🔢" },
    { met: hasSpecial, text: "Carácter especial (!@#$%)", icon: "🔣" },
    { met: hasMin, text: `Mínimo ${MIN_PASSWORD_LEN} caracteres`, icon: "📏" },
  ];
  
  const passed = requirements.filter(req => req.met).length;
  const percent = (passed / 4) * 100;
  
  const getStrengthText = () => {
    if (percent === 0) return "Muy débil";
    if (percent <= 25) return "Débil";
    if (percent <= 50) return "Regular";
    if (percent <= 75) return "Buena";
    return "Excelente";
  };
  
  const getStrengthColor = () => {
    if (percent <= 25) return "text-red-500";
    if (percent <= 50) return "text-orange-500";
    if (percent <= 75) return "text-blue-500";
    return "text-green-500";
  };
  
  const getBarColor = () => {
    if (percent <= 25) return "bg-red-500";
    if (percent <= 50) return "bg-orange-500";
    if (percent <= 75) return "bg-blue-500";
    return "bg-green-500";
  };

  // Solo mostrar si hay contraseña
  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de fortaleza */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${getStrengthColor()}`}>
          {getStrengthText()}
        </span>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Ver requisitos"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      
      {/* Detalles de requisitos (expandible) */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                req.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {req.met ? '✓' : '○'}
              </span>
              <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
