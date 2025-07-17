
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock, AlertCircle } from "lucide-react";

export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Wrench className="h-10 w-10 text-purple-600 dark:text-purple-400 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Estamos Actualizando
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Nuestro sistema está siendo actualizado para ofrecerte una mejor experiencia.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Clock className="h-4 w-4" />
            <span>Vuelve más tarde</span>
          </div>

          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sistema EasyTrack - JASANA
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Gracias por tu paciencia
            </p>
          </div>

          {/* Loading animation */}
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
