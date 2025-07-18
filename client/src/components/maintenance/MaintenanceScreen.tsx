import { Wrench } from "lucide-react";

export default function MaintenanceScreen() {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-indigo-100 to-blue-200 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center overflow-hidden">
      {/* Background particles (decorative dots) */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      {/* Main card */}
      <div className="z-10 max-w-md w-full mx-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-2xl backdrop-blur p-8 text-center animate-fade-in border border-white/30 dark:border-slate-700">
        {/* Floating icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 shadow-md flex items-center justify-center animate-float">
            <Wrench className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          Estamos en mantenimiento
        </h1>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Estamos trabajando en algo increíble. Volveremos pronto con mejoras.
        </p>

        {/* Spinner */}
        <div className="flex justify-center my-6">
          <div className="loader-ring"></div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Sistema EasyTrack - JASANA<br />
          Gracias por tu paciencia 🙏
        </p>
      </div>

      {/* Extra styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out both;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .loader-ring {
          width: 36px;
          height: 36px;
          border: 4px solid transparent;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
