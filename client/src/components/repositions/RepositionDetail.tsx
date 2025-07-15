import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUpload } from '@/components/ui/file-upload';
import { X, Clock, User, Package, FileText, Upload, Download, Printer } from 'lucide-react';
import { RepositionPrintSummary } from './RepositionPrintSummary';
import Swal from 'sweetalert2';
import { HistoryTimeline } from "@/components/shared/HistoryTimeline";

interface RepositionDetail {
  id: number;
  folio: string;
  type: string;
  solicitanteNombre: string;
  solicitanteArea: string;
  fechaSolicitud: string;
  noSolicitud: string;
  noHoja?: string;
  fechaCorte?: string;
  causanteDano: string;
  descripcionSuceso: string;
  modeloPrenda: string;
  tela: string;
  color: string;
  tipoPieza: string;
  urgencia: string;
  observaciones?: string;
  currentArea: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  consumoTela?: number;
  tipoAccidente?: string;
  areaCausanteDano?: string;
  telaContraste?: {
    tela: string;
    color: string;
    consumo: number;
    tipoPiezas?: Array<{
      tipoPieza: string;
      pieces: Array<{
        talla: string;
        cantidad: number;
      }>;
    }>;
  };
}

interface RepositionPiece {
  id: number;
  talla: string;
  cantidad: number;
  folioOriginal?: string;
}

interface RepositionHistory {
  id: number;
  action: string;
  description: string;
  fromArea?: string;
  toArea?: string;
  createdAt: string;
}

const statusColors = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-orange-100 text-orange-800'
};

const urgencyColors = {
  urgente: 'bg-red-100 text-red-800',
  intermedio: 'bg-yellow-100 text-yellow-800',
  poco_urgente: 'bg-green-100 text-green-800'
};

