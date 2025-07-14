
import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, TrendingUp, Users, AlertTriangle, FileText, BarChart3, Target, Calendar, Activity } from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'];

export default function MetricsPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  if (user?.area !== 'admin') {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <Card className="max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Acceso Denegado</h2>
              <p className="text-gray-600">Solo los administradores pueden acceder a las métricas del sistema.</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const { data: monthlyMetrics, isLoading: monthlyLoading, error: monthlyError } = useQuery({
    queryKey: ['metrics', 'monthly', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/monthly?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar métricas mensuales');
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000
  });

  const { data: overallMetrics, isLoading: overallLoading, error: overallError } = useQuery({
    queryKey: ['metrics', 'overall'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/overall');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar métricas generales');
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000
  });

  const { data: requestAnalysis, isLoading: requestLoading, error: requestError } = useQuery({
    queryKey: ['metrics', 'requests'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/requests');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar análisis de solicitudes');
      }
      return response.json();
    },
    retry: 3,
    retryDelay: 1000
  });

  const handleExport = async (type: 'monthly' | 'overall' | 'requests') => {
    try {
      const params = type === 'monthly' ? `?month=${selectedMonth}&year=${selectedYear}` : '';
      const response = await fetch(`/api/metrics/export/${type}${params}`);

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `metricas-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
    }
  };

  const currentMonthName = new Date(parseInt(selectedYear), parseInt(selectedMonth)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Mejorado */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <BarChart3 className="text-white text-3xl" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">Centro de Métricas</h1>
                    <p className="text-blue-100 text-lg">Análisis inteligente y estadísticas avanzadas</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Última actualización</div>
                    <div className="text-white font-semibold">{new Date().toLocaleDateString('es-ES')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros Mejorados */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Período:</span>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48 border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {new Date(0, i).toLocaleDateString('es-ES', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32 border-2 border-blue-200 focus:border-blue-500 rounded-lg">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 3 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Generales - Tarjetas Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overallLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))
            ) : overallError ? (
              <div className="col-span-full text-center py-8 text-red-500">
                Error: {overallError.message}
              </div>
            ) : overallMetrics ? (
              [
                {
                  title: "Total Reposiciones",
                  value: overallMetrics.totalRepositions,
                  icon: FileText,
                  gradient: "from-blue-500 to-blue-600",
                  bgColor: "bg-blue-50",
                  iconColor: "text-blue-600"
                },
                {
                  title: "Total Piezas",
                  value: overallMetrics.totalPieces,
                  icon: Users,
                  gradient: "from-green-500 to-green-600",
                  bgColor: "bg-green-50",
                  iconColor: "text-green-600"
                },
                {
                  title: "Área Más Activa",
                  value: overallMetrics.mostActiveArea,
                  icon: Target,
                  gradient: "from-purple-500 to-purple-600",
                  bgColor: "bg-purple-50",
                  iconColor: "text-purple-600"
                },
                {
                  title: "Promedio Mensual",
                  value: overallMetrics.monthlyAverage,
                  icon: TrendingUp,
                  gradient: "from-orange-500 to-orange-600",
                  bgColor: "bg-orange-50",
                  iconColor: "text-orange-600"
                }
              ].map((metric, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{metric.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                      </div>
                      <div className={`w-14 h-14 ${metric.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <metric.icon className={`${metric.iconColor} text-2xl`} size={28} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : null}
          </div>

          {/* Métricas Mensuales */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-6 w-6" />
                  <CardTitle className="text-2xl">Análisis de {currentMonthName}</CardTitle>
                </div>
                <Button 
                  onClick={() => handleExport('monthly')} 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {monthlyLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : monthlyError ? (
                <div className="text-center py-16">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 text-lg font-medium">{monthlyError.message}</p>
                </div>
              ) : monthlyMetrics ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Gráfico de barras mejorado */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      Reposiciones por Área
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyMetrics.byArea}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="area" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: 'white'
                          }} 
                        />
                        <Bar dataKey="count" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de pastel mejorado */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Distribución Porcentual</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={monthlyMetrics.byArea}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ area, percentage }) => `${area}: ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {monthlyMetrics.byArea.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: 'white'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tarjetas de estadísticas mejoradas */}
                  <div className="xl:col-span-2">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Estadísticas Detalladas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {monthlyMetrics.byArea.map((area: any, index: number) => (
                        <Card key={area.area} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <p className="font-bold text-gray-800 text-lg">{area.area}</p>
                                <div className="space-y-1">
                                  <p className="text-sm text-gray-600">{area.count} reposiciones</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  style={{ 
                                    backgroundColor: COLORS[index % COLORS.length],
                                    fontSize: '16px',
                                    padding: '8px 12px'
                                  }}
                                  className="text-white font-bold"
                                >
                                  {area.percentage}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg">No hay datos disponibles para este período</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Causas de Daño */}
          {monthlyMetrics?.byCause && (
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-3" />
                  Análisis de Causas de Daño - {currentMonthName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Distribución de Causas</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={monthlyMetrics.byCause}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="cause" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: 'white'
                          }} 
                        />
                        <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Ranking de Causas</h3>
                    <div className="space-y-3">
                      {monthlyMetrics.byCause.map((cause: any, index: number) => (
                        <div key={cause.cause} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-300">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-800">{cause.cause}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-gray-800">{cause.count}</span>
                            <Badge variant="outline" className="text-sm font-semibold">
                              {cause.percentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análisis por Número de Solicitud */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center">
                  <FileText className="h-6 w-6 mr-3" />
                  Análisis por Número de Solicitud
                </CardTitle>
                <Button 
                  onClick={() => handleExport('requests')} 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {requestLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                </div>
              ) : requestError ? (
                <div className="text-center py-16">
                  <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <p className="text-red-600 text-lg font-medium">{requestError.message}</p>
                </div>
              ) : requestAnalysis ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Solicitudes con Reposiciones",
                        value: requestAnalysis.totalRequestsWithRepositions,
                        icon: FileText,
                        color: "blue"
                      },
                      {
                        title: "Promedio Repos./Solicitud",
                        value: requestAnalysis.averageRepositionsPerRequest,
                        icon: TrendingUp,
                        color: "green"
                      },
                      {
                        title: "Solicitud Más Problemática",
                        value: requestAnalysis.mostProblematicRequest,
                        icon: AlertTriangle,
                        color: "red"
                      }
                    ].map((stat, index) => (
                      <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                              stat.color === 'blue' ? 'bg-blue-100' : 
                              stat.color === 'green' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <stat.icon className={`h-8 w-8 ${
                                stat.color === 'blue' ? 'text-blue-600' : 
                                stat.color === 'green' ? 'text-green-600' : 'text-red-600'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Top 10 Solicitudes con Más Reposiciones</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-orange-200">
                            <th className="text-left py-4 px-6 font-bold text-gray-700">No. Solicitud</th>
                            <th className="text-left py-4 px-6 font-bold text-gray-700">Reposiciones</th>
                            <th className="text-left py-4 px-6 font-bold text-gray-700">Reprocesos</th>
                            <th className="text-left py-4 px-6 font-bold text-gray-700">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestAnalysis.topRequests.map((request: any, index: number) => (
                            <tr key={request.noSolicitud} className="border-b border-orange-100 hover:bg-orange-50 transition-colors duration-200">
                              <td className="py-4 px-6 font-medium text-gray-800">{request.noSolicitud}</td>
                              <td className="py-4 px-6 text-gray-700">{request.reposiciones}</td>
                              <td className="py-4 px-6 text-gray-700">{request.reprocesos}</td>
                              <td className="py-4 px-6 font-bold text-gray-900">{request.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
