import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Eye, ArrowRight, CheckCircle, XCircle, Clock, MapPin, Activity, Trash2, Flag, Bell, Search, Play, Square, Printer, CalendarIcon } from 'lucide-react';
import { RepositionForm } from './RepositionForm';
import { RepositionDetail } from './RepositionDetail';
import { RepositionTracker } from './RepositionTracker';
import { RepositionPrintSummary } from './RepositionPrintSummary';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Reposition {
  id: number;
  folio: string;
  type: 'repocision' | 'reproceso';
  solicitanteNombre: string;
  solicitanteArea: string;
  fechaSolicitud: string;
  modeloPrenda: string;
  currentArea: string;
  status: 'pendiente' | 'aprobado' | 'rechazado' | 'en_proceso' | 'completado' | 'eliminado' | 'cancelado';
  urgencia: 'urgente' | 'intermedio' | 'poco_urgente';
  createdAt: string;
}

const areas = [
  'patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad', 'envios', 'operaciones', 'admin', 'almacen', 'diseño'
];

const statusColors = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completado: 'bg-gray-100 text-gray-800',
  eliminado: 'bg-red-100 text-red-800',
  cancelado: 'bg-orange-100 text-orange-800'
};

const urgencyColors = {
  urgente: 'bg-red-100 text-red-800',
  intermedio: 'bg-yellow-100 text-yellow-800',
  poco_urgente: 'bg-green-100 text-green-800'
};

const accidentFilters = [
  { value: 'all', label: 'Todos los accidentes' },
  { value: 'falla_tela', label: 'Falla de tela' },
  { value: 'accidente_maquina', label: 'Accidente con máquina' },
  { value: 'accidente_operario', label: 'Accidente por operario' },
  { value: 'actividad_mal_realizada', label: 'Actividad mal realizada' },
  { value: 'defecto_fabricacion', label: 'Defecto en fabricación' },
  { value: 'error_diseno', label: 'Error de diseño' },
  { value: 'problema_calidad', label: 'Problema de calidad' }
];

