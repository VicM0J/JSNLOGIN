
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
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
  ArrowRight,
  UserPlus,
  LogIn,
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

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      corte: "Corte",
      bordado: "Bordado",
      ensamble: "Ensamble",
      plancha: "Plancha/Empaque",
      calidad: "Calidad",
      envios: "Envíos",
      patronaje: "Patronaje",
      almacen: "Almacén",
      diseño: "Diseño",
      admin: "Administración"
    };
    return names[area] || area;
  };

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
      setLocation("/dashboard");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondos dinámicos y animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradientes animados de fondo */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/30 via-pink-400/20 to-blue-400/30 dark:from-purple-600/40 dark:via-pink-600/30 dark:to-blue-600/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/25 via-cyan-400/20 to-teal-400/25 dark:from-blue-600/35 dark:via-cyan-600/25 dark:to-teal-600/35 rounded-full mix-blend-multiply filter blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-400/20 via-purple-400/15 to-violet-400/20 dark:from-indigo-600/30 dark:via-purple-600/20 dark:to-violet-600/30 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow"></div>
        </div>

        {/* Partículas flotantes dinámicas */}
        <div className="absolute inset-0">
          {/* Partículas grandes */}
          <div className="absolute top-[10%] left-[15%] w-3 h-3 bg-purple-300/60 dark:bg-purple-400/70 rounded-full animate-float shadow-lg"></div>
          <div className="absolute top-[25%] right-[20%] w-2 h-2 bg-blue-300/50 dark:bg-blue-400/60 rounded-full animate-float-delayed shadow-md"></div>
          <div className="absolute bottom-[30%] left-[25%] w-4 h-4 bg-pink-300/40 dark:bg-pink-400/50 rounded-full animate-float-slow shadow-lg"></div>
          <div className="absolute bottom-[15%] right-[30%] w-2.5 h-2.5 bg-cyan-300/45 dark:bg-cyan-400/55 rounded-full animate-float shadow-md"></div>
          <div className="absolute top-[60%] left-[10%] w-3.5 h-3.5 bg-indigo-300/35 dark:bg-indigo-400/45 rounded-full animate-float-delayed shadow-lg"></div>
          <div className="absolute top-[40%] right-[15%] w-2 h-2 bg-violet-300/50 dark:bg-violet-400/60 rounded-full animate-float-slow shadow-md"></div>

          {/* Partículas medianas */}
          <div className="absolute top-[20%] left-[40%] w-1.5 h-1.5 bg-emerald-300/40 dark:bg-emerald-400/50 rounded-full animate-float"></div>
          <div className="absolute bottom-[40%] right-[25%] w-2 h-2 bg-rose-300/45 dark:bg-rose-400/55 rounded-full animate-float-delayed"></div>
          <div className="absolute top-[70%] left-[60%] w-1 h-1 bg-amber-300/50 dark:bg-amber-400/60 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-[60%] right-[45%] w-1.5 h-1.5 bg-teal-300/35 dark:bg-teal-400/45 rounded-full animate-float"></div>

          {/* Partículas pequeñas */}
          <div className="absolute top-[35%] left-[70%] w-1 h-1 bg-sky-300/60 dark:bg-sky-400/70 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-[25%] left-[50%] w-0.5 h-0.5 bg-orange-300/50 dark:bg-orange-400/60 rounded-full animate-float"></div>
          <div className="absolute top-[80%] right-[40%] w-1 h-1 bg-lime-300/40 dark:bg-lime-400/50 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-[50%] left-[80%] w-0.5 h-0.5 bg-fuchsia-300/55 dark:bg-fuchsia-400/65 rounded-full animate-float-delayed"></div>
        </div>

        {/* Formas geométricas animadas */}
        <div className="absolute inset-0">
          {/* Triángulos */}
          <div className="absolute top-[15%] right-[10%] w-6 h-6 border-l-2 border-b-2 border-purple-200/30 dark:border-purple-300/40 rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-[20%] left-[40%] w-4 h-4 border-l-2 border-b-2 border-blue-200/25 dark:border-blue-300/35 rotate-45 animate-spin-slow delay-1000"></div>
          
          {/* Cuadrados */}
          <div className="absolute top-[50%] left-[5%] w-3 h-3 border border-pink-200/20 dark:border-pink-300/30 rotate-12 animate-pulse-slow"></div>
          <div className="absolute bottom-[35%] right-[5%] w-5 h-5 border border-cyan-200/25 dark:border-cyan-300/35 rotate-45 animate-pulse-slow delay-500"></div>

          {/* Líneas decorativas */}
          <div className="absolute top-[30%] right-[50%] w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-200/30 to-transparent dark:via-indigo-300/40 rotate-12 animate-pulse"></div>
          <div className="absolute bottom-[45%] left-[20%] w-12 h-0.5 bg-gradient-to-r from-transparent via-violet-200/25 to-transparent dark:via-violet-300/35 -rotate-12 animate-pulse delay-700"></div>
        </div>

        {/* Ondas de fondo */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-100/50 via-transparent to-transparent dark:from-slate-800/50 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-slate-50/30 via-transparent to-transparent dark:from-slate-900/30 animate-pulse-slow delay-1000"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          
          {/* Panel izquierdo - Información */}
          <div className="hidden lg:block space-y-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-2xl shadow-lg mb-6">
                <img
                  src="/LogoJASANA.png"
                  alt="JASANA"
                  className="w-16 h-14 object-contain filter brightness-0 invert"
                />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Bienvenido a JASANA
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                Sistema de Gestión de Pedidos
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Rápido y Optimizado
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Procesa pedidos y transferencias de manera ágil y eficiente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Gestión Centralizada
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Controla toda la producción desde una sola plataforma integrada.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Colaboración en Equipo
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Trabaja de manera coordinada con todas las áreas de producción.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel derecho - Formularios */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 transition-all duration-300">
              
              {/* Tabs de navegación */}
              <div className="flex space-x-1 mb-8 p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl">
                <button
                  onClick={() => setIsRegisterMode(false)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                    !isRegisterMode
                      ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsRegisterMode(true)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isRegisterMode
                      ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Registrarse</span>
                  </div>
                </button>
              </div>

              {/* Logo mobile */}
              <div className="lg:hidden text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-2xl shadow-lg mb-4">
                  <img
                    src="/LogoJASANA.png"
                    alt="JASANA"
                    className="w-12 h-10 object-contain filter brightness-0 invert"
                  />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  JASANA
                </h2>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Sistema de Gestión de Pedidos
                </p>
              </div>

              {/* Formulario de Login */}
              {!isRegisterMode && (
                <div className="animate-fade-in-slide">
                  <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Usuario
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="username"
                          type="text"
                          value={loginData.username}
                          onChange={(e) =>
                            setLoginData({ ...loginData, username: e.target.value })
                          }
                          required
                          placeholder="Ingresa tu usuario"
                          className="pl-10 h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                          }
                          required
                          placeholder="Ingresa tu contraseña"
                          className="pl-10 pr-10 h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 dark:from-purple-500 dark:to-blue-500 dark:hover:from-purple-600 dark:hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-5 w-5" />
                    )}
                    Iniciar Sesión
                  </Button>
                </form>
                </div>
              )}

              {/* Formulario de Registro */}
              {isRegisterMode && (
                <div className="animate-fade-in-slide">
                  <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-username" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Usuario
                        </Label>
                        <Input
                          id="reg-username"
                          type="text"
                          value={registerData.username}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              username: e.target.value,
                            })
                          }
                          required
                          placeholder="Usuario"
                          className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Nombre
                        </Label>
                        <Input
                          id="reg-name"
                          type="text"
                          value={registerData.name}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, name: e.target.value })
                          }
                          required
                          placeholder="Nombre completo"
                          className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <Input
                          id="reg-password"
                          type={showRegisterPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          required
                          placeholder="Crea una contraseña"
                          className="pl-10 pr-10 h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-area" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Área de Trabajo
                      </Label>
                      <Select 
                        value={registerData.area}
                        onValueChange={(value) =>
                          setRegisterData({ ...registerData, area: value as any })
                        }
                      >
                        <SelectTrigger className="h-12 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Selecciona tu área" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                          <SelectItem value="corte" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Corte ✂️</SelectItem>
                          <SelectItem value="bordado" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Bordado 🪡</SelectItem>
                          <SelectItem value="ensamble" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Ensamble 🔧</SelectItem>
                          <SelectItem value="plancha" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Plancha/Empaque 👔</SelectItem>
                          <SelectItem value="calidad" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Calidad ✅</SelectItem>
                          <SelectItem value="envios" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Envíos 📦</SelectItem>
                          <SelectItem value="patronaje" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Patronaje 📐</SelectItem>
                          <SelectItem value="almacen" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Almacén 🏪</SelectItem>
                          <SelectItem value="diseño" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Diseño 🎨</SelectItem>
                          <SelectItem value="admin" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600">Admin ⚙️</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {registerData.area && registerData.area !== "admin" && (
                      <div className="space-y-2">
                        <Label htmlFor="admin-password" className="text-sm font-medium text-orange-600 dark:text-orange-400">
                          Contraseña de Administrador
                        </Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500 dark:text-orange-400" />
                          <Input
                            id="admin-password"
                            type="password"
                            value={registerData.adminPassword}
                            onChange={(e) =>
                              setRegisterData({
                                ...registerData,
                                adminPassword: e.target.value,
                              })
                            }
                            required
                            placeholder="Contraseña proporcionada por admin"
                            className="pl-10 h-12 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 focus:border-orange-500 dark:focus:border-orange-400 text-slate-900 dark:text-white placeholder:text-orange-500 dark:placeholder:text-orange-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-5 w-5" />
                    )}
                    Crear Cuenta
                  </Button>
                </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de contraseña olvidada */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="max-w-md rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
              ¿Olvidaste tu contraseña?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center px-2">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Para restablecer tu contraseña, necesitas ponerte en contacto con
              el administrador del sistema.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Contacto por Teams
                </span>
              </div>
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                Comunícate con el administrador a través de Microsoft Teams para
                solicitar el restablecimiento de tu contraseña.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => setShowForgotPassword(false)}
              className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                window.open(`msteams:/l/chat/0/0?users=admin`);
              }}
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Abrir Teams
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