export function RepositionDetail({ 
  repositionId, 
  onClose 
}: { 
  repositionId: number; 
  onClose: () => void; 
}) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showPrintSummary, setShowPrintSummary] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: reposition, isLoading } = useQuery({
    queryKey: ['reposition', repositionId],
    queryFn: async () => {
      const response = await fetch(`/api/repositions/${repositionId}`);
      if (!response.ok) throw new Error('Failed to fetch reposition');
      return response.json();
    }
  });

  const { data: pieces = [], isLoading: isPiecesLoading } = useQuery({
    queryKey: ['reposition-pieces', repositionId],
    queryFn: async () => {
      const response = await fetch(`/api/repositions/${repositionId}/pieces`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log('Pieces data completa:', data);
      console.log('Pieces con folios:', data.filter(p => p.folioOriginal));
      data.forEach((piece, index) => {
        console.log(`Piece ${index}:`, {
          id: piece.id,
          talla: piece.talla,
          cantidad: piece.cantidad,
          folioOriginal: piece.folioOriginal,
          folioOriginalType: typeof piece.folioOriginal
        });
      });
      return data;
    }
  });

  const { data: history = [] } = useQuery({
    queryKey: ['reposition-history', repositionId],
    queryFn: async () => {
      const response = await fetch(`/api/repositions/${repositionId}/history`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: contrastPieces = [] } = useQuery({
    queryKey: ['reposition-contrast-pieces', repositionId],
    queryFn: async () => {
      const response = await fetch(`/api/repositions/${repositionId}/contrast-pieces`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['reposition-documents', repositionId],
    queryFn: async () => {
      const response = await fetch(`/api/repositions/${repositionId}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch(`/api/repositions/${repositionId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload documents');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reposition-documents', repositionId] });
      setSelectedFiles([]);
      setShowUpload(false);
      Swal.fire({
        title: '¡Éxito!',
        text: 'Documentos subidos correctamente',
        icon: 'success',
        confirmButtonColor: '#8B5CF6'
      });
    },
    onError: () => {
      Swal.fire({
        title: 'Error',
        text: 'Error al subir documentos',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  });

  const handleUploadDocuments = () => {
    if (selectedFiles.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Selecciona al menos un archivo',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
      return;
    }
    uploadDocumentsMutation.mutate(selectedFiles);
  };

  const handleDownloadFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/files/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al descargar el archivo',
        icon: 'error',
        confirmButtonColor: '#8B5CF6'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8">
          <div className="text-center dark:text-white">Cargando detalles...</div>
        </div>
      </div>
    );
  }

  if (!reposition) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                Detalles de Solicitud
              </h2>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {reposition.folio}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Badge className={statusColors[reposition.status as keyof typeof statusColors]}>
                  {reposition.status}
                </Badge>
                <Badge className={urgencyColors[reposition.urgencia as keyof typeof urgencyColors]}>
                  {reposition.urgencia}
                </Badge>
                <Badge variant="outline">
                  {reposition.type}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowPrintSummary(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Resumen Ensamble
                </Button>
                <Button variant="outline" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Información del Solicitante */}
          <Card className="dark:bg-slate-700 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <User className="w-5 h-5" />
                Información del Solicitante
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Nombre</p>
                <p className="dark:text-white">{reposition.solicitanteNombre}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Área</p>
                <p className="capitalize dark:text-white">{reposition.solicitanteArea}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Solicitud</p>
                <p className="dark:text-white">{new Date(reposition.fechaSolicitud).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Número de Solicitud */}
          <Card className="dark:bg-slate-700 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <FileText className="w-5 h-5" />
                Número de Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">No. Solicitud de Pedido</p>
                <p className="dark:text-white">{reposition.noSolicitud}</p>
              </div>
              {reposition.noHoja && (
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">No. de Hoja</p>
                  <p className="dark:text-white">{reposition.noHoja}</p>
                </div>
              )}
              {reposition.fechaCorte && (
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Corte</p>
                  <p className="dark:text-white">{new Date(reposition.fechaCorte).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descripción del Daño - Diferente para reproceso vs reposición */}
          <Card className="dark:bg-slate-700 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="dark:text-white">Descripción del Daño</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reposition.type === 'reproceso' ? (
                <>
                  {/* Campos específicos para reproceso */}
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Nombre del Causante del Daño</p>
                    <p className="dark:text-white">{reposition.causanteDano}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Tipo de Accidente</p>
                    <p className="dark:text-white">{reposition.tipoAccidente || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Área que causó el daño</p>
                    <p className="capitalize dark:text-white">{reposition.areaCausanteDano || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Área actual</p>
                    <p className="capitalize dark:text-white">{reposition.currentArea}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Descripción del Suceso</p>
                    <p className="whitespace-pre-wrap dark:text-white">{reposition.descripcionSuceso}</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Campos para reposición (formato original) */}
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Causante del Daño</p>
                    <p className="dark:text-white">{reposition.causanteDano}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Descripción del Suceso</p>
                    <p className="whitespace-pre-wrap dark:text-white">{reposition.descripcionSuceso}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Información del Producto - Solo para reposiciones */}
          {reposition.type !== 'reproceso' && (
            <Card className="dark:bg-slate-700 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Package className="w-5 h-5" />
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Modelo de la Prenda</p>
                  <p className="dark:text-white">{reposition.modeloPrenda}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Tela</p>
                  <p className="dark:text-white">{reposition.tela}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Color</p>
                  <p className="dark:text-white">{reposition.color}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Tipo de Pieza</p>
                  <p className="dark:text-white">{reposition.tipoPieza}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Piezas Totales</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {pieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0) + contrastPieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Urgencia</p>
                  <Badge className={urgencyColors[reposition.urgencia as keyof typeof urgencyColors]}>
                    {reposition.urgencia}
                  </Badge>
                </div>
                {pieces.some(piece => piece.folioOriginal && piece.folioOriginal !== null && piece.folioOriginal !== '') && (
                  <div className="md:col-span-2">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Folios Originales</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pieces
                        .filter(piece => piece.folioOriginal && piece.folioOriginal !== null && piece.folioOriginal !== '')
                        .map((piece, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {piece.folioOriginal}
                          </Badge>
                        ))
                      }
                    </div>
                  </div>
                )}
                {reposition.consumoTela && (
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Consumo de Tela</p>
                    <p className="dark:text-white">{reposition.consumoTela} metros</p>
                  </div>
                )}
                {reposition.consumoTela && (
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Valor Estimado</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${(reposition.consumoTela * 60).toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Segunda Tela - Solo para reposiciones con tela contraste */}
          {reposition.type !== 'reproceso' && reposition.telaContraste && (
            <Card className="dark:bg-slate-700 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Package className="w-5 h-5" />
                  Segunda Tela
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Tela</p>
                    <p className="dark:text-white">{reposition.telaContraste.tela || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Color</p>
                    <p className="dark:text-white">{reposition.telaContraste.color || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Tipos de Piezas</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {contrastPieces.length > 0 
                        ? contrastPieces.map(piece => piece.tipoPieza).filter((value, index, self) => self.indexOf(value) === index).join(', ')
                        : 'No especificado'
                      }
                    </p>
                  </div>
                </div>
                
                {/* Detalles de piezas de Segunda Tela */}
                {contrastPieces.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Detalles de Piezas:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contrastPieces.map((piece: any, index: number) => (
                        <div key={`contrast-info-${piece.id}`} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium text-blue-800 dark:text-blue-300">Tipo de Pieza:</span>
                              <p className="text-blue-700 dark:text-blue-200">{piece.tipoPieza}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800 dark:text-blue-300">Talla:</span>
                              <p className="text-blue-700 dark:text-blue-200">{piece.talla}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800 dark:text-blue-300">Cantidad:</span>
                              <p className="text-blue-700 dark:text-blue-200 font-bold">{typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0} piezas</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Piezas Solicitadas - Solo para reposiciones */}
          {reposition.type !== 'reproceso' && (pieces.length > 0 || contrastPieces.length > 0) && (
            <Card className="dark:bg-slate-700 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center justify-between dark:text-white">
                  <span>Piezas Solicitadas</span>
                  <Badge variant="outline" className="text-sm">
                    Total: {pieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0) + contrastPieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Sección de Tela Principal */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-lg">Tela Principal</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo de Pieza</TableHead>
                        <TableHead>Talla</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>No° Folio Original</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pieces.map((piece: RepositionPiece) => {
                        const cantidad = typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0;
                        return (
                          <TableRow key={`main-${piece.id}`}>
                            <TableCell className="font-medium">{reposition.tipoPieza}</TableCell>
                            <TableCell>{piece.talla}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{cantidad}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {piece.folioOriginal && piece.folioOriginal !== '' ? (
                                <Badge variant="outline" className="text-xs">
                                  {piece.folioOriginal}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">Sin folio</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {cantidad} pz
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-600 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Subtotal Tela Principal:</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {pieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                      </span>
                    </div>
                    {pieces.some(piece => piece.folioOriginal && piece.folioOriginal !== null && piece.folioOriginal !== '') && (
                      <div className="mt-2">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Folios incluidos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {pieces
                            .filter(piece => piece.folioOriginal && piece.folioOriginal !== null && piece.folioOriginal !== '')
                            .map((piece, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {piece.folioOriginal}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de Segunda Tela - Solo si hay piezas de segunda tela */}
                {contrastPieces.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-lg">Segunda Tela</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Pieza</TableHead>
                          <TableHead>Talla</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>No° Folio Original</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contrastPieces.map((piece: any) => {
                          const cantidad = typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0;
                          return (
                            <TableRow key={`contrast-${piece.id}`} className="bg-blue-50">
                              <TableCell className="font-medium">
                                {piece.tipoPieza || 'Tipo no especificado'}
                              </TableCell>
                              <TableCell>{piece.talla}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{cantidad}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                <span className="text-gray-400">-</span>
                              </TableCell>
                              <TableCell className="font-medium">
                                {cantidad} pz
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">Subtotal Segunda Tela:</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {contrastPieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">Detalles:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                          {contrastPieces.map((piece: any, index: number) => (
                            <div key={`detail-${piece.id}`} className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded">
                              <div className="text-xs text-blue-800 dark:text-blue-200">
                                <strong>{piece.tipoPieza || 'Tipo no especificado'}</strong> - 
                                Talla {piece.talla} - 
                                {typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0} piezas
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Resumen General Final */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-purple-800 dark:text-purple-300 text-xl">Total General de la Solicitud:</span>
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {pieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0) + contrastPieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-600 rounded">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Tela Principal:</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {pieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                      </span>
                    </div>
                    {contrastPieces.length > 0 && (
                      <div className="flex justify-between items-center p-2 bg-white dark:bg-slate-600 rounded">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Segunda Tela:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {contrastPieces.reduce((total, piece) => total + (typeof piece.cantidad === 'number' ? piece.cantidad : parseInt(piece.cantidad) || 0), 0)} piezas
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observaciones */}
          {reposition.observaciones && (
            <Card className="dark:bg-slate-700 dark:border-slate-600">
              <CardHeader>
                <CardTitle className="dark:text-white">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap dark:text-white">{reposition.observaciones}</p>
              </CardContent>
            </Card>
          )}



          {/* Documentos */}
          <Card className="dark:bg-slate-700 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="flex justify-between items-center dark:text-white">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos ({documents.length})
                </span>
                <Button 
                  onClick={() => setShowUpload(true)} 
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Añadir Documentos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="dark:text-gray-300">Nombre del Archivo</TableHead>
                      <TableHead className="dark:text-gray-300">Tamaño</TableHead>
                      <TableHead className="dark:text-gray-300">Subido por</TableHead>
                      <TableHead className="dark:text-gray-300">Fecha</TableHead>
                      <TableHead className="dark:text-gray-300">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="dark:text-white">{doc.originalName}</TableCell>
                        <TableCell className="dark:text-white">{(doc.size / 1024).toFixed(1)} KB</TableCell>
                        <TableCell className="dark:text-white">{doc.uploaderName}</TableCell>
                        <TableCell className="dark:text-white">
                          {new Date(doc.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(doc.filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No hay documentos adjuntos
                </p>
              )}

              {/* Upload Modal */}
              {showUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Añadir Documentos</h3>
                    <FileUpload
                      onFileSelect={setSelectedFiles}
                      label="Documentos adicionales"
                      description="Adjunta documentos relacionados con la reposición"
                      maxFiles={5}
                      maxSize={10}
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowUpload(false);
                          setSelectedFiles([]);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleUploadDocuments}
                        disabled={uploadDocumentsMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {uploadDocumentsMutation.isPending ? 'Subiendo...' : 'Subir'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado Actual */}
          <Card className="dark:bg-slate-700 dark:border-slate-600">
            <CardHeader>
              <CardTitle className="dark:text-white">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Área Actual</p>
                <p className="capitalize dark:text-white">{reposition.currentArea}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Creación</p>
                <p className="dark:text-white">{new Date(reposition.createdAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric', 
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Mexico_City'
                })}</p>
              </div>
              {reposition.approvedAt && (
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Fecha de Aprobación</p>
                  <p className="dark:text-white">{new Date(reposition.approvedAt).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'America/Mexico_City'
                  })}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-purple-600 hover:bg-purple-700">
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen de impresión */}
      {showPrintSummary && (
        <RepositionPrintSummary
          repositionId={repositionId}
          onClose={() => setShowPrintSummary(false)}
        />
      )}
    </div>
  );
}