export function RepositionList({ userArea }: { userArea: string }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedReposition, setSelectedReposition] = useState<number | null>(null);
  const [trackedReposition, setTrackedReposition] = useState<number | null>(null);
  const [printSummaryReposition, setPrintSummaryReposition] = useState<number | null>(null);
  const [filterArea, setFilterArea] = useState<string>(userArea === 'admin' || userArea === 'envios' || userArea === 'diseño' ? 'all' : userArea);
  const [showHistory, setShowHistory] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccident, setFilterAccident] = useState<string>('all');
  const [activeTimers, setActiveTimers] = useState<Record<number, boolean>>({});
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({});
  const [transferModalId, setTransferModalId] = useState<number | null>(null);
  const [manualTimes, setManualTimes] = useState<Record<number, { startTime: string; endTime: string; startDate: Date | undefined; endDate: Date | undefined }>>({});
  const queryClient = useQueryClient();

  const { data: repositions = [], isLoading } = useQuery<Reposition[]>({
    queryKey: ['repositions', filterArea, showHistory, includeDeleted],
    queryFn: async () => {
      let url = '/api/repositions';

      if (showHistory && (userArea === 'admin' || userArea === 'envios')) {
        url = `/api/repositions/all?includeDeleted=${includeDeleted}`;
      } else if (filterArea && filterArea !== 'all') {
        url = `/api/repositions?area=${filterArea}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar las reposiciones');
      const data = await response.json();

      // Para admin y envíos, cuando no están en modo historial, aplicar filtro por área si está seleccionado
      if ((userArea === 'admin' || userArea === 'envios') && !showHistory && filterArea && filterArea !== 'all') {
        return data.filter((repo: any) => repo.currentArea === filterArea || repo.solicitanteArea === filterArea);
      }

      // Filtrar reposiciones completadas, eliminadas y canceladas para usuarios que no son admin ni envíos
      if (userArea !== 'admin' && userArea !== 'envios') {
        return data.filter((repo: any) => 
          repo.status !== 'completado' && 
          repo.status !== 'eliminado' && 
          repo.status !== 'cancelado'
        );
      }

      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error('Error al cargar notificaciones');
      const allNotifications = await res.json();
      return allNotifications.filter((n: any) => 
        !n.read && (
          n.type?.includes('reposition') || 
          n.type?.includes('completion') ||
          n.type === 'completion_approval_needed'
        )
      );
    },
  });

  const { data: pendingTransfers = [] } = useQuery({
    queryKey: ['transferencias-pendientes-reposicion'],
    queryFn: async () => {
      const response = await fetch('/api/repositions/transfers/pending');
      if (!response.ok) return [];
      return response.json();
    }
  });

  const transferMutation = useMutation({
    mutationFn: async ({ repositionId, toArea, notes, consumoTela }: { repositionId: number, toArea: string, notes?: string, consumoTela?: number }) => {
      const response = await fetch(`/api/repositions/${repositionId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toArea, notes, consumoTela }),
      });
      if (!response.ok) throw new Error('Error al transferir la reposición');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Solicitud transferida correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ repositionId, action, notes }: { repositionId: number, action: string, notes?: string }) => {
      const response = await fetch(`/api/repositions/${repositionId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      if (!response.ok) throw new Error('Error al procesar la aprobación');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Solicitud procesada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ repositionId, reason }: { repositionId: number, reason: string }) => {
      console.log('Cancelling reposition:', repositionId, 'with reason:', reason);
      const response = await fetch(`/api/repositions/${repositionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
        console.log('Cancel error response:', response.status, errorData);
        throw new Error(errorData.message || `Error ${response.status}: No se pudo cancelar la reposición`);
      }

      const data = await response.json();
      console.log('Cancel success response:', response.status, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Cancelada!',
        text: 'Reposición cancelada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    },
    onError: (error: Error) => {
      console.error('Cancel mutation error:', error);
      Swal.fire({
        title: '¡Cancelada!',
        text: 'Reposición cancelada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ repositionId }: { repositionId: number }) => {
      console.log('Deleting reposition:', repositionId);
      const response = await fetch(`/api/repositions/${repositionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error de conexión' }));
        console.log('Delete error response:', response.status, errorData);
        throw new Error(errorData.message || `Error ${response.status}: No se pudo eliminar la reposición`);
      }

      const data = await response.json();
      console.log('Delete success response:', response.status, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Eliminada!',
        text: 'Reposición eliminada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      Swal.fire({
        title: '¡Eliminada!',
        text: 'Reposición eliminada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async ({ repositionId, notes }: { repositionId: number, notes?: string }) => {
      const response = await fetch(`/api/repositions/${repositionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error('Error al completar la reposición');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Proceso completado correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const processTransferMutation = useMutation({
    mutationFn: async ({ transferId, action }: { transferId: number, action: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/repositions/transfers/${transferId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Error al procesar la transferencia');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      queryClient.invalidateQueries({ queryKey: ['transferencias-pendientes-reposicion'] });
      Swal.fire({
        title: '¡Éxito!',
        text: 'Transferencia procesada correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const startTimerMutation = useMutation({
    mutationFn: async (repositionId: number) => {
      console.log('Starting timer for reposition:', repositionId, 'user area:', userArea);
      const response = await fetch(`/api/repositions/${repositionId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: userArea }),
      });

      const data = await response.json();
      console.log('Timer start response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar el cronómetro');
      }
      return data;
    },
    onSuccess: (data, repositionId) => {
      setActiveTimers(prev => ({ ...prev, [repositionId]: true }));
      queryClient.invalidateQueries({ queryKey: ['repositions'] });
      Swal.fire({
        title: '¡Cronómetro iniciado!',
        text: 'Se ha comenzado a contar el tiempo para esta reposición',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    },
    onError: (error: any) => {
      console.error('Timer start error:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'No se pudo iniciar el cronómetro',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const handleStopTimer = async (repositionId: number) => {
    try {
      await fetch(`/api/repositions/${repositionId}/timer/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ area: userArea }),
      });

      setActiveTimers(prev => ({ ...prev, [repositionId]: false }));

      Swal.fire({
        title: '¡Éxito!',
        text: 'Tiempo registrado correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });

      queryClient.invalidateQueries({ queryKey: ['repositions'] });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al detener el cronómetro',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const updateManualTime = (repositionId: number, field: 'startTime' | 'endTime' | 'startDate' | 'endDate', value: string | Date) => {
    setManualTimes(prev => ({
      ...prev,
      [repositionId]: {
        ...prev[repositionId],
        [field]: value
      }
    }));
  };

  const handleSubmitManualTime = async (repositionId: number) => {
    const timeData = manualTimes[repositionId];
    if (!timeData?.startTime || !timeData?.endTime || !timeData?.startDate || !timeData?.endDate) {
      Swal.fire({
        title: 'Error',
        text: 'Debe completar las fechas y horas de inicio y fin',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }

    try {
      // Asegurar que las fechas estén en formato YYYY-MM-DD
      const startDate = timeData.startDate instanceof Date 
        ? format(timeData.startDate, 'yyyy-MM-dd')
        : timeData.startDate;
      const endDate = timeData.endDate instanceof Date 
        ? format(timeData.endDate, 'yyyy-MM-dd')
        : timeData.endDate;

      console.log('Sending manual time data:', {
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        startDate,
        endDate
      });

      const response = await fetch(`/api/repositions/${repositionId}/timer/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startTime: timeData.startTime,
          endTime: timeData.endTime,
          startDate,
          endDate
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al registrar tiempo');
      }

      Swal.fire({
        title: '¡Éxito!',
        text: 'Tiempo registrado correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });

      // Clear the manual time inputs for this reposition
      setManualTimes(prev => {
        const updated = { ...prev };
        delete updated[repositionId];
        return updated;
      });

      queryClient.invalidateQueries({ queryKey: ['repositions'] });
    } catch (error) {
      console.error('Error registering manual time:', error);
      Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Error al registrar tiempo',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  const handleTransfer = async (repositionId: number) => {
    // Verificar si se ha registrado el tiempo para esta área
    try {
      const response = await fetch(`/api/repositions/${repositionId}/timer`);
      const timer = await response.json();

      if (!timer || (!timer.manualStartTime && !timer.startTime)) {
        Swal.fire({
          title: 'Tiempo no registrado',
          text: 'Debe registrar el tiempo de trabajo antes de transferir la reposición.',
          icon: 'warning',
          confirmButtonColor: '#8B5CF6',
          confirmButtonText: 'Entendido'
        });
        return;
      }
    } catch (error) {
      console.error('Error verificando timer:', error);
    }

    // Obtener los datos de la reposición para verificar el tipo
    const currentReposition = repositions.find(r => r.id === repositionId);
    if (!currentReposition) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo encontrar la información de la reposición',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }

    const { value: toArea } = await Swal.fire({
      title: 'Transferir a Área',
      input: 'select',
      inputOptions: getRepositionNextAreas(userArea).reduce((acc, area) => {
        acc[area] = getAreaDisplayName(area);
        return acc;
      }, {} as Record<string, string>),
      inputPlaceholder: 'Selecciona un área',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      inputValidator: (value) => {
        if (!value) return 'Debes seleccionar un área';
      }
    });

    if (toArea) {
      let consumoTela = null;

      // Si el área actual es Corte y es una reposición (no reproceso), pedir el consumo de tela
      if (userArea === 'corte' && currentReposition.type === 'repocision') {
        const { value: consumo } = await Swal.fire({
          title: 'Consumo de Tela',
          text: 'Especifica la cantidad de tela utilizada (en metros)',
          input: 'number',
          inputAttributes: {
            min: '0',
            step: '0.1',
            placeholder: '0.0'
          },
          showCancelButton: true,
          confirmButtonColor: '#8B5CF6',
          inputValidator: (value) => {
            if (!value || parseFloat(value) < 0) {
              return 'Debes especificar una cantidad válida de tela';
            }
          }
        });

        if (consumo === undefined) return; // Usuario canceló
        consumoTela = parseFloat(consumo);
      }

      const { value: notes } = await Swal.fire({
        title: 'Notas de transferencia',
        input: 'textarea',
        inputPlaceholder: 'Notas adicionales (opcional)',
        showCancelButton: true,
        confirmButtonColor: '#8B5CF6'
      });

      if (notes !== undefined) { // Usuario no canceló
        transferMutation.mutate({ repositionId, toArea, notes, consumoTela: consumoTela === null ? undefined : consumoTela });
      }
    }
  };

  const handleApproval = async (repositionId: number, action: 'aprobado' | 'rechazado') => {
    const { value: notes } = await Swal.fire({
      title: `${action === 'aprobado' ? 'Aprobar' : 'Rechazar'} Solicitud`,
      input: 'textarea',
      inputPlaceholder: 'Comentarios (opcional)',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6'
    });

    if (notes !== undefined) {
      approveMutation.mutate({ repositionId, action, notes });
    }
  };

  const handleCancel = async (repositionId: number) => {
    const { value: reason } = await Swal.fire({
      title: '¿Cancelar reposición?',
      text: 'Esta acción cancelará la reposición pero se mantendrá en el historial',
      input: 'textarea',
      inputPlaceholder: 'Describe el motivo por el cual se cancela esta reposición *',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No cancelar',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Debes proporcionar un motivo para la cancelación';
        }
        if (value.trim().length < 10) {
          return 'El motivo debe tener al menos 10 caracteres';
        }
      }
    });

    if (reason !== undefined && reason.trim().length > 0) {
      cancelMutation.mutate({ repositionId, reason: reason.trim() });
    }
  };

  const handleDelete = async (repositionId: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará la reposición permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      deleteMutation.mutate({ repositionId });
    }
  };

  const handleComplete = async (repositionId: number) => {
    const { value: notes } = await Swal.fire({
      title: 'Finalizar Proceso',
      input: 'textarea',
      inputPlaceholder: 'Notas de finalización (opcional)',
      showCancelButton: true,
      confirmButtonColor: '#8B5CF6',
      confirmButtonText: userArea === 'admin' || userArea === 'envios' ? 'Finalizar' : 'Solicitar Finalización'
    });

    if (notes !== undefined) {
      completeMutation.mutate({ repositionId, notes });
    }
  };

  const handleProcessTransfer = async (transferId: number, action: 'accepted' | 'rejected') => {
    const result = await Swal.fire({
      title: `¿${action === 'accepted' ? 'Aceptar' : 'Rechazar'} transferencia?`,
      text: `Esta acción ${action === 'accepted' ? 'moverá la reposición a tu área' : 'rechazará la transferencia'}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === 'accepted' ? '#10B981' : '#EF4444',
      confirmButtonText: action === 'accepted' ? 'Aceptar' : 'Rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      processTransferMutation.mutate({ transferId, action });
    }
  };

  const handleStartTimer = (repositionId: number) => {
    startTimerMutation.mutate(repositionId);
  };

  // Filter repositions based on search term and accident type
  const filteredRepositions = repositions.filter((reposition: any) => {
    const matchesSearch = searchTerm === '' || 
      reposition.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reposition.solicitanteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reposition.modeloPrenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reposition.tipoAccidente?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAccident = filterAccident === 'all' || 
      reposition.tipoAccidente?.toLowerCase().includes(filterAccident.replace('_', ' '));

    return matchesSearch && matchesAccident;
  });

  const getRepositionNextAreas = (currentArea: string) => {
    // Todas las áreas disponibles para transferencia
    const allAreas = ['patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad', 'operaciones', 'envios', 'diseño', 'almacen'];

    // Filtrar el área actual para que no aparezca en las opciones
    return allAreas.filter(area => area !== currentArea);
  };

  const getAreaDisplayName = (area: string) => {
    const names: Record<string, string> = {
      'patronaje': 'Patronaje',
      'corte': 'Corte',
      'bordado': 'Bordado',
      'ensamble': 'Ensamble',
      'plancha': 'Plancha/Empaque',
      'calidad': 'Calidad',
      'operaciones': 'Operaciones',
      'envios': 'Envíos',
      'diseño': 'Diseño',
      'almacen': 'Almacén',
      'admin': 'Administración'
    };
    return names[area] || area.charAt(0).toUpperCase() + area.slice(1);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-purple-800">
          {userArea === 'diseño' ? 'Reposiciones Aprobadas' : 'Solicitudes de Reposición'}
        </h1>
        {userArea !== 'diseño' && (
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Solicitud
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por folio, solicitante, modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>

        {/* Filtro por tipo de accidente */}
        <Select value={filterAccident} onValueChange={setFilterAccident}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por accidente" />
          </SelectTrigger>
          <SelectContent>
            {accidentFilters.map(filter => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(userArea === 'admin' || userArea === 'envios' || userArea === 'diseño' || userArea === 'almacen') && (
          <>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{(userArea === 'diseño' || userArea === 'almacen') ? 'Todas las aprobadas' : 'Todas las áreas'}</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>
                    {area.charAt(0).toUpperCase() + area.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(userArea === 'admin' || userArea === 'envios') && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-history"
                    checked={showHistory}
                    onCheckedChange={setShowHistory}
                  />
                  <Label htmlFor="show-history">Ver historial completo</Label>
                </div>

                {showHistory && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-deleted"
                      checked={includeDeleted}
                      onCheckedChange={setIncludeDeleted}
                    />
                    <Label htmlFor="include-deleted">Incluir eliminadas</Label>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Transferencias Pendientes */}
      {pendingTransfers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="w-5 h-5" />
              Transferencias Pendientes ({pendingTransfers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTransfers.map((transfer: any) => (
                <div key={transfer.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Reposición desde {transfer.fromArea}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transfer.notes && `Notas: ${transfer.notes}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transfer.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleProcessTransfer(transfer.id, 'accepted')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleProcessTransfer(transfer.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de solicitudes */}
      <div className="grid gap-4">
        {repositions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay solicitudes de reposición
            </CardContent>
          </Card>
        ) : (
          filteredRepositions.map((reposition: Reposition) => (
            <Card key={reposition.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-purple-800">
                      {reposition.folio}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {reposition.solicitanteNombre} • {reposition.modeloPrenda}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[reposition.status]}>
                      {reposition.status}
                    </Badge>
                    <Badge className={urgencyColors[reposition.urgencia]}>
                      {reposition.urgencia}
                    </Badge>
                    <Badge variant="outline">
                      {reposition.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Área actual: {reposition.currentArea}</span>
                    <span>•</span>
                    <span>{new Date(reposition.createdAt).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Mexico_City'
                    })}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReposition(reposition.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTrackedReposition(reposition.id)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Seguimiento
                    </Button>

                    {userArea === 'ensamble' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrintSummaryReposition(reposition.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Resumen
                      </Button>
                    )}

                    {reposition.currentArea === userArea && (
                      <>
                        {reposition.status === 'aprobado' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransfer(reposition.id)}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" />
                              Transferir
                            </Button>

                            {/* Timer Controls */}
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50 mb-2"
                                onClick={async () => {
                                  // Verificar si ya existe un tiempo registrado para esta área
                                  try {
                                    const response = await fetch(`/api/repositions/${reposition.id}/timer`);

                                    if (response.ok) {
                                      const timer = await response.json();

                                      if (timer && (timer.manualStartTime || timer.startTime)) {
                                        Swal.fire({
                                          title: 'Tiempo ya registrado',
                                          text: 'Ya existe un tiempo registrado para esta reposición en su área.',
                                          icon: 'info',
                                          confirmButtonColor: '#8B5CF6',
                                          confirmButtonText: 'Entendido'
                                        });
                                        return;
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error checking timer:', error);
                                    // Continuar con el registro si hay error al verificar
                                    console.log('Proceeding with registration');
                                  }

                                  const existing = manualTimes[reposition.id];
                                  if (existing) {
                                    setManualTimes(prev => ({ ...prev, [reposition.id]: existing }));
                                  } else {
                                    setManualTimes(prev => ({ ...prev, [reposition.id]: { startTime: '', endTime: '', startDate: new Date(), endDate: new Date() } }));
                                  }
                                }}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Registrar Tiempo
                              </Button>

                              {manualTimes[reposition.id] && (
                                <div className="space-y-3 mt-2 p-3 border rounded-lg bg-gray-50">
                                  {/* Fecha y hora de inicio */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor={`start-date-${reposition.id}`} className="text-sm font-medium">Fecha de inicio:</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal mt-1",
                                              !manualTimes[reposition.id]?.startDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {manualTimes[reposition.id]?.startDate ? (
                                              format(manualTimes[reposition.id].startDate!, "PPP", { locale: es })
                                            ) : (
                                              <span>Fecha inicio</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={manualTimes[reposition.id]?.startDate}
                                            onSelect={(date) => updateManualTime(reposition.id, 'startDate', date)}
                                            disabled={(date) =>
                                              date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            locale={es}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <div>
                                      <Label htmlFor={`start-time-${reposition.id}`} className="text-sm font-medium">Hora de inicio:</Label>
                                      <Input
                                        type="time"
                                        id={`start-time-${reposition.id}`}
                                        value={manualTimes[reposition.id]?.startTime || ''}
                                        onChange={(e) => updateManualTime(reposition.id, 'startTime', e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Fecha y hora de fin */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label htmlFor={`end-date-${reposition.id}`} className="text-sm font-medium">Fecha de fin:</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal mt-1",
                                              !manualTimes[reposition.id]?.endDate && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {manualTimes[reposition.id]?.endDate ? (
                                              format(manualTimes[reposition.id].endDate!, "PPP", { locale: es })
                                            ) : (
                                              <span>Fecha fin</span>
                                            )}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={manualTimes[reposition.id]?.endDate}
                                            onSelect={(date) => updateManualTime(reposition.id, 'endDate', date)}
                                            disabled={(date) =>
                                              date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            locale={es}
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <div>
                                      <Label htmlFor={`end-time-${reposition.id}`} className="text-sm font-medium">Hora de fin:</Label>
                                      <Input
                                        type="time"
                                        id={`end-time-${reposition.id}`}
                                        value={manualTimes[reposition.id]?.endTime || ''}
                                        onChange={(e) => updateManualTime(reposition.id, 'endTime', e.target.value)}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      onClick={() => handleSubmitManualTime(reposition.id)}
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Guardar Tiempo
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => setManualTimes(prev => {
                                        const updated = { ...prev };
                                        delete updated[reposition.id];
                                        return updated;
                                      })}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {(userArea === 'operaciones' || userArea === 'admin' || userArea === 'envios') && 
                     reposition.status === 'pendiente' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50"
                          onClick={() => handleApproval(reposition.id, 'aprobado')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleApproval(reposition.id, 'rechazado')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rechazar
                        </Button>
                      </>
                    )}

                    {reposition.status !== 'completado' && reposition.status !== 'eliminado' && reposition.status !== 'cancelado' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-purple-600 hover:bg-purple-50"
                          onClick={() => handleComplete(reposition.id)}
                        >
                          <Flag className="w-4 h-4 mr-2" />
                          {userArea === 'admin' || userArea === 'envios' ? 'Finalizar' : 'Solicitar Finalización'}
                        </Button>

                        {(userArea === 'admin' || userArea === 'envios') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:bg-orange-50"
                            onClick={() => handleCancel(reposition.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        )}
                      </>
                    )}

                    {(userArea === 'admin' || userArea === 'envios') && 
                     reposition.status !== 'eliminado' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(reposition.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showForm && <RepositionForm onClose={() => setShowForm(false)} />}
      {selectedReposition && (
        <RepositionDetail
          repositionId={selectedReposition}
          onClose={() => setSelectedReposition(null)}
        />
      )}
      {trackedReposition && (
        <RepositionTracker
          repositionId={trackedReposition}
          onClose={() => setTrackedReposition(null)}
        />
      )}
      {printSummaryReposition && (
        <RepositionPrintSummary
          repositionId={printSummaryReposition}
          onClose={() => setPrintSummaryReposition(null)}
        />
      )}
    </div>
  );
}