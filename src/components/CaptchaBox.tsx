type Props = {
  value: string;
  onRefresh: () => void;
};

export default function CaptchaBox({ value, onRefresh }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="font-mono text-lg font-bold tracking-widest select-none bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 px-4 py-3 rounded-lg shadow-inner min-w-[120px] text-center">
          <span className="text-gray-800">{value}</span>
        </div>
        {/* Líneas decorativas para hacer más difícil la lectura automática */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 40">
            <line x1="10" y1="15" x2="90" y2="25" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
            <line x1="20" y1="30" x2="80" y2="10" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={onRefresh}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        title="Generar nuevo captcha"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Nuevo
      </button>
    </div>
  );
}
