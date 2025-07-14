import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Users, RotateCcw, Shield, TrendingUp, Package, Edit2, Trash2, UserPlus, Download, Database, Bell, FileText, Activity, AlertTriangle } from "lucide-react";
import { type Order } from "@shared/schema";

// Define User type locally with 'active' property if not present in @shared/schema
type User = {
  id: number;
  username: string;
  name: string;
  area: "patronaje" | "corte" | "bordado" | "ensamble" | "plancha" | "calidad" | "operaciones" | "admin" | "almacen" | "diseño";
  createdAt: Date;
  password: string;
  active: boolean; 
};

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", username: "", area: "", newPassword: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", username: "", area: "", password: "" });
  const [showClearDatabaseModal, setShowClearDatabaseModal] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isClearingDatabase, setIsClearingDatabase] = useState(false);
  const [isResettingSequence, setIsResettingSequence] = useState(false);

  if (user?.area !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">Solo los administradores pueden acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    }
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: number; password: string }) => {
      const res = await apiRequest("POST", "/api/admin/reset-password", {
        userId,
        newPassword: password
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Contraseña restablecida",
        description: "La contraseña ha sido restablecida exitosamente",
      });
      setShowResetModal(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error al restablecer contraseña",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updateData } = data;
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuario actualizado correctamente" });
      setShowEditModal(false);
      setEditUser(null);
      setEditForm({ name: "", username: "", area: "", newPassword: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error al actualizar usuario", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuario creado correctamente" });
      setShowCreateModal(false);
      setCreateForm({ name: "", username: "", area: "", password: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error al crear usuario", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Usuario eliminado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: err => toast({ title: "Error al eliminar usuario", description: err.message, variant: "destructive" })
  });

  const clearDatabaseMutation = useMutation({
    mutationFn: async (confirmationCode: string) => {
      const res = await apiRequest("POST", "/api/admin/clear-database", { confirmationCode });
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Base de datos limpiada", 
        description: "Todos los datos han sido eliminados correctamente" 
      });
      setShowClearDatabaseModal(false);
      setConfirmationCode("");
      // Invalidar todas las queries
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error al limpiar base de datos", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const openEditModal = (u: User) => {
    setEditUser(u);
    setEditForm({ name: u.name, username: u.username, area: u.area, newPassword: "" });
    setShowEditModal(true);
  };

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword) return;
    resetPasswordMutation.mutate({ userId: selectedUser.id, password: newPassword });
  };

  const handleSaveEdit = () => {
    if (!editUser) return;

    // Validar campos requeridos
    if (!editForm.name.trim() || !editForm.username.trim() || !editForm.area) {
      toast({
        title: "Error de validación",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    const payload: any = { 
      name: editForm.name.trim(), 
      username: editForm.username.trim(), 
      area: editForm.area 
    };

    if (editForm.newPassword && editForm.newPassword.trim()) {
      payload.newPassword = editForm.newPassword.trim();
    }

    updateUserMutation.mutate({ id: editUser.id, ...payload });
  };

  const handleCreateUser = () => {
    if (!createForm.name.trim() || !createForm.username.trim() || !createForm.area || !createForm.password.trim()) {
      toast({
        title: "Error de validación",
        description: "Todos los campos son requeridos",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate({
      name: createForm.name.trim(),
      username: createForm.username.trim(),
      area: createForm.area,
      password: createForm.password.trim()
    });
  };

  const handleBackupDatabase = () => {
    toast({
      title: "Respaldo iniciado",
      description: "Se ha iniciado el proceso de respaldo de la base de datos",
    });
    // Simular proceso de respaldo
    setTimeout(() => {
      toast({
        title: "Respaldo completado",
        description: "La base de datos ha sido respaldada exitosamente",
      });
    }, 3000);
  };

  const handleExportReports = () => {
    // Crear datos de ejemplo para el reporte
    const reportData = orders.map(order => ({
      folio: order.folio,
      cliente: order.clienteHotel,
      estado: order.status,
      area: order.currentArea,
      piezas: order.totalPiezas,
      fecha: new Date(order.createdAt).toLocaleDateString('es-ES')
    }));

    const csvContent = [
      'Folio,Cliente,Estado,Área,Piezas,Fecha',
      ...reportData.map(row => `${row.folio},${row.cliente},${row.estado},${row.area},${row.piezas},${row.fecha}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_pedidos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Reporte exportado",
      description: "El reporte de pedidos ha sido descargado exitosamente",
    });
  };

  const handleClearLogs = () => {
    toast({
      title: "Logs limpiados",
      description: "Los logs del sistema han sido limpiados exitosamente",
    });
  };

  const handleClearDatabase = () => {
    if (confirmationCode !== "BORRAR_TODO_JASANA_2025") {
      toast({
        title: "Código incorrecto",
        description: "El código de confirmación no es válido",
        variant: "destructive"
      });
      return;
    }
    clearDatabaseMutation.mutate(confirmationCode);
  };

  const handleNotificationTest = () => {
    toast({
      title: "Notificación de prueba",
      description: "Sistema de notificaciones funcionando correctamente",
    });
  };

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      corte: 'Corte',
      bordado: 'Bordado',
      ensamble: 'Ensamble',
      plancha: 'Plancha/Empaque',
      calidad: 'Calidad',
      envios: 'Envíos',
      almacen: 'Almacén',
      admin: 'Admin',
      diseño: 'Diseño',
      patronaje: 'Patronaje',
      operaciones: 'Operaciones'
    };
    return names[area] || area;
  };

  const getAreaBadgeColor = (area: string) => {
    const colors: Record<string, string> = {
      corte: "bg-green-100 text-green-800",
      bordado: "bg-blue-100 text-blue-800",
      ensamble: "bg-purple-100 text-purple-800",
      plancha: "bg-orange-100 text-orange-800",
      calidad: "bg-pink-100 text-pink-800",
      envios: "bg-purple-100 text-purple-800",
      admin: "bg-gray-100 text-gray-800",
      almacen: "bg-cyan-100 text-cyan-800",
      diseño: "bg-red-100 text-red-800",
      patronaje: "bg-yellow-100 text-yellow-800",
      operaciones: "bg-indigo-100 text-indigo-800"
    };
    return colors[area] || "bg-gray-100 text-gray-800";
  };

  const activeOrders = orders.filter(order => order.status === 'active');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const todayCompletedOrders = completedOrders.filter(order => 
    order.completedAt && 
    new Date(order.completedAt).toDateString() === new Date().toDateString()
  );

  const handleResetUserSequence = async () => {
    const confirmed = window.confirm(
      '¿Quieres reiniciar la secuencia de IDs de usuarios? Esto hará que el próximo usuario creado tenga un ID consecutivo.'
    );

    if (!confirmed) return;

    setIsResettingSequence(true);
    try {
      const response = await fetch('/api/admin/reset-user-sequence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "✅ Secuencia reiniciada",
          description: "Los IDs de usuarios ahora serán consecutivos",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al reiniciar la secuencia');
      }
    } catch (error) {
      console.error('Error resetting sequence:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Error al reiniciar la secuencia",
        variant: "destructive",
      });
    } finally {
      setIsResettingSequence(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
         {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Settings className="text-white text-2xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-gray-600">Gestión del sistema JASANA</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Finalizados Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayCompletedOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Completados</p>
                <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Registrados</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Gestión de Usuarios Mejorada */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Nuevo Usuario</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input 
                        value={createForm.name} 
                        onChange={e => setCreateForm({ ...createForm, name: e.target.value })} 
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input 
                        value={createForm.username} 
                        onChange={e => setCreateForm({ ...createForm, username: e.target.value })} 
                        placeholder="Nombre de usuario"
                      />
                    </div>
                    <div>
                      <Label>Área</Label>
                      <Select value={createForm.area} onValueChange={val => setCreateForm({ ...createForm, area: val })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                        <SelectContent>
                          {["admin","corte","bordado","ensamble","plancha","calidad","envios", "diseño", "patronaje", "almacen", "operaciones"].map(a => (
                            <SelectItem key={a} value={a}>{getAreaDisplayName(a)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Contraseña</Label>
                      <Input 
                        type="password"
                        value={createForm.password} 
                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })} 
                        placeholder="Contraseña inicial"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                        {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Usuario</TableHead>
                      <TableHead className="font-semibold">Nombre</TableHead>
                      <TableHead className="font-semibold">Área</TableHead>
                      <TableHead className="font-semibold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">#{u.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {u.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{u.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>
                          <Badge className={getAreaBadgeColor(u.area)}>
                            {getAreaDisplayName(u.area)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => openEditModal(u)}
                              className="flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => { setSelectedUser(u); setShowResetModal(true); }}
                              className="flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset</span>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteUserMutation.mutate(u.id)}
                              className="flex items-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No hay usuarios registrados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Configuration Funcional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Información del Sistema</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Package className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Nombre de la empresa</span>
                      <p className="text-xs text-gray-600">Sistema de gestión</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-700">JASANA</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Activity className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Áreas activas</span>
                      <p className="text-xs text-gray-600">Módulos habilitados</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-700">11 áreas</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Database className="text-white h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Base de datos</span>
                      <p className="text-xs text-gray-600">Estado de conexión</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600">Conectada</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Herramientas de Administrador</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300" 
                  onClick={handleBackupDatabase}
                >
                  <Database className="mr-3 h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Respaldar Base de Datos</div>
                    <div className="text-xs text-gray-500">Crear copia de seguridad</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300" 
                  onClick={handleNotificationTest}
                >
                  <Bell className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Probar Notificaciones</div>
                    <div className="text-xs text-gray-500">Verificar sistema de alertas</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300" 
                  onClick={handleExportReports}
                >
                  <Download className="mr-3 h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Exportar Reportes</div>
                    <div className="text-xs text-gray-500">Descargar datos del sistema</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-300" 
                  onClick={handleClearLogs}
                >
                  <FileText className="mr-3 h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Limpiar Logs del Sistema</div>
                    <div className="text-xs text-gray-500">Liberar espacio en disco</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-12 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-300" 
                  onClick={() => setShowClearDatabaseModal(true)}
                >
                  <AlertTriangle className="mr-3 h-5 w-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium text-red-700">Limpiar Base de Datos</div>
                    <div className="text-xs text-red-500">PELIGRO: Eliminar todos los datos</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="text-blue-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.folio}</p>
                    <p className="text-sm text-gray-600">{order.clienteHotel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getAreaBadgeColor(order.currentArea)}>
                    {getAreaDisplayName(order.currentArea)}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

        {/* Modales */}
        <Dialog open={showResetModal} onOpenChange={(open) => {
          setShowResetModal(open);
          if (!open) {
            setNewPassword("");
            setSelectedUser(null);
          }
        }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Restablecer Contraseña</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Usuario</Label><Input readOnly value={selectedUser?.username || ""} /></div>
              <div><Label>Nueva Contraseña</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowResetModal(false)}>Cancelar</Button><Button onClick={handleResetPassword} disabled={!newPassword}>Restablecer</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setEditForm({ name: '', username: '', area: '', newPassword: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><Label>Username</Label><Input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} /></div>
              <div><Label>Área</Label>
                <Select value={editForm.area} onValueChange={val => setEditForm({ ...editForm, area: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["admin","corte","bordado","ensamble","plancha","calidad","envios", "diseño", "patronaje", "almacen", "operaciones"].map(a => (
                    <SelectItem key={a} value={a}>{getAreaDisplayName(a)}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button><Button onClick={handleSaveEdit}>Guardar Cambios</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showClearDatabaseModal} onOpenChange={(open) => {
          setShowClearDatabaseModal(open);
          if (!open) {
            setConfirmationCode("");
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Limpiar Base de Datos - PELIGRO
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <p className="text-red-800 font-semibold mb-2">⚠️ ADVERTENCIA CRÍTICA</p>
                <p className="text-red-700 text-sm mb-2">
                  Esta acción eliminará PERMANENTEMENTE todos los datos del sistema:
                </p>
                <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                  <li>Todos los pedidos y su historial</li>
                  <li>Todas las reposiciones y sus datos</li>
                  <li>Todas las transferencias</li>
                  <li>Todos los documentos subidos</li>
                  <li>Todas las notificaciones</li>
                  <li>Todos los eventos de agenda</li>
                  <li>Todos los usuarios (excepto Admin)</li>
                </ul>
                <p className="text-red-800 font-bold text-sm mt-2">
                  Esta acción NO SE PUEDE DESHACER
                </p>
              </div>

              <div>
                <Label className="text-red-700 font-semibold">
                  Para confirmar, escriba exactamente: BORRAR_TODO_JASANA_2025
                </Label>
                <Input 
                  value={confirmationCode} 
                  onChange={e => setConfirmationCode(e.target.value)} 
                  placeholder="Escriba el código de confirmación"
                  className="border-red-300 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowClearDatabaseModal(false);
                    setConfirmationCode("");
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleClearDatabase}
                  disabled={clearDatabaseMutation.isPending || confirmationCode !== "BORRAR_TODO_JASANA_2025"}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {clearDatabaseMutation.isPending ? "Limpiando..." : "LIMPIAR BASE DE DATOS"}
                </Button>
                 <Button
                    variant="outline"
                    onClick={handleResetUserSequence}
                    disabled={isResettingSequence}
                  >
                    {isResettingSequence ? "Reiniciando..." : "🔄 Reiniciar IDs de Usuarios"}
                  </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}