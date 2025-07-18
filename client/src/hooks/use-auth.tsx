import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Swal from 'sweetalert2';

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = Pick<InsertUser, "username" | "password">;
type RegisterData = InsertUser & { adminPassword?: string };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { data: user, isLoading, error } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      console.log('[AUTH] Checking user authentication...');
      
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });

        console.log('[AUTH] Response status:', response.status);

        if (response.status === 401) {
          console.log('[AUTH] User not authenticated, status:', response.status);
          return null;
        }

        if (!response.ok) {
          console.error('[AUTH] Authentication error:', response.status, response.statusText);
          throw new Error(`Authentication failed: ${response.status}`);
        }

        const userData = await response.json();
        console.log('[AUTH] User authenticated:', userData);
        return userData;
      } catch (error) {
        console.error('[AUTH] Network error:', error);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry on 401 errors or network errors
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Authentication failed')) {
          return false;
        }
      }
      return failureCount < 1; // Reduce retries to avoid spam
    },
    refetchInterval: false, // Disable automatic refetching
    staleTime: 600000, // 10 minutes - increase cache time
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnReconnect: false, // Disable refetch on reconnect
    refetchOnMount: false, // Disable refetch on mount if data exists
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error de autenticación");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      Swal.fire({
        title: `¡Hola ${user.name}!`,
        text: 'Bienvenido al sistema JASANA',
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#8b5cf6',
        customClass: {
          popup: 'font-sans',
        },
      });
    },
    onError: (error: Error) => {
      let title = "Error de inicio de sesión";
      let text = "";
      let showRegisterButton = false;

      if (error.message.includes("Usuario no encontrado") || error.message.includes("not found")) {
        title = "Usuario no encontrado";
        text = "El usuario ingresado no existe en el sistema. ¿Te gustaría registrarte?";
        showRegisterButton = true;
      } else if (error.message.includes("Contraseña incorrecta") || error.message.includes("password")) {
        title = "Contraseña incorrecta";
        text = "La contraseña ingresada no es correcta. Por favor, verifica e intenta de nuevo.";
      } else if (error.message.includes("credenciales") || error.message.includes("credentials")) {
        title = "Credenciales inválidas";
        text = "El usuario o contraseña son incorrectos. Verifica tus datos e intenta nuevamente.";
      } else {
        text = error.message || "Ha ocurrido un error inesperado. Por favor, intenta de nuevo.";
      }

      if (showRegisterButton) {
        Swal.fire({
          title: title,
          text: text,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Registrarme',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#8b5cf6',
          cancelButtonColor: '#6b7280',
          customClass: {
            popup: 'font-sans',
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Aquí podrías activar el modo registro si tienes acceso al estado
            // O emitir un evento personalizado
            window.dispatchEvent(new CustomEvent('switchToRegister'));
          }
        });
      } else {
        Swal.fire({
          title: title,
          text: text,
          icon: 'error',
          confirmButtonText: 'Intentar de nuevo',
          confirmButtonColor: '#8b5cf6',
          customClass: {
            popup: 'font-sans',
          },
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      Swal.fire({
        title: `¡Hola ${user.name}!`,
        text: 'REGISTRO EXITOSO',
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 3000,
        timerProgressBar: true,
        confirmButtonColor: '#8b5cf6',
        customClass: {
          popup: 'font-sans',
        },
      });
    },
    onError: (error: Error) => {
      let title = "Error de registro";
      let text = "";

      if (error.message.includes("Usuario ya existe") || error.message.includes("already exists")) {
        title = "Usuario ya registrado";
        text = "Este nombre de usuario ya está en uso. Por favor, elige otro nombre de usuario.";
      } else if (error.message.includes("Contraseña de admin") || error.message.includes("admin")) {
        title = "Contraseña de administrador incorrecta";
        text = "La contraseña de administrador no es correcta. Contacta al administrador del sistema.";
      } else if (error.message.includes("área") || error.message.includes("area")) {
        title = "Área no válida";
        text = "El área seleccionada no es válida. Por favor, selecciona un área de trabajo.";
      } else {
        text = error.message || "Ha ocurrido un error durante el registro. Por favor, intenta de nuevo.";
      }

      Swal.fire({
        title: title,
        text: text,
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#8b5cf6',
        customClass: {
          popup: 'font-sans',
        },
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      Swal.fire({
        title: "¡Hasta pronto!",
        text: "Has cerrado sesión exitosamente",
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true,
        confirmButtonColor: '#8b5cf6',
        customClass: {
          popup: 'font-sans',
        },
      });
    },
    onError: (error: Error) => {
      Swal.fire({
        title: "Error al cerrar sesión",
        text: error.message || "Ha ocurrido un error al cerrar la sesión",
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#8b5cf6',
        customClass: {
          popup: 'font-sans',
        },
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}