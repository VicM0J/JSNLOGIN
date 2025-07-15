import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import "../Auth.css";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  User,
  Lock,
  Users,
  Building2,
  Shield,
  MessageSquare,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    name: "",
    area: "" as any,
    adminPassword: "",
  });

  // Redirect if user is authenticated
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Don't render if user exists
  if (user) {
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  const toggleToRegister = () => {
    setIsRegisterMode(true);
  };

  const toggleToLogin = () => {
    setIsRegisterMode(false);
  };

  return (
    <div className="auth-page h-screen grid place-items-center bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 p-4 relative overflow-hidden">

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 w-48 h-48 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float"></div>
        <div className="absolute top-32 right-16 w-64 h-64 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-35 animate-float-delayed"></div>
        <div className="absolute -bottom-24 left-1/3 w-56 h-56 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-2xl opacity-45 animate-float-slow"></div>

        {/* Additional background details */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-green-200 to-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-float-delayed"></div>
        <div className="absolute top-3/4 left-1/2 w-36 h-36 bg-gradient-to-r from-rose-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-35 animate-float-slow"></div>

        {/* Geometric shapes */}
        <div className="absolute top-20 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 transform rotate-45 animate-float opacity-20"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 transform rotate-12 animate-float-delayed opacity-25"></div>
        <div className="absolute top-1/2 right-20 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-purple-400/20 transform -rotate-12 animate-float-slow opacity-20"></div>

        {/* Small floating dots */}
        <div className="absolute top-1/3 left-20 w-3 h-3 bg-purple-400/40 rounded-full animate-float"></div>
        <div className="absolute bottom-1/3 right-20 w-2 h-2 bg-blue-400/40 rounded-full animate-float-delayed"></div>
        <div className="absolute top-2/3 left-1/3 w-4 h-4 bg-pink-400/40 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-1/2 right-1/3 w-2 h-2 bg-indigo-400/40 rounded-full animate-float"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto object-center">
        {/* Contenedor principal con efecto deslizante */}
        <div
          className={`auth-container backdrop-blur-lg bg-white/20 shadow-2xl border border-purple-200/50 rounded-2xl overflow-hidden relative transition-all duration-700 ease-in-out ${isRegisterMode ? "register-active" : ""}`}
        >
          {/* Formulario de Registro */}
          <div className="form-container register-container">
            <form onSubmit={handleRegister} className="auth-form">
              <div className="text-center mb-3">
                <div>
                  <img
                    src="/LogoJASANA.png"
                    alt="JASANA Logo"
                    className="w-32 h-28 object-contain center mx-auto transform hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                    draggable={false}
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Crear Cuenta
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="input-container">
                  <Input
                    type="text"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value,
                      })
                    }
                    required
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label className="auth-label">Usuario</Label>
                </div>

                <div className="input-container">
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    required
                    placeholder=" "
                    className="auth-input"
                  />
                  <Label className="auth-label">Contraseña</Label>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowRegisterPassword(!showRegisterPassword)
                    }
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="input-container mb-3">
                <Input
                  type="text"
                  value={registerData.name}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, name: e.target.value })
                  }
                  required
                  placeholder=" "
                  className="auth-input"
                />
                <Label className="auth-label">Nombre Completo</Label>
              </div>

              <div className="input-container mb-3">
                <Select 
                  value={registerData.area}
                  onValueChange={(value) =>
                    setRegisterData({ ...registerData, area: value as any })
                  }
                >
                  <SelectTrigger className="w-full h-[42px] flex items-center justify-between">
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent className="auth-page [data-radix-select-value]">
                    <SelectItem  value="corte">✂️ Corte</SelectItem>
                    <SelectItem value="bordado">🪡 Bordado</SelectItem>
                    <SelectItem value="ensamble">🔧 Ensamble</SelectItem>
                    <SelectItem value="plancha">👔 Plancha/Empaque</SelectItem>
                    <SelectItem value="calidad">✅ Calidad</SelectItem>
                    <SelectItem value="envios">📦 Envíos</SelectItem>
                    <SelectItem value="patronaje">📐 Patronaje</SelectItem>
                    <SelectItem value="almacen">🏪 Almacén</SelectItem>
                    <SelectItem value="diseño">🎨 Diseño</SelectItem>
                    <SelectItem value="admin">⚙️ Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {registerData.area && registerData.area !== "admin" && (
                <div className="input-container mb-4">
                  <Input
                    type="password"
                    value={registerData.adminPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        adminPassword: e.target.value,
                      })
                    }
                    required
                    placeholder=" "
                    className="auth-input border-orange-300 focus:border-orange-400 bg-orange-100/50"
                  />
                  <Label className="auth-label text-orange-600">
                    Contraseña de Admin
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="auth-button"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Users className="mr-2 h-4 w-4" />
                )}
                Crear Cuenta
              </Button>
            </form>
          </div>

          {/* Formulario de Login */}
          <div className="form-container login-container">
            <form onSubmit={handleLogin} className="auth-form">
              <div className="text-center mb-3">
                <div>
                  <img
                    src="/LogoJASANA.png"
                    alt="JASANA Logo"
                    className="w-32 h-28 object-contain center mx-auto transform hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                    draggable={false}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-xs mb-1">
                  Sistema de Gestión de Pedidos
                </p>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center justify-center gap-2">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Iniciar Sesión
              </h1>

              <div className="input-container mb-4">
                <Input
                  type="text"
                  value={loginData.username}
                  onChange={(e) =>
                    setLoginData({ ...loginData, username: e.target.value })
                  }
                  required
                  placeholder=" "
                  className="auth-input"
                />
                <Label className="auth-label">Usuario</Label>
              </div>

              <div className="input-container mb-4">
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                  placeholder=" "
                  className="auth-input"
                />
                <Label className="auth-label">Contraseña</Label>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors duration-300 text-sm underline mb-4"
              >
                ¿Olvidaste tu contraseña?
              </button>

              <Button
                type="submit"
                className="auth-button"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <User className="mr-2 h-4 w-4" />
                )}
                Iniciar Sesión
              </Button>
            </form>
          </div>

          {/* Panel superpuesto deslizante */}
          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">
                  ¡Bienvenido de Vuelta!
                </h1>
                <p className="mb-6 text-white/90 drop-shadow">Si ya tienes cuenta, inicia sesión aquí</p>
                <button
                  type="button"
                  className="overlay-button"
                  onClick={toggleToLogin}
                >
                  Iniciar Sesión
                </button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1 className="text-2xl font-bold mb-4 text-white drop-shadow-lg">¡Hola!</h1>
                <p className="mb-6 text-white/90 drop-shadow">Introduce tus datos y crea una cuenta</p>
                <button
                  type="button"
                  className="overlay-button"
                  onClick={toggleToRegister}
                >
                  Registrarse
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-sm rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-purple-200 dark:border-slate-700 shadow-2xl dialog-content">
          <DialogHeader className="text-center pb-3">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
              ¿Olvidaste tu contraseña?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-center px-1">
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Para restablecer tu contraseña, necesitas ponerte en contacto con
              el administrador del sistema.
            </p>

            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-3 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-300 text-sm">
                  Contacto por Teams
                </span>
              </div>
              <p className="text-blue-600 text-xs mb-2">
                Comunícate con el administrador a través de Microsoft Teams para
                solicitar el restablecimiento de tu contraseña.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              className="flex-1 h-9 rounded-lg border border-purple-200 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 text-gray-800 dark:text-gray-200 text-sm"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                window.open(`msteams:/l/chat/0/0?users=admin`);
              }}
              className="flex-1 h-9 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-sm"
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Abrir Teams
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}