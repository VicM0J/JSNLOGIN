import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import Swal from 'sweetalert2';
import { useEffect } from 'react';
  import { useQuery } from '@tanstack/react-query';


  interface RepositionPiece {
    talla: string;
    cantidad: number | string;
    folioOriginal?: string;
  }

  interface ProductInfo {
    modeloPrenda: string;
    tela: string;
    color: string;
    tipoPieza: string;
    consumoTela?: number; // metros de tela
    pieces: RepositionPiece[];
  }

  interface RepositionFormData {
  type: string;
  solicitanteNombre: string;
  solicitanteArea: string;
  fechaSolicitud: string;
  noSolicitud: string;
  noHoja?: string;
  fechaCorte?: string;
  causanteDano: string;
  descripcionSuceso: string;
  urgencia: string;
  observaciones?: string;
  currentArea: string;
  tipoAccidente?: string;
  otroAccidente?: string;
  volverHacer?: string;
  materialesImplicados?: string;
  areaCausanteDano?: string;
  productos: ProductInfo[];
}

  const areas = [
    'patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad', 'operaciones', 'diseño', 'almacen'
  ];

  const urgencyOptions = [
    { value: 'urgente', label: 'Urgente' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'poco_urgente', label: 'Poco Urgente' }
  ];

  const commonAccidents = [
    'Accidente por operario',
    'Bordado mal posicionado',
    'Costuras en mal estado',
    'Daño por maquilero',
    'Daño por máquina',
    'Defecto de tela',
    'Defecto en el ensamble',
    'Error de diseño',
    'Error de información',
    'Error de plancha',
    'Error en la fabricación',
    'Falla en el proceso de corte',
    'Problema de calidad',
    'Tela sucia o manchada',
    'Otro'
  ];

  export function RepositionForm({ onClose, repositionId }: { onClose: () => void; repositionId?: number }) {
    const queryClient = useQueryClient();
    const [productos, setProductos] = useState<ProductInfo[]>([{ 
      modeloPrenda: '', 
      tela: '', 
      color: '', 
      tipoPieza: '',
      consumoTela: 0,
      pieces: [{ talla: '', cantidad: 1, folioOriginal: '' }]
    }]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Query to load existing reposition data if editing
    const { data: existingReposition } = useQuery({
      queryKey: ['reposition', repositionId, 'edit'],
      queryFn: async () => {
        if (!repositionId) return null;
        const response = await fetch(`/api/repositions/${repositionId}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch reposition');
        return response.json();
      },
      enabled: !!repositionId,
      staleTime: 0, // Always consider data stale
      refetchOnMount: 'always' // Always refetch when component mounts
    });

    const { data: existingPieces = [] } = useQuery({
      queryKey: ['reposition-pieces', repositionId, 'edit'],
      queryFn: async () => {
        if (!repositionId) return [];
        const response = await fetch(`/api/repositions/${repositionId}/pieces?t=${Date.now()}`);
        if (!response.ok) return [];
        return response.json();
      },
      enabled: !!repositionId,
      staleTime: 0, // Always consider data stale
      refetchOnMount: 'always' // Always refetch when component mounts
    });

    const { data: existingProducts = [] } = useQuery({
      queryKey: ['reposition-products', repositionId, 'edit'],
      queryFn: async () => {
        if (!repositionId) return [];
        const response = await fetch(`/api/repositions/${repositionId}/products?t=${Date.now()}`);
        if (!response.ok) return [];
        return response.json();
      },
      enabled: !!repositionId,
      staleTime: 0, // Always consider data stale
      refetchOnMount: 'always' // Always refetch when component mounts
    });

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RepositionFormData>({
      defaultValues: {
        type: 'repocision',
        urgencia: 'intermedio',
        productos: [{ modeloPrenda: '', tela: '', color: '', tipoPieza: '', consumoTela: 0, pieces: [{ talla: '', cantidad: 1, folioOriginal: '' }] }]
      }
    });

    useEffect(() => {
      register('solicitanteArea', { required: 'Campo requerido' });
      register('currentArea', { required: 'Campo requerido' });
      register('tipoAccidente', { required: 'Campo requerido' });
      register('volverHacer');
      register('materialesImplicados');
    }, [register]);

    // Populate form with existing data when editing
    useEffect(() => {
      if (existingReposition) {
        setValue('type', existingReposition.type);
        setValue('solicitanteNombre', existingReposition.solicitanteNombre);
        setValue('noSolicitud', existingReposition.noSolicitud);
        setValue('noHoja', existingReposition.noHoja || '');
        setValue('fechaCorte', existingReposition.fechaCorte ? existingReposition.fechaCorte.split('T')[0] : '');
        setValue('causanteDano', existingReposition.causanteDano);
        setValue('tipoAccidente', existingReposition.tipoAccidente || '');
        setValue('otroAccidente', existingReposition.otroAccidente || '');
        setValue('solicitanteArea', existingReposition.solicitanteArea);
        setValue('currentArea', existingReposition.currentArea);
        setValue('descripcionSuceso', existingReposition.descripcionSuceso);
        setValue('urgencia', existingReposition.urgencia);
        setValue('observaciones', existingReposition.observaciones || '');
        setValue('volverHacer', existingReposition.volverHacer || '');
        setValue('materialesImplicados', existingReposition.materialesImplicados || '');

        if (existingReposition.type === 'repocision') {
          // Si hay productos adicionales, usarlos; si no, usar los datos principales
          if (existingProducts && existingProducts.length > 0) {
            const loadedProductos = existingProducts.map((product: any, index: number) => ({
              modeloPrenda: product.modeloPrenda || '',
              tela: product.tela || '',
              color: product.color || '',
              tipoPieza: product.tipoPieza || '',
              consumoTela: product.consumoTela || 0,
              pieces: existingPieces
                .filter((piece: any) => {
                  // Distribuir las piezas entre los productos
                  const piecesPerProduct = Math.ceil(existingPieces.length / existingProducts.length);
                  const startIndex = index * piecesPerProduct;
                  const endIndex = startIndex + piecesPerProduct;
                  const pieceIndex = existingPieces.indexOf(piece);
                  return pieceIndex >= startIndex && pieceIndex < endIndex;
                })
                .map((piece: any) => ({
                  talla: piece.talla,
                  cantidad: piece.cantidad,
                  folioOriginal: piece.folioOriginal || ''
                }))
            }));
            setProductos(loadedProductos);
          } else {
            // Fallback a los datos principales si no hay productos adicionales
            const newProductos = [{
              modeloPrenda: existingReposition.modeloPrenda || '',
              tela: existingReposition.tela || '',
              color: existingReposition.color || '',
              tipoPieza: existingReposition.tipoPieza || '',
              consumoTela: existingReposition.consumoTela || 0,
              pieces: existingPieces.map((piece: any) => ({
                talla: piece.talla,
                cantidad: piece.cantidad,
                folioOriginal: piece.folioOriginal || ''
              }))
            }];
            setProductos(newProductos);
          }
        }
      }
    }, [existingReposition, existingPieces, existingProducts, setValue]);



    const createRepositionMutation = useMutation({
      mutationFn: async (data: RepositionFormData) => {
        const formDataToSend = new FormData();

        // Collect all pieces from all products
        const allPieces = productos.flatMap(producto => producto.pieces);

        // Agregar datos del formulario con las piezas incluidas
        formDataToSend.append('repositionData', JSON.stringify({ 
          ...data, 
          pieces: allPieces,
          productos,
        }));

        // Agregar archivos
        selectedFiles.forEach((file) => {
          formDataToSend.append('documents', file);
        });

        const url = repositionId ? `/api/repositions/${repositionId}` : '/api/repositions';
        const method = repositionId ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          body: formDataToSend,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to ${repositionId ? 'update' : 'create'} reposition`);
        }
        return response.json();
      },
      onSuccess: () => {
        // Invalidate all repositions queries
        queryClient.invalidateQueries({ queryKey: ['repositions'] });

        if (repositionId) {
          // Remove all cached data for this reposition to force fresh fetch
          queryClient.removeQueries({ queryKey: ['reposition'] });
          queryClient.removeQueries({ queryKey: ['reposition-pieces'] });
          queryClient.removeQueries({ queryKey: ['reposition-products'] });
          queryClient.removeQueries({ queryKey: ['reposition-documents'] });
          queryClient.removeQueries({ queryKey: ['reposition-history'] });

          // Invalidate all related queries for this reposition with specific patterns
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey;
              return Array.isArray(key) && (
                key.includes('reposition') || 
                key.includes('reposition-pieces') || 
                key.includes('reposition-products') ||
                key.includes('reposition-documents') ||
                key.includes('reposition-history')
              );
            }
          });

          // Force immediate refetch for critical queries after a short delay
          setTimeout(() => {
            queryClient.refetchQueries({ 
              predicate: (query) => {
                const key = query.queryKey;
                return Array.isArray(key) && key.includes(repositionId);
              }
            });
          }, 200);
        }

        Swal.fire({
          title: '¡Éxito!',
          text: repositionId ? 'Solicitud editada y reenviada para aprobación' : 'Solicitud de reposición creada correctamente',
          icon: 'success',
          confirmButtonColor: '#8B5CF6'
        });
        onClose();
      },
      onError: (error) => {
        Swal.fire({
          title: 'Error',
          text: repositionId ? 'Error al editar la solicitud' : 'Error al crear la solicitud de reposición',
          icon: 'error',
          confirmButtonColor: '#8B5CF6'
        });
      }
    });



    const addProducto = () => {
      // Si ya existe al menos un producto, usar sus datos para el nuevo producto
      const baseProduct = productos.length > 0 ? {
        modeloPrenda: productos[0].modeloPrenda,
        tela: productos[0].tela,
        color: productos[0].color,
        tipoPieza: '', // Mantener vacío para que el usuario pueda especificar diferente tipo de pieza
        consumoTela: 0,
        pieces: [{ talla: '', cantidad: 1, folioOriginal: '' }]
      } : {
        modeloPrenda: '', 
        tela: '', 
        color: '', 
        tipoPieza: '', 
        consumoTela: 0,
        pieces: [{ talla: '', cantidad: 1, folioOriginal: '' }]
      };

      setProductos([...productos, baseProduct]);
    };

    const removeProducto = (index: number) => {
      setProductos(productos.filter((_, i) => i !== index));
    };

    const updateProducto = (index: number, field: keyof ProductInfo, value: string | number) => {
      const newProductos = [...productos];
      if (field === 'pieces') return; // Handle pieces separately
      newProductos[index] = { ...newProductos[index], [field]: value };
      setProductos(newProductos);
    };

    const addProductPiece = (productIndex: number) => {
      const newProductos = [...productos];
      newProductos[productIndex].pieces.push({ talla: '', cantidad: 1, folioOriginal: '' });
      setProductos(newProductos);
    };

    const removeProductPiece = (productIndex: number, pieceIndex: number) => {
      const newProductos = [...productos];
      newProductos[productIndex].pieces = newProductos[productIndex].pieces.filter((_, i) => i !== pieceIndex);
      setProductos(newProductos);
    };

    const updateProductPiece = (productIndex: number, pieceIndex: number, field: keyof RepositionPiece, value: string | number) => {
      const newProductos = [...productos];
      newProductos[productIndex].pieces[pieceIndex] = { 
        ...newProductos[productIndex].pieces[pieceIndex], 
        [field]: value 
      };
      setProductos(newProductos);
    };

    const calculateResourceCost = () => {
      let totalCost = 0;

      // Costo de tela principal (60 pesos por metro)
      productos.forEach(producto => {
        if (producto.consumoTela) {
          totalCost += producto.consumoTela * 60;
        }
      });

      return totalCost;
    };

    const onSubmit = async (data: RepositionFormData) => {
      // Validación específica para reposiciones
      if (data.type === 'repocision') {
        // Validate products and their pieces
        for (let i = 0; i < productos.length; i++) {
          const producto = productos[i];
          if (!producto.modeloPrenda || !producto.tela || !producto.color || !producto.tipoPieza) {
            Swal.fire({
              title: 'Error',
              text: `Todos los campos del producto ${i + 1} son requeridos`,
              icon: 'error',
              confirmButtonColor: '#8B5CF6'
            });
            return;
          }

          if (producto.pieces.some(p => !p.talla || p.cantidad < 1)) {
            Swal.fire({
              title: 'Error',
              text: `Todas las piezas del producto ${i + 1} deben tener talla y cantidad válida`,
              icon: 'error',
              confirmButtonColor: '#8B5CF6'
            });
            return;
          }
        }

        // Validar fecha de corte para cualquier área
        if (data.fechaCorte) {
          const fechaCorte = new Date(data.fechaCorte);
          const hoy = new Date();

          // Primer día del mes anterior
          const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);

          console.log('Validando fecha de corte:', { 
            fechaCorte: data.fechaCorte,
            fechaCorteDate: fechaCorte.toDateString(), 
            inicioMesAnterior: inicioMesAnterior.toDateString(),
            fechaCorteEsAnterior: fechaCorte < inicioMesAnterior
          });

          // Si la fecha de corte es anterior al inicio del mes pasado
          if (fechaCorte < inicioMesAnterior) {
            console.log('Fecha fuera de rango, mostrando SweetAlert...');

            const result = await Swal.fire({
              title: 'Fecha de Corte Fuera de Rango',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>LA FECHA DE CORTE SOBREPASA LOS DÍAS EN QUE EL ÁREA DE CORTE ALMACENA LOS TRAZOS, FAVOR DE PASAR LA REPOSICIÓN AL ÁREA DE PATRONAJE PRIMERO</strong></p>
                  <br>
                  <p><strong>PONTE EN CONTACTO CON EL SUP DE CORTE PARA SABER SI TIENE O NO EL TRAZO A SU DISPOSICIÓN</strong></p>
                </div>
              `,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Continuar de todos modos',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#8B5CF6',
              cancelButtonColor: '#6b7280',
              width: '600px',
              allowOutsideClick: false,
              allowEscapeKey: false
            });

            console.log('Resultado del SweetAlert:', result);

            if (!result.isConfirmed) {
              console.log('Usuario canceló, deteniendo proceso');
              return;
            }

            console.log('Usuario confirmó continuar');
          }
        }
      }

      // Validación específica para reprocesos
      if (data.type === 'reproceso') {
        if (!data.volverHacer || !data.materialesImplicados) {
          Swal.fire({
            title: 'Error',
            text: 'Todos los campos del reproceso son requeridos',
            icon: 'error',
            confirmButtonColor: '#8B5CF6'
          });
          return;
        }
      }

      let formDataToSend = { ...data };

      // Solo mapear datos de productos para reposiciones
      if (data.type === 'repocision' && productos.length > 0) {
        const firstProduct = productos[0];
        formDataToSend = {
          ...formDataToSend,
          modeloPrenda: firstProduct.modeloPrenda,
          tela: firstProduct.tela,
          color: firstProduct.color,
          tipoPieza: firstProduct.tipoPieza,
          consumoTela: firstProduct.consumoTela || 0
        };
      } else if (data.type === 'reproceso') {
        // Para reprocesos, usar valores por defecto o vacíos
        formDataToSend = {
          ...formDataToSend,
          modeloPrenda: '',
          tela: '',
          color: '',
          tipoPieza: '',
          consumoTela: 0
        };
      }

      createRepositionMutation.mutate(formDataToSend);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-purple-800">
                {repositionId ? 'Editar Solicitud' : 'Nueva Solicitud'}
              </h2>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>

            {/* Tipo de Solicitud */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Solicitud</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={watch('type')} 
                  onValueChange={(value: 'repocision' | 'reproceso') => setValue('type', value)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="repocision" id="repocision" />
                    <Label htmlFor="repocision">Reposición</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reproceso" id="reproceso" />
                    <Label htmlFor="reproceso">Reproceso</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Información del Solicitante */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Solicitante</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="solicitanteNombre">Nombre del Solicitante *</Label>
                  <Input
                    id="solicitanteNombre"
                    {...register('solicitanteNombre', { required: 'Campo requerido' })}
                    className={errors.solicitanteNombre ? 'border-red-500' : ''}
                    uppercase={true}
                  />
                </div>
                <div>
                  <Label>Fecha de Solicitud</Label>
                  <Input value={new Date().toLocaleDateString()} disabled />
                </div>
              </CardContent>
            </Card>

            {/* Número de Solicitud */}
            <Card>
              <CardHeader>
                <CardTitle>Número de Solicitud</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="noSolicitud">Número de Solicitud de Pedido *</Label>
                  <Input
                    id="noSolicitud"
                    {...register('noSolicitud', { required: 'Campo requerido' })}
                    className={errors.noSolicitud ? 'border-red-500' : ''}
                    uppercase={true}
                  />
                </div>
                <div>
                  <Label htmlFor="noHoja">Número de Hoja</Label>
                  <Input id="noHoja" {...register('noHoja')} uppercase={true} />
                </div>
                <div>
                  <Label htmlFor="fechaCorte">Fecha de Corte</Label>
                  <Input 
                    id="fechaCorte" 
                    type="date" 
                    {...register('fechaCorte')} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Descripción del Daño */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción del Daño</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="causanteDano">Nombre del Causante del Daño *</Label>
                  <Input
                    id="causanteDano"
                    {...register('causanteDano', { required: 'Campo requerido' })}
                    className={errors.causanteDano ? 'border-red-500' : ''}
                    uppercase={true}
                  />
                </div>

                <div>
                  <Label htmlFor="tipoAccidente">Tipo de Accidente *</Label>
                  <Select
                    value={watch('tipoAccidente')}
                    onValueChange={(value) => setValue('tipoAccidente', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de accidente" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonAccidents.map((accident) => (
                        <SelectItem key={accident} value={accident}>
                          {accident}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipoAccidente && <p className="text-red-500 text-sm">Campo requerido</p>}
                </div>

                {watch('tipoAccidente') === 'Otro' && (
                  <div>
                    <Label htmlFor="otroAccidente">Especifique el tipo de accidente *</Label>
                    <Input
                      id="otroAccidente"
                      {...register('otroAccidente', { 
                        required: watch('tipoAccidente') === 'Otro' ? 'Campo requerido' : false 
                      })}
                      className={errors.otroAccidente ? 'border-red-500' : ''}
                      placeholder="Describe el tipo de accidente"
                      uppercase={true}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="solicitanteArea">Área que causó el daño *</Label>
                  <Select
                    value={watch('solicitanteArea')}
                    onValueChange={(value) => setValue('solicitanteArea', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area.charAt(0).toUpperCase() + area.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.solicitanteArea && <p className="text-red-500 text-sm">Campo requerido</p>}
                </div>

                <div>
                  <Label htmlFor="currentArea">Área actual *</Label>
                  <Select
                    value={watch('currentArea')}
                    onValueChange={(value) => setValue('currentArea', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area.charAt(0).toUpperCase() + area.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currentArea && <p className="text-red-500 text-sm">Campo requerido</p>}
                </div>

                <div>
                  <Label htmlFor="descripcionSuceso">Descripción del Suceso *</Label>
                  <Textarea
                    id="descripcionSuceso"
                    {...register('descripcionSuceso', { required: 'Campo requerido' })}
                    className={errors.descripcionSuceso ? 'border-red-500' : ''}
                    rows={3}
                    uppercase={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Información del Producto - Solo para reposiciones */}
            {watch('type') === 'repocision' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Información del Producto
                    <Button type="button" onClick={addProducto} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Producto
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {productos.map((producto, productIndex) => (
                      <div key={productIndex} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Producto {productIndex + 1}</h4>
                          {productos.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeProducto(productIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* Información básica del producto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div>
                            <Label>Modelo de la Prenda *</Label>
                            <Input
                              value={producto.modeloPrenda}
                              onChange={(e) => updateProducto(productIndex, 'modeloPrenda', e.target.value)}
                              placeholder="Modelo de prenda"
                              uppercase={true}
                            />
                          </div>
                          <div>
                            <Label>Tela *</Label>
                            <Input
                              value={producto.tela}
                              onChange={(e) => updateProducto(productIndex, 'tela', e.target.value)}
                              placeholder="Tipo de tela"
                              uppercase={true}
                            />
                          </div>
                          <div>
                            <Label>Color *</Label>
                            <Input
                              value={producto.color}
                              onChange={(e) => updateProducto(productIndex, 'color', e.target.value)}
                              placeholder="Color"
                              uppercase={true}
                            />
                          </div>
                          <div>
                            <Label>Tipo de Pieza *</Label>
                            <Input
                              value={producto.tipoPieza}
                              onChange={(e) => updateProducto(productIndex, 'tipoPieza', e.target.value)}
                              placeholder="ej. Manga, Delantero, Cuello"
                              uppercase={true}
                            />
                          </div>
                          {watch('currentArea') === 'corte' && (
                            <div>
                              <Label>Consumo de Tela (metros)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                value={producto.consumoTela || ''}
                                onChange={(e) => updateProducto(productIndex, 'consumoTela', parseFloat(e.target.value) || 0)}
                                placeholder="0.0"
                              />
                            </div>
                          )}
                        </div>

                        {/* Piezas del producto */}
                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <Label className="text-base font-medium">Piezas Solicitadas</Label>
                            <Button 
                              type="button" 
                              onClick={() => addProductPiece(productIndex)} 
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar Pieza
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {producto.pieces.map((piece, pieceIndex) => (
                              <div key={pieceIndex} className="flex gap-4 items-end">
                                <div className="flex-1">
                                  <Label>Talla</Label>
                                  <Input
                                    value={piece.talla}
                                    onChange={(e) => updateProductPiece(productIndex, pieceIndex, 'talla', e.target.value)}
                                    placeholder="ej. S, M, L, XL"
                                    uppercase={true}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label>Cantidad</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={piece.cantidad === 1 ? '' : piece.cantidad}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || value === '0') {
                                        updateProductPiece(productIndex, pieceIndex, 'cantidad', '');
                                      } else {
                                        const numValue = parseInt(value);
                                        if (!isNaN(numValue) && numValue > 0) {
                                          updateProductPiece(productIndex, pieceIndex, 'cantidad', numValue);
                                        }
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '' || e.target.value === '0') {
                                        updateProductPiece(productIndex, pieceIndex, 'cantidad', 1);
                                      }
                                    }}
                                    placeholder="1"
                                    className="text-center"
                                    uppercase={true}
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label>No° Folio Original</Label>
                                  <Input
                                    value={piece.folioOriginal || ''}
                                    onChange={(e) => updateProductPiece(productIndex, pieceIndex, 'folioOriginal', e.target.value)}
                                    placeholder="Opcional"
                                    uppercase={true}
                                  />
                                </div>
                                {producto.pieces.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeProductPiece(productIndex, pieceIndex)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información del Reproceso - Solo para reprocesos */}
            {watch('type') === 'reproceso' && (
              <Card>
                <CardHeader>
                  <CardTitle>Información del Reproceso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>

                    <Label htmlFor="volverHacer">¿Qué se debe volver a hacer? *</Label>
                    <Textarea
                      id="volverHacer"
                      {...register('volverHacer', { 
                        required: watch('type') === 'reproceso' ? 'Campo requerido' : false
                      })}
                      className={errors.volverHacer ? 'border-red-500' : ''}
                      rows={3}
                      placeholder="Describe detalladamente qué procesos deben repetirse..."
                      uppercase={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="materialesImplicados">Materiales Implicados *</Label>
                    <Textarea
                      id="materialesImplicados"
                      {...register('materialesImplicados', { 
                        required: watch('type') === 'reproceso' ? 'Campo requerido' : false
                      })}
                      className={errors.materialesImplicados ? 'border-red-500' : ''}
                      rows={3}
                      placeholder="Lista los materiales que están involucrados en el reproceso..."
                      uppercase={true}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cálculo de Recursos - Solo para área de corte y reposiciones */}
            {watch('currentArea') === 'corte' && watch('type') === 'repocision' && (
              <Card>
                <CardHeader>
                  <CardTitle>Cálculo de Recursos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Resumen de Costos</h4>
                      <div className="space-y-2 text-sm">
                        {productos.map((producto, index) => (
                          producto.consumoTela && producto.consumoTela > 0 && (
                            <div key={index} className="flex justify-between">
                              <span>{producto.modeloPrenda} - {producto.tela}</span>
                              <span>{producto.consumoTela} m × $60 = ${(producto.consumoTela * 60).toFixed(2)}</span>
                            </div>
                          )
                        ))}
                        <div className="border-t pt-2 font-medium flex justify-between">
                          <span>Total Estimado:</span>
                          <span>${calculateResourceCost().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Autorización */}
            <Card>
              <CardHeader>
                <CardTitle>Autorización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nivel de Urgencia *</Label>
                  <Select value={watch('urgencia')} onValueChange={(value: any) => setValue('urgencia', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="observaciones">Otras Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    {...register('observaciones')}
                    rows={3}
                    placeholder="Comentarios adicionales..."
                    uppercase={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card>
              <CardHeader>
                <CardTitle>Documentos de Soporte</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={setSelectedFiles}
                  label="Documentos de la Reposición"
                  description="Adjunta documentos relacionados con la reposición (PDF, XML)"
                  maxFiles={5}
                  maxSize={10}
                />
              </CardContent>
            </Card>

            {/* Alerta de tiempo para reposiciones */}
            {(() => {
              if (watch('type') === 'repocision' && !repositionId) {
                const now = new Date();
                const currentHour = now.getHours();
                if (currentHour >= 14) {
                  return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Horario de Procesamiento
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Son las {currentHour}:{now.getMinutes().toString().padStart(2, '0')} hrs. 
                              Es poco probable que esta solicitud se tome en cuenta hoy. 
                              Probablemente será procesada mañana a partir de las 8:00 AM.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}
            

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createRepositionMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createRepositionMutation.isPending 
                  ? (repositionId ? 'Guardando...' : 'Creando...') 
                  : (repositionId ? 'Guardar y Reenviar' : 'Crear Solicitud')
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }