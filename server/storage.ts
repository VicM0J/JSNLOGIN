import { 
  users, 
  orders, 
  orderPieces,
  transfers, 
  orderHistory, 
  notifications,
  repositions,
  repositionPieces,
  repositionProducts,
  repositionContrastFabrics,
  repositionTimers,
  repositionTransfers,
  repositionHistory,
  repositionMaterials,
  adminPasswords,
  agendaEvents,
  documents,
  type User, 
  type InsertUser,
  type Order,
  type InsertOrder,
  type Transfer,
  type InsertTransfer,
  type OrderHistory,
  type Notification,
  type InsertNotification,
  type Reposition,
  type InsertReposition,
  type RepositionPiece,
  type InsertRepositionPiece,
  type RepositionTimer as SharedRepositionTimer,
  type InsertRepositionTimer,
  type RepositionTransfer,
  type InsertRepositionTransfer,
  type RepositionHistory,
  type AdminPassword,
  type InsertAdminPassword,
  type AgendaEvent,
  type InsertAgendaEvent,
  type Area,
  type RepositionType,
  type RepositionStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ne, isNotNull, isNull, count, gte, lte, sql, asc } from 'drizzle-orm';
import bcrypt from "bcrypt";
import ExcelJS from 'exceljs';
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Configurar zona horaria de México
process.env.TZ = 'America/Mexico_City';

// Función helper para obtener fecha actual en zona horaria de México
const getMexicoTime = () => {
  return new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
};

// Función helper para crear timestamp con zona horaria de México
const createMexicoTimestamp = () => {
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return mexicoTime;
};

const PostgresSessionStore = connectPg(session);

// Función para enviar notificaciones por WebSocket
function broadcastNotification(notification: any) {
  const wss = (global as any).wss;
  if (wss) {
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
      }
    });
    console.log('Notificación enviada por WebSocket:', notification.title);
  } else {
    console.log('WebSocket no disponible para enviar notificación');
  }
}

export interface IStorage {
  // Métodos de métricas
  getMonthlyMetrics(month: number, year: number): Promise<any>;
  getOverallMetrics(): Promise<any>;
  getRequestAnalysis(): Promise<any>;
  exportMonthlyMetrics(month: number, year: number): Promise<Buffer>;
  exportOverallMetrics(): Promise<Buffer>;
  exportRequestAnalysis(): Promise<Buffer>;

  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAdminUser(): Promise<User | undefined>;
  resetUserPassword(userId: number, hashedPassword: string): Promise<void>;


  createOrder(order: InsertOrder, createdBy: number): Promise<Order>;
  getOrders(area?: Area): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrderByFolio(folio: string): Promise<Order | undefined>;
  completeOrder(orderId: number, completedBy: number): Promise<void>;
  deleteOrder(orderId: number): Promise<void>;
  pauseOrder(orderId: number, pausedBy: number, reason: string): Promise<void>;
  resumeOrder(orderId: number, resumedBy: number): Promise<void>;

  getOrderPieces(orderId: number): Promise<any[]>;
  updateOrderPieces(orderId: number, area: Area, pieces: number): Promise<void>;

  createTransfer(transfer: InsertTransfer, createdBy: number): Promise<Transfer>;
  getTransfersByArea(area: Area): Promise<Transfer[]>;
  getPendingTransfersForUser(userId: number): Promise<Transfer[]>;
  acceptTransfer(transferId: number, processedBy: number): Promise<void>;
  rejectTransfer(transferId: number, processedBy: number): Promise<void>;

  addOrderHistory(orderId: number, action: string, description: string, userId: number, options?: {
    fromArea?: Area;
    toArea?: Area;
    pieces?: number;
    reason?: string;
  }): Promise<void>;
  getOrderHistory(orderId: number): Promise<OrderHistory[]>;

  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(notificationId: number): Promise<void>;

  sessionStore: any;

  createReposition(reposition: InsertReposition & { folio: string }, pieces: InsertRepositionPiece[], createdBy: number): Promise<Reposition>;
  getRepositions(area?: Area, userArea?: Area): Promise<Reposition[]>;
  getRepositionsByArea(area: Area, userId?: number): Promise<Reposition[]>;
  getRepositionById(id: number): Promise<Reposition | undefined>;
  getNextRepositionCounter(): Promise<number>;
  approveReposition(repositionId: number, action: RepositionStatus, userId: number, notes?: string): Promise<Reposition>;

  createRepositionTransfer(transfer: InsertRepositionTransfer, createdBy: number): Promise<RepositionTransfer>;
  processRepositionTransfer(transferId: number, action: 'accepted' | 'rejected', userId: number): Promise<RepositionTransfer>;
  getRepositionHistory(repositionId: number): Promise<RepositionHistory[]>;
  getRepositionTracking(repositionId: number): Promise<any>;

  deleteReposition(repositionId: number, userId: number, reason?: string): Promise<void>;
  completeReposition(repositionId: number, userId: number, notes?: string): Promise<void>;
  requestCompletionApproval(repositionId: number, userId: number, notes?: string): Promise<void>;
  getAllRepositions(includeDeleted?: boolean): Promise<Reposition[]>;
  getRecentOrders(area?: Area, limit?: number): Promise<Order[]>;
  getRecentRepositions(area?: Area, limit?: number): Promise<Reposition[]>;

  getReportData(type: string, startDate: string, endDate: string, filters: any): Promise<any>;
  generateReport(type: string, format: string, startDate: string, endDate: string, filters: any): Promise<Buffer>;
  saveReportToOneDrive(type: string, startDate: string, endDate: string, filters: any): Promise<any>;

  createAdminPassword(password: string, createdBy: number): Promise<AdminPassword>;
  verifyAdminPassword(password: string): Promise<boolean>;

  // Agenda Events
  getUserAgendaEvents(userId: number): Promise<any[]>;
  createAgendaEvent(eventData: {
    userId: number;
    title: string;
    description: string;
    date: string;
    time: string;
    priority: 'alta' | 'media' | 'baja';
    status: 'pendiente' | 'completado' | 'cancelado';
  }): Promise<any>;
  updateAgendaEvent(
    eventId: number, 
    userId: number, 
    eventData: {
      title: string;
      description: string;
      date: string;
      time: string;
      priority: 'alta' | 'media' | 'baja';
      status: 'pendiente' | 'completado' | 'cancelado';
    }
  ): Promise<any>;
  deleteAgendaEvent(eventId: number, userId: number): Promise<void>;

  exportHistoryToExcel(orders: any[]): Promise<Buffer>;
  getPendingRepositionTransfers(userArea: Area): Promise<RepositionTransfer[]>;

  // Timer methods
  startRepositionTimer(repositionId: number, area: Area, userId: number): Promise<SharedRepositionTimer>;
  stopRepositionTimer(repositionId: number, area: Area, userId: number): Promise<{ elapsedTime: string }>;
  getRepositionTimers(repositionId: number): Promise<LocalRepositionTimer[]>;
  setManualRepositionTime(repositionId: number, area: Area, userId: number, startTime: string, endTime: string, date: string, startDate: string, endDate: string): Promise<SharedRepositionTimer>;
  getRepositionTimer(repositionId: number, area: Area): Promise<SharedRepositionTimer | null>;

   updateUser(userId: number, updateData: any): Promise<void>;

  saveOrderDocument(docData: {
    orderId: number;
    filename: string;
    originalName: string;
    size: number;
    path: string;
    uploadedBy: number;
  }): Promise<any>;

  getOrderDocuments(orderId: number): Promise<any[]>;

  getRepositionPieces(repositionId: number): Promise<any[]>;
  async clearEntireDatabase(): Promise<void>;
  async resetUserSequence(): Promise<void>;
}

export interface LocalRepositionTimer {
  id: number;
  repositionId: number;
  userId: number;
  area: Area;
  startTime: Date;
  endTime: Date | null;
  elapsedTime: string;
}

export class DatabaseStorage implements IStorage {


  async getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(asc(users.id));
  }

   async deleteUserById(userId: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, Number(userId)))
      .returning()
      .catch(() => []);
    return result.length > 0;
  }

  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAdminUser(): Promise<User | undefined> {
    const [admin] = await db.select().from(users).where(eq(users.area, 'admin')).limit(1);
    return admin || undefined;
  }

  async resetUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async createOrder(order: InsertOrder, createdBy: number): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, createdBy, createdAt: createMexicoTimestamp() })
      .returning();

    await db.insert(orderPieces).values({
      orderId: newOrder.id,
      area: 'corte',
      pieces: order.totalPiezas,
    });

    console.log(`Created order ${newOrder.id} with ${order.totalPiezas} pieces in corte area`);

    await this.addOrderHistory(
      newOrder.id,
      'created',
      `Pedido creado con ${order.totalPiezas} piezas`,
      createdBy
    );

    return newOrder;
  }

  async getOrders(area?: Area): Promise<Order[]> {
    if (area) {
      return await db.select().from(orders)
        .where(eq(orders.currentArea, area))
        .orderBy(desc(orders.createdAt));
    }
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByFolio(folio: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.folio, folio));
    return order || undefined;
  }

  async completeOrder(orderId: number, completedBy: number): Promise<void> {
    await db.update(orders)
      .set({ 
        status: 'completed',
        completedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    await this.addOrderHistory(
      orderId,
      'completed',
      'Pedido completado',
      completedBy
    );
  }

  async pauseOrder(orderId: number, userId: number, reason: string): Promise<void> {
    // Check if the user's area has the complete order
    const order = await this.getOrderById(orderId);
    if (!order) {
      throw new Error("Pedido no encontrado");
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Get pieces distribution
    const orderPieces = await this.getOrderPieces(orderId);
    const userAreaPieces = orderPieces.find(p => p.area === user.area);

    // Check if user's area has the complete order
    if (!userAreaPieces || userAreaPieces.pieces < order.totalPiezas) {
      throw new Error(`⚠️ TRANSFERENCIA PARCIAL - No puedes pausar este pedido porque tu área (${user.area}) solo tiene ${userAreaPieces?.pieces || 0} piezas de ${order.totalPiezas} totales. Debes esperar a recibir la orden completa antes de poder pausarla.`);
    }

    await db.update(orders)
      .set({ 
        status: 'paused',
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));

    await this.addOrderHistory(
      orderId,
      'paused',
      `Pedido pausado - Motivo: ${reason}`,
      userId,
      { reason }
    );
  }

  async resumeOrder(orderId: number, resumedBy: number): Promise<void> {
    await db.update(orders)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    await this.addOrderHistory(
      orderId,
      'resumed',
      'Pedido reanudado',
      resumedBy
    );
  }

  async deleteOrder(orderId: number): Promise<void> {
    await db.delete(orderPieces).where(eq(orderPieces.orderId, orderId));
    await db.delete(transfers).where(eq(transfers.orderId, orderId));
    await db.delete(orderHistory).where(eq(orderHistory.orderId, orderId));
    await db.delete(notifications).where(eq(notifications.orderId, orderId));
    await db.delete(orders).where(eq(orders.id, orderId));
  }

  async getOrderPieces(orderId: number): Promise<any[]> {
    const pieces = await db.select().from(orderPieces)
      .where(eq(orderPieces.orderId, orderId))
      .orderBy(asc(orderPieces.area));

    console.log(`Order pieces for order ${orderId}:`, pieces);
    return pieces;
  }

  async updateOrderPieces(orderId: number, area: Area, pieces: number): Promise<void> {
    const existing = await db.select().from(orderPieces)
      .where(and(
        eq(orderPieces.orderId, orderId),
        eq(orderPieces.area, area)
      ));

    if (existing.length > 0) {
      await db.update(orderPieces)
        .set({ pieces, updatedAt: new Date() })
        .where(and(
          eq(orderPieces.orderId, orderId),
          eq(orderPieces.area, area)
        ));
    } else {
      await db.insert(orderPieces).values({
        orderId,
        area,
        pieces,
      });
    }
  }

  async createTransfer(transfer: InsertTransfer, createdBy: number): Promise<Transfer> {
    const [newTransfer] = await db
      .insert(transfers)
      .values({ ...transfer, createdBy })
      .returning();

    await this.addOrderHistory(
      transfer.orderId,
      'transfer_created',
      `${transfer.pieces} piezas enviadas a ${transfer.toArea}`,
      createdBy,
      {
        fromArea: transfer.fromArea,
        toArea: transfer.toArea,
        pieces: transfer.pieces
      }
    );

    return newTransfer;
  }

  async getTransfersByArea(area: Area): Promise<Transfer[]> {
    return await db.select().from(transfers)
      .where(or(
        eq(transfers.fromArea, area),
        eq(transfers.toArea, area)
      ))
      .orderBy(desc(transfers.createdAt));
  }

  async getPendingTransfersForUser(userId: number): Promise<Transfer[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    return await db.select().from(transfers)
      .where(and(
        eq(transfers.toArea, user.area),
        eq(transfers.status, 'pending')
      ))
      .orderBy(desc(transfers.createdAt));
  }

  async acceptTransfer(transferId: number, processedBy: number): Promise<void> {
    const [transfer] = await db.select().from(transfers)
      .where(eq(transfers.id, transferId));

    if (!transfer) return;

    if (transfer.status !== 'pending') return;

    let isPartialTransfer = false;
    let hasCompleteOrder = false;

    await db.update(transfers)
      .set({
        status: 'accepted',
        processedBy,
        processedAt: new Date()
      })
      .where(eq(transfers.id, transferId));

    const fromAreaPieces = await db.select().from(orderPieces)
      .where(and(
        eq(orderPieces.orderId, transfer.orderId),
        eq(orderPieces.area, transfer.fromArea)
      ));

    if (fromAreaPieces.length > 0) {
      const currentPieces = fromAreaPieces[0].pieces;
      const remainingPieces = currentPieces - transfer.pieces;

      if (remainingPieces > 0) {
        await db.update(orderPieces)
          .set({ pieces: remainingPieces, updatedAt: new Date() })
          .where(and(
            eq(orderPieces.orderId, transfer.orderId),
            eq(orderPieces.area, transfer.fromArea)
          ));
        isPartialTransfer = true;
      } else {
        await db.delete(orderPieces)
          .where(and(
            eq(orderPieces.orderId, transfer.orderId),
            eq(orderPieces.area, transfer.fromArea)
          ));
      }
    }

    const toAreaPieces = await db.select().from(orderPieces)
      .where(and(
        eq(orderPieces.orderId, transfer.orderId),
        eq(orderPieces.area, transfer.toArea)
      ));

    if (toAreaPieces.length > 0) {
      const newPieces = toAreaPieces[0].pieces + transfer.pieces;
      await db.update(orderPieces)
        .set({ 
          pieces: newPieces, 
          updatedAt: new Date() 
        })
        .where(and(
          eq(orderPieces.orderId, transfer.orderId),
          eq(orderPieces.area, transfer.toArea)
        ));
      hasCompleteOrder = newPieces === transfer.totalPiezas;
    } else {
      await db.insert(orderPieces).values({
        orderId: transfer.orderId,
        area: transfer.toArea,
        pieces: transfer.pieces,
      });
      hasCompleteOrder = transfer.pieces === transfer.totalPiezas;
    }

    const allOrderPieces = await db.select().from(orderPieces)
      .where(eq(orderPieces.orderId, transfer.orderId));

    if (allOrderPieces.length === 1 && allOrderPieces[0].area === transfer.toArea) {
      await db.update(orders)
        .set({ currentArea: transfer.toArea })
        .where(eq(orders.id, transfer.orderId));
    }

    await this.addOrderHistory(
      transfer.orderId,
      'transfer_accepted',
      `Transferencia aceptada - ${transfer.pieces} piezas movidas de ${transfer.fromArea} a ${transfer.toArea}${isPartialTransfer ? ' (Transferencia parcial)' : ''}`,
      processedBy,
      {
        fromArea: transfer.fromArea,
        toArea: transfer.toArea,
        pieces: transfer.pieces
      }
    );

    // If it's a partial transfer and the receiving area doesn't have the complete order,
    // send a special notification about pause restrictions
    if (isPartialTransfer && !hasCompleteOrder) {
      // Get the order information for the notification
      const [order] = await db.select().from(orders)
        .where(eq(orders.id, transfer.orderId));

      // Get all users in the receiving area
      const areaUsers = await db.select().from(users)
        .where(eq(users.area, transfer.toArea));

      // Get area names for display
      const getAreaDisplayName = (area: string) => {
        const names: Record<string, string> = {
          corte: "Corte",
          bordado: "Bordado",
          ensamble: "Ensamble",
          plancha: "Plancha/Empaque",
          calidad: "Calidad",
          envios: "Envíos",
          admin: "Admin",
          diseño: "Diseño",
          operaciones: "Operaciones",
          almacen: "Almacén",
          patronaje: "Patronaje"
        };
        return names[area] || area;
      };

      // Send notification to all users in the receiving area
      for (const user of areaUsers) {
        await this.createNotification({
          userId: user.id,
          type: 'partial_transfer_warning',
          title: '⚠️ TRANSFERENCIA PARCIAL',
          message: `Has recibido ${transfer.pieces} piezas de ${transfer.totalPiezas} del pedido ${order?.folio || 'N/A'} desde ${getAreaDisplayName(transfer.fromArea)}. NO PUEDES PAUSAR este pedido hasta recibir la orden completa.`,
          orderId: transfer.orderId,
        });
      }
    }
  }

  async rejectTransfer(transferId: number, processedBy: number): Promise<void> {
    const [transfer] = await db.select().from(transfers)
      .where(eq(transfers.id, transferId));

    if (!transfer) return;

    await db.update(transfers)
      .set({
        status: 'rejected',
        processedBy,
        processedAt: new Date()
      })
      .where(eq(transfers.id, transferId));

    await this.addOrderHistory(
      transfer.orderId,
      'transfer_rejected',
      `Transferencia rechazada: ${transfer.pieces} piezas permanecen en ${transfer.fromArea}. No se realizó el movimiento hacia ${transfer.toArea}`,
      processedBy,
      {
        fromArea: transfer.fromArea,
        toArea: transfer.toArea,
        pieces: transfer.pieces,
        transferId: transfer.id,
        reason: 'Transferencia rechazada por el área destino'
      }
    );
  }

  async addOrderHistory(
    orderId: number, 
    action: string, 
    description: string, 
    userId: number,
    options?: {
      fromArea?: Area;
      toArea?: Area;
      pieces?: number;
      reason?: string;
    }
  ): Promise<void> {
    await db.insert(orderHistory).values({
      orderId,
      action,
      description,
      userId,
      fromArea: options?.fromArea,
      toArea: options?.toArea,
      pieces: options?.pieces,
      createdAt: createMexicoTimestamp()
    });
  }

  async getOrderHistory(orderId: number): Promise<OrderHistory[]> {
    return await db.select().from(orderHistory)
      .where(eq(orderHistory.orderId, orderId))
      .orderBy(asc(orderHistory.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();

      broadcastNotification({
        ...newNotification,
        userId: newNotification.userId
      });

    return newNotification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const userNotifications = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    console.log(`getUserNotifications: Found ${userNotifications.length} notifications for user ${userId}`);

    return userNotifications;
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async createReposition(repositionData: InsertReposition & { folio: string, productos?: any[], telaContraste?: any }, pieces: InsertRepositionPiece[], createdBy: number): Promise<Reposition> {
    const { productos, telaContraste, ...mainRepositionData } = repositionData;

    const [reposition] = await db.insert(repositions)
      .values({
        ...mainRepositionData,
        createdBy,
      })
      .returning();

    if (pieces.length > 0) {
      await db.insert(repositionPieces)
        .values(pieces.map(piece => ({
          ...piece,
          repositionId: reposition.id
        })));
    }

    // Guardar productos adicionales si existen
    if (productos && productos.length > 0) {
      await db.insert(repositionProducts)
        .values(productos.map(producto => ({
          repositionId: reposition.id,
          modeloPrenda: producto.modeloPrenda,
          tela: producto.tela,
          color: producto.color,
          tipoPieza: producto.tipoPieza,
          consumoTela: producto.consumoTela || 0
        })));
    }

    // Guardar tela contraste si existe
    if (telaContraste) {
      await db.insert(repositionContrastFabrics)
        .values({
          repositionId: reposition.id,
          tela: telaContraste.tela,
          color: telaContraste.color,
          consumo: telaContraste.consumo
        });

      // Guardar piezas de tela contraste si existen
      if (telaContraste.pieces && telaContraste.pieces.length > 0) {
        // Crear entradas separadas para las piezas de contraste
        // Esto puede requerir una tabla adicional o manejo especial
      }
    }

    await this.addRepositionHistory(
      reposition.id,
      'created',
      `Reposición ${reposition.type} creada`,
      createdBy,
    );

    // Notificar a admin y operaciones sobre nueva reposición
    const adminUsers = await db.select().from(users)
      .where(or(eq(users.area, 'admin'), eq(users.area, 'operaciones')));

    for (const admin of adminUsers) {
      await this.createNotification({
        userId: admin.id,
        type: 'new_reposition',
        title: 'Nueva Solicitud de Reposición',
        message: `Se ha creado una nueva solicitud de ${reposition.type}: ${reposition.folio}`,
        repositionId: reposition.id,
      });
    }

    return reposition;
  }

  async getRepositions(area?: Area, userArea?: Area | 'admin' | 'envios' | 'diseño'): Promise<Reposition[]> {
    let query = db.select().from(repositions);

    if (userArea === 'diseño') {
      // Diseño puede ver todas las reposiciones aprobadas
      query = (query as any).where(
        and(
          eq(repositions.status, 'aprobado' as RepositionStatus),
          ne(repositions.status, 'eliminado' as RepositionStatus)
        )
      );
    } else if (userArea !== 'admin' && userArea !== 'envios') {
        // Otras áreas no pueden ver reposiciones eliminadas, completadas ni canceladas
        query = (query as any).where(
          and(
            ne(repositions.status, 'eliminado' as RepositionStatus),
            ne(repositions.status, 'completado' as RepositionStatus),
            ne(repositions.status, 'cancelado' as RepositionStatus)
          )
        );
    }

    return await (query as any).orderBy(desc(repositions.createdAt));
  }

  async getRepositionsByArea(area: Area, userId?: number): Promise<Reposition[]> {
    let whereCondition;

    // Solo admin y envíos pueden ver reposiciones canceladas
    const excludeStatuses = area === 'admin' || area === 'envios' 
      ? [ne(repositions.status, 'eliminado' as RepositionStatus)]
      : [
          ne(repositions.status, 'eliminado' as RepositionStatus),
          ne(repositions.status, 'completado' as RepositionStatus),
          ne(repositions.status, 'cancelado' as RepositionStatus)
        ];

    if (userId) {
      // Si se proporciona userId, mostrar reposiciones del área actual O creadas por el usuario
      whereCondition = and(
        or(
          eq(repositions.currentArea, area),
          eq(repositions.createdBy, userId)
        ),
        ...excludeStatuses
      );
    } else {
      // Sin userId, solo mostrar del área actual
      whereCondition = and(
        eq(repositions.currentArea, area),
        ...excludeStatuses
      );
    }

    return await db.select().from(repositions)
      .where(whereCondition)
      .orderBy(desc(repositions.createdAt));
  }

  async getRepositionById(id: number): Promise<Reposition | undefined> {
    const [reposition] = await db.select().from(repositions).where(eq(repositions.id, id));
    return reposition || undefined;
  }

  async getNextRepositionCounter(): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const yearStr = year.toString();
    const monthStr = String(month).padStart(2, '0');
    const folioPrefix = `JN-REQ-${monthStr}-${yearStr.slice(-2)}-`;

    const result = await db.select().from(repositions);
    const thisMonthCount = result.filter(r => r.folio.startsWith(folioPrefix)).length;

    return thisMonthCount + 1;
  }

  async approveReposition(repositionId: number, action: RepositionStatus, userId: number, notes?: string): Promise<Reposition> {
    const [reposition] = await db.update(repositions)
      .set({
        status: action,
        approvedBy: userId,
        approvedAt: new Date(),
        // NO cambiar área automáticamente, mantener en área actual
      })
      .where(eq(repositions.id, repositionId))
      .returning();

    await this.addRepositionHistory(
      repositionId,
      action === 'aprobado' ? 'approved' : 'rejected',
      `Reposición ${action === 'aprobado' ? 'aprobada' : 'rechazada'}${notes ? `: ${notes}` : ''}`,
      userId,
    );

    // Notificar al solicitante original
    await this.createNotification({
      userId: reposition.createdBy,
      type: action === 'aprobado' ? 'transfer_accepted' : 'transfer_rejected',
      title: action === 'aprobado' ? 'Reposición Aprobada' : 'Reposición Rechazada',
      message: `Tu reposición ${reposition.folio} ha sido ${action === 'aprobado' ? 'aprobada' : 'rechazada'}${notes ? `: ${notes}` : ''}`,
      repositionId: repositionId,
    });

    return reposition;
  }

  async createRepositionTransfer(transfer: InsertRepositionTransfer, createdBy: number): Promise<RepositionTransfer> {
    const [repositionTransfer] = await db.insert(repositionTransfers)
      .values({
        ...transfer,
        createdBy,
      })
      .returning();

    await this.addRepositionHistory(
      transfer.repositionId,
      'transfer_requested',
      `Transfer requested from ${transfer.fromArea} to ${transfer.toArea}`,
      createdBy,
      transfer.fromArea,
      transfer.toArea
    );

    // Obtener la reposición para el folio
    const reposition = await this.getRepositionById(transfer.repositionId);

    // Notificar a usuarios del área de destino
    const targetAreaUsers = await db.select().from(users)
      .where(eq(users.area, transfer.toArea));

    for (const user of targetAreaUsers) {
      await this.createNotification({
        userId: user.id,
        type: 'reposition_transfer',
        title: 'Nueva Transferencia de Reposición',
        message: `Se ha solicitado transferir la reposición ${reposition?.folio} de ${transfer.fromArea} a ${transfer.toArea}`,
        repositionId: transfer.repositionId,
      });
    }

    return repositionTransfer;
  }

  async processRepositionTransfer(transferId: number, action: 'accepted' | 'rejected', userId: number): Promise<RepositionTransfer> {
    const [transfer] = await db.update(repositionTransfers)
      .set({
        status: action,
        processedBy: userId,
        processedAt: new Date()
      })
      .where(eq(repositionTransfers.id, transferId))
      .returning();

    if (action === 'accepted') {
      await db.update(repositions)
        .set({ currentArea: transfer.toArea })
        .where(eq(repositions.id, transfer.repositionId));
    }

    await this.addRepositionHistory(
      transfer.repositionId,
      `transfer_${action}`,
      `Transfer ${action} from ${transfer.fromArea} to ${transfer.toArea}`,
      userId,
      transfer.fromArea,
      transfer.toArea
    );

    // Obtener la reposición para el folio
    const reposition = await this.getRepositionById(transfer.repositionId);

    // Notificar al solicitante original
    await this.createNotification({
      userId: transfer.createdBy,
      type: 'transfer_processed',
      title: `Transferencia ${action === 'accepted' ? 'Aceptada' : 'Rechazada'}`,
      message: `La transferencia de la reposición ${reposition?.folio} ha sido ${action === 'accepted' ? 'aceptada' : 'rechazada'}`,
      repositionId: transfer.repositionId,
    });

    // Si fue aceptada, notificar a usuarios del área de destino
    if (action === 'accepted') {
      const targetAreaUsers = await db.select().from(users)
        .where(eq(users.area, transfer.toArea));

      for (const user of targetAreaUsers) {
        if (user.id !== userId) { // No notificar al que procesó
          await this.createNotification({
            userId: user.id,
            type: 'reposition_received',
            title: 'Nueva Reposición Recibida',
            message: `La reposición ${reposition?.folio} ha llegado a tu área`,
            repositionId: transfer.repositionId,
          });
        }
      }
    }

    return transfer;
  }

  async getRepositionHistory(repositionId: number): Promise<RepositionHistory[]> {
    return await db.select().from(repositionHistory)
      .where(eq(repositionHistory.repositionId, repositionId))
      .orderBy(asc(repositionHistory.createdAt));
  }

  async createAdminPassword(password: string, createdBy: number): Promise<AdminPassword> {
    const [adminPassword] = await db.insert(adminPasswords)
      .values({
        password,
        createdBy,
      })
      .returning();

    return adminPassword;
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const [adminPassword] = await db.select().from(adminPasswords)
      .where(and(eq(adminPasswords.password, password), eq(adminPasswords.isActive, true)))
      .orderBy(desc(adminPasswords.createdAt));

    return !!adminPassword;
  }

  async updateRepositionConsumo(repositionId: number, consumoTela: number): Promise<void> {
    await db.update(repositions)
      .set({ consumoTela })
      .where(eq(repositions.id, repositionId));
  }

  async cancelReposition(repositionId: number, userId: number, reason: string): Promise<void> {
    console.log('Cancelling reposition:', repositionId, 'by user:', userId, 'reason:', reason);

    // Obtener la reposición antes de cancelarla
    const reposition = await this.getRepositionById(repositionId);
    if (!reposition) {
      throw new Error('Reposición no encontrada');
    }

    console.log('Found reposition:', reposition.folio);

    await db.update(repositions)
      .set({
        status: 'cancelado' as RepositionStatus,
        completedAt: new Date(),
      })
      .where(eq(repositions.id, repositionId));

    console.log('Updated reposition status to cancelado');

    await this.addRepositionHistory(
      repositionId,
      'canceled',
      `Reposición cancelada. Motivo: ${reason}`,
      userId,
    );

    console.log('Added history entry');

    // Crear notificación para el solicitante si no es la misma persona
    if (reposition.createdBy !== userId) {
      await this.createNotification({
        userId: reposition.createdBy,
        type: 'reposition_canceled',
        title: 'Reposición Cancelada',
        message: `La reposición ${reposition.folio} ha sido cancelada. Motivo: ${reason}`,
        repositionId: repositionId,
      });
      console.log('Created notification for user:', reposition.createdBy);
    }
  }

  async deleteReposition(repositionId: number, userId: number): Promise<void> {
    console.log('Deleting reposition:', repositionId, 'by user:', userId);

    // Obtener la reposición antes de eliminarla
    const reposition = await this.getRepositionById(repositionId);
    if (!reposition) {
      throw new Error('Reposición no encontrada');
    }

    console.log('Found reposition:', reposition.folio);

    await db.update(repositions)
      .set({
        status: 'eliminado' as RepositionStatus,
        completedAt: new Date(),
      })
      .where(eq(repositions.id, repositionId));

    console.log('Updated reposition status to eliminado');

    await this.addRepositionHistory(
      repositionId,
      'deleted',
      `Reposición eliminada permanentemente`,
      userId,
    );

    console.log('Added history entry');

    // Crear notificación para el solicitante
    if (reposition.createdBy !== userId) {
      await this.createNotification({
        userId: reposition.createdBy,
        type: 'reposition_deleted',
        title: 'Reposición Eliminada',
        message: `La reposición ${reposition.folio} ha sido eliminada permanentemente`,
        repositionId: repositionId,
      });
      console.log('Created notification for user:', reposition.createdBy);
    }
  }

  async completeReposition(repositionId: number, userId: number, notes?: string): Promise<void> {
    await db.update(repositions)
      .set({
        status: 'completado' as RepositionStatus,
        completedAt: new Date(),
        approvedBy: userId,
      })
      .where(eq(repositions.id, repositionId));

    await this.addRepositionHistory(
      repositionId,
      'completed',
      `Reposición finalizada${notes ? `: ${notes}` : ''}`,
      userId,
    );

    // Crear notificación para el solicitante
    const reposition = await this.getRepositionById(repositionId);
    if (reposition) {
      await this.createNotification({
        userId: reposition.createdBy,
        type: 'reposition_completed',
        title: 'Reposición Completada',
        message: `La reposición ${reposition.folio} ha sido completada${notes ? `: ${notes}` : ''}`,
        repositionId: repositionId,
      });
    }
  }

  async requestCompletionApproval(repositionId: number, userId: number, notes?: string): Promise<void> {
    await this.addRepositionHistory(
        repositionId,
        'completion_requested',
        `Solicitud de finalización enviada${notes ? `: ${notes}` : ''}`,
        userId,
    );

    // Crear notificaciones para admin, envíos y operaciones
    const adminUsers = await db.select().from(users)
      .where(eq(users.area, 'admin'));

    const enviosUsers = await db.select().from(users)
      .where(eq(users.area, 'envios'));

    const operacionesUsers = await db.select().from(users)
      .where(eq(users.area, 'operaciones'));

    const allTargetUsers = [...adminUsers, ...enviosUsers, ...operacionesUsers];

    const reposition = await this.getRepositionById(repositionId);
    if (reposition) {
        for (const targetUser of allTargetUsers) {
            await this.createNotification({
                userId: targetUser.id,
                type: 'completion_approval_needed',
                title: 'Solicitud de Finalización',
                message: `Se solicita aprobación para finalizar la reposición ${reposition.folio}${notes ? `: ${notes}` : ''}`,
                repositionId: repositionId,
            });
        }
    }
}

  async getPendingRepositionsCount(): Promise<number> {
    const repositions = await this.getAllRepositions(false);
    return repositions.filter(r => r.status === 'pendiente').length;
  }

  async getAllRepositions(includeDeleted: boolean = false): Promise<Reposition[]> {
    let query;

    if (!includeDeleted) {
      query = db.select().from(repositions).where(ne(repositions.status, 'eliminado' as RepositionStatus));
    } else {
      query = db.select().from(repositions);
    }

    return await query.orderBy(desc(repositions.createdAt));
  }

  async getRecentOrders(area?: Area, limit: number = 10): Promise<Order[]> {
    let query;

    if (area && area !== 'admin') {
      query = db.select().from(orders).where(eq(orders.currentArea, area));
    } else {
      query = db.select().from(orders);
    }

    return await query
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getRecentRepositions(area?: Area, limit: number = 10): Promise<Reposition[]> {
    let whereCondition: any = ne(repositions.status, 'eliminado' as RepositionStatus);

    if (area && area !== 'admin') {
      whereCondition = and(
        ne(repositions.status, 'eliminado' as RepositionStatus),
        eq(repositions.currentArea, area)
      );
    }

    return await db.select().from(repositions)
      .where(whereCondition)
      .orderBy(desc(repositions.createdAt))
      .limit(limit);
  }

async getRepositionTracking(repositionId: number): Promise<any> {
    console.log('Getting tracking for reposition ID:', repositionId);

    const reposition = await this.getRepositionById(repositionId);
    if (!reposition) {
      console.log('Reposicion not found for ID:', repositionId);
      throw new Error('Reposición no encontrada');
    }

    console.log('Found reposition:', reposition.folio);
    const history = await this.getRepositionHistory(repositionId);
    console.log('History entries:', history.length);

    // Obtener tiempos por área
    const timers = await db.select().from(repositionTimers)
      .where(eq(repositionTimers.repositionId, repositionId));

    console.log('Timers found:', timers.length);

    // Solo mostrar áreas que tienen tiempos registrados o el área actual
    const areasWithTimers = timers.map(t => t.area);
    const allRelevantAreas = [...new Set([...areasWithTimers, reposition.currentArea])];

    // Ordenar las áreas según el flujo estándar
    const areaOrder = ['patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad'];
    const sortedAreas = allRelevantAreas.sort((a, b) => {
      const indexA = areaOrder.indexOf(a);
      const indexB = areaOrder.indexOf(b);
      return indexA - indexB;
    });

    console.log('Relevant areas for this reposition:', sortedAreas);

    // Crear pasos del proceso solo para áreas relevantes
    const steps = sortedAreas.map((area, index) => {
      const areaTimer = timers.find(t => t.area === area);
      let status: 'completed' | 'current' | 'pending' = 'pending';

      // Determinar status basado en si hay timer registrado y área actual
      if (areaTimer && areaTimer.manualStartTime && areaTimer.manualEndTime) {
        status = 'completed';
      } else if (area === reposition.currentArea && reposition.status !== 'completado') {
        status = 'current';
      } else if (reposition.status === 'completado') {
        status = 'completed';
      }

      let timeSpent = undefined;
      let timeInMinutes = 0;

      // Solo calcular si tenemos tanto tiempo de inicio como de fin
      if (areaTimer && areaTimer.manualStartTime && areaTimer.manualEndTime) {
        // Usar elapsedMinutes del timer si está disponible y es válido
        if (areaTimer.elapsedMinutes && !isNaN(areaTimer.elapsedMinutes) && areaTimer.elapsedMinutes > 0) {
          timeInMinutes = areaTimer.elapsedMinutes;
        } else {
          // Calcular manualmente
          const [startHour, startMinute] = areaTimer.manualStartTime.split(':').map(Number);
          const [endHour, endMinute] = areaTimer.manualEndTime.split(':').map(Number);

          // Validar que los números son válidos
          if (!isNaN(startHour) && !isNaN(startMinute) && !isNaN(endHour) && !isNaN(endMinute)) {
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;

            timeInMinutes = endTotalMinutes - startTotalMinutes;
            if (timeInMinutes < 0) {
              timeInMinutes += 24 * 60; // Trabajo cruzó medianoche
            }
          }
        }

        // Solo asignar timeSpent si tenemos un valor válido
        if (!isNaN(timeInMinutes) && timeInMinutes > 0) {
          const hours = Math.floor(timeInMinutes / 60);
          const minutes = Math.round(timeInMinutes % 60);
          timeSpent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
      }

      // Buscar el evento de historia más reciente para esta área
      const areaHistory = history.find(h => 
        h.toArea === area || 
        (area === 'patronaje' && h.action === 'created') ||
        h.action === 'manual_time_set' && h.description?.includes(area)
      );

      return {
        id: index + 1,
        area,
        status,
        timestamp: areaHistory?.createdAt || areaTimer?.createdAt,
        user: areaHistory?.userName,
        timeSpent,
        timeInMinutes,
        date: areaTimer?.manualDate
      };
    });

    // Calcular tiempos por área - solo para áreas con tiempos registrados
    const areaTimes: Record<string, number> = {};

    timers.forEach(timer => {
      let elapsedMinutes = 0;

      // Solo calcular si tenemos tanto tiempo de inicio como de fin
      if (timer.manualStartTime && timer.manualEndTime) {
        // Usar elapsedMinutes del timer si está disponible y es válido
        if (timer.elapsedMinutes && !isNaN(timer.elapsedMinutes) && timer.elapsedMinutes > 0) {
          elapsedMinutes = timer.elapsedMinutes;
        } else {
          // Calcular manualmente
          const [startHour, startMinute] = timer.manualStartTime.split(':').map(Number);
          const [endHour, endMinute] = timer.manualEndTime.split(':').map(Number);

          // Validar que los números son válidos
          if (!isNaN(startHour) && !isNaN(startMinute) && !isNaN(endHour) && !isNaN(endMinute)) {
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;

            elapsedMinutes = endTotalMinutes - startTotalMinutes;
            if (elapsedMinutes < 0) {
              elapsedMinutes += 24 * 60; // Trabajo cruzó medianoche
            }
          }
        }

        // Solo asignar si tenemos un valor válido
        if (!isNaN(elapsedMinutes) && elapsedMinutes > 0) {
          areaTimes[timer.area] = elapsedMinutes;
        }
      }
    });

    console.log('Area times calculated:', areaTimes);

    // Calcular tiempo total
    const validTimes = Object.values(areaTimes).filter(minutes => !isNaN(minutes) && minutes > 0);
    const totalMinutes = validTimes.reduce((sum, minutes) => sum + minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);
    const totalTimeFormatted = totalMinutes > 0 ? 
      (totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`) : 
      "0m";

    // Calcular progreso basado en áreas completadas vs áreas relevantes
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const progress = sortedAreas.length > 0 ? Math.round((completedSteps / sortedAreas.length) * 100) : 0;

    const result = {
      reposition: {
        folio: reposition.folio,
        status: reposition.status,
        currentArea: reposition.currentArea,
        progress
      },
      steps,
      history,
      totalTime: {
        formatted: totalTimeFormatted,
        minutes: totalMinutes
      },
      areaTimes
    };

    console.log('Returning tracking data:', JSON.stringify(result, null, 2));
    return result;
  }



  async getPendingRepositionTransfers(userArea: Area): Promise<RepositionTransfer[]> {
    return await db.select().from(repositionTransfers)
      .where(and(
        eq(repositionTransfers.toArea, userArea),
        eq(repositionTransfers.status, 'pending')
      ))
      .orderBy(desc(repositionTransfers.createdAt));
  }

  // Agenda Events
  async getAgendaEvents(user: any): Promise<any[]> {
    // Admin y Envíos ven todas las tareas, otras áreas solo las asignadas a ellas
    if (user.area === 'admin' || user.area === 'envios') {
      return await db.select({
        id: agendaEvents.id,
        createdBy: agendaEvents.createdBy,
        assignedToArea: agendaEvents.assignedToArea,
        title: agendaEvents.title,
        description: agendaEvents.description,
        date: agendaEvents.date,
        time: agendaEvents.time,
        priority: agendaEvents.priority,
        status: agendaEvents.status,
        createdAt: agendaEvents.createdAt,
        updatedAt: agendaEvents.updatedAt,
        creatorName: users.name
      })
      .from(agendaEvents)
      .leftJoin(users, eq(agendaEvents.createdBy, users.id))
      .orderBy(asc(agendaEvents.date), asc(agendaEvents.time));
    } else {
      return await db.select({
        id: agendaEvents.id,
        createdBy: agendaEvents.createdBy,
        assignedToArea: agendaEvents.assignedToArea,
        title: agendaEvents.title,
        description: agendaEvents.description,
        date: agendaEvents.date,
        time: agendaEvents.time,
        priority: agendaEvents.priority,
        status: agendaEvents.status,
        createdAt: agendaEvents.createdAt,
        updatedAt: agendaEvents.updatedAt,
        creatorName: users.name
      })
      .from(agendaEvents)
      .leftJoin(users, eq(agendaEvents.createdBy, users.id))
      .where(eq(agendaEvents.assignedToArea, user.area as Area))
      .orderBy(asc(agendaEvents.date), asc(agendaEvents.time));
    }
  }

  async createAgendaEvent(eventData: any): Promise<any> {
    const [event] = await db
      .insert(agendaEvents)
      .values(eventData)
      .returning();

    return event;
  }

  async updateAgendaEvent(eventId: number, eventData: any): Promise<any> {
    const [event] = await db
      .update(agendaEvents)
      .set(eventData)
      .where(eq(agendaEvents.id, eventId))
      .returning();

    if (!event) {
      throw new Error("Tarea no encontrada");
    }

    return event;
  }

  async updateTaskStatus(eventId: number, userArea: string, status: string): Promise<any> {
    const [event] = await db.update(agendaEvents)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(agendaEvents.id, eventId), 
        eq(agendaEvents.assignedToArea, userArea)
      ))
      .returning();

    if (!event) {
      throw new Error("Tarea no encontrada o no asignada a tu área");
    }

    return event;
  }

  async deleteAgendaEvent(eventId: number): Promise<void> {
    const result = await db
      .delete(agendaEvents)
      .where(eq(agendaEvents.id, eventId));

    if (result.rowCount === 0) {
      throw new Error("Tarea no encontrada");
    }
  }

  async exportHistoryToExcel(orders: any[]): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Pedidos');

    // Configurar encabezados
    worksheet.columns = [
      { header: 'Folio', key: 'folio', width: 15 },
      { header: 'Cliente/Hotel', key: 'clienteHotel', width: 20 },
      { header: 'Modelo', key: 'modelo', width: 15 },
      { header: 'Tipo Prenda', key: 'tipoPrenda', width: 15 },
      { header: 'Color', key: 'color', width: 12 },
      { header: 'Tela', key: 'tela', width: 15 },
      { header: 'Total Piezas', key: 'totalPiezas', width: 12 },
      { header: 'No. Solicitud', key: 'noSolicitud', width: 15 },
      { header: 'Área Actual', key: 'currentArea', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Fecha Creación', key: 'createdAt', width: 18 },
      { header: 'Fecha Finalización', key: 'completedAt', width: 18 }
    ];

    // Estilo para encabezados
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Función para obtener nombre de área en español
    const getAreaDisplayName = (area: string) => {
      const names: Record<string, string> = {
        corte: 'Corte',
        bordado: 'Bordado',
        ensamble: 'Ensamble',
        plancha: 'Plancha/Empaque',
        calidad: 'Calidad',
        envios: 'Envíos',
        admin: 'Admin'
      };
      return names[area] || area;
    };

    // Agregar datos
    orders.forEach(order => {
      worksheet.addRow({
        folio: order.folio,
        clienteHotel: order.clienteHotel,
        modelo: order.modelo,
        tipoPrenda: order.tipoPrenda,
        color: order.color,
        tela: order.tela,
        totalPiezas: order.totalPiezas,
        noSolicitud: order.noSolicitud,
        currentArea: getAreaDisplayName(order.currentArea),
        status: order.status === 'completed' ? 'Finalizado' : 'En Proceso',
        createdAt: new Date(order.createdAt).toLocaleString('es-ES'),
        completedAt: order.completedAt ? new Date(order.completedAt).toLocaleString('es-ES') : ''
      });
    });

    // Aplicar bordes a todas las celdas
    worksheet.eachRow((row: typeof ExcelJS.Row, rowNumber: number) => {
      row.eachCell((cell: typeof ExcelJS.Cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generar buffer
    return await workbook.xlsx.writeBuffer();
  }

  async generateReport(
    type: string,
    format: string,
    startDate: string,
    endDate: string,
    filters: { area?: string; status?: string; urgency?: string }
  ): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }
  async saveReportToOneDrive(type: string, startDate: string, endDate: string, filters: any): Promise<any> {
    throw new Error("Method not implemented.");
  }

async startRepositionTimer(repositionId: number, userId: number, area: Area): Promise<SharedRepositionTimer> {
    // Check if there's already a running timer for this reposition and area
    const existingTimer = await db.select().from(repositionTimers)
      .where(and(
        eq(repositionTimers.repositionId, repositionId),
        eq(repositionTimers.area, area),
        eq(repositionTimers.isRunning, true)
      )).limit(1);

    if (existingTimer.length > 0) {
      throw new Error('Ya existe un timer activo para esta reposición en esta área');
    }

    const [timer] = await db.insert(repositionTimers)
      .values({
        repositionId,
        area,
        userId,
        startTime: new Date(),
        isRunning: true,
      })
      .returning();

    return timer;
  }

  async stopRepositionTimer(repositionId: number, area: Area, userId: number): Promise<{ elapsedTime: string }> {
        // Buscar el timer activo para esta reposición
    const [activeTimer] = await db.select().from(repositionTimers)
      .where(and(
        eq(repositionTimers.repositionId, repositionId),
        eq(repositionTimers.isRunning, true)
      ))
      .orderBy(desc(repositionTimers.startTime));

    if (!activeTimer) {
      throw new Error('No hay cronómetro activo para esta reposición');
    }

    const endTime = new Date();
    const startTime = new Date(activeTimer.startTime!);
    const elapsedMilliseconds = endTime.getTime() - startTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMilliseconds / (1000 * 60));

    // Formatear tiempo transcurrido
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    const elapsedTimeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

    // Actualizar el timer
    await db.update(repositionTimers)
      .set({
        endTime,
        elapsedMinutes,
        isRunning: false,
      })
      .where(eq(repositionTimers.id, activeTimer.id));

        // Obtener información del usuario
    const user = await this.getUser(userId);

    // Registrar en el historial
    await db.insert(repositionHistory).values({
      repositionId,
      action: 'timer_stopped',
      description: `Cronómetro detenido por ${user?.name || 'Usuario'} en área ${area}. Tiempo transcurrido: ${elapsedTimeFormatted}`,
      userId,
    });

    console.log(`Timer stopped for reposition ${repositionId} by user ${userId} in area ${area}. Elapsed: ${elapsedTimeFormatted}`);

    return { elapsedTime: elapsedTimeFormatted };
  }

  async getRepositionTimers(repositionId: number): Promise<LocalRepositionTimer[]> {
    // Implement timer retrieval logic here
    console.log(`Retrieving timers for reposition ${repositionId}`);
    const timers = await db.select().from(repositionTimers)
      .where(eq(repositionTimers.repositionId, repositionId));

    const localTimers: LocalRepositionTimer[] = timers.map(timer => {
      const startTime = timer.startTime ? new Date(timer.startTime) : null;
      const endTime = timer.endTime ? new Date(timer.endTime) : null;

      let elapsedMinutes = timer.elapsedMinutes || 0;
      if (startTime && endTime) {
        elapsedMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      }
      const hours = Math.floor(elapsedMinutes / 60);
      const minutes = Math.floor(elapsedMinutes % 60);
      const elapsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      return {
        id: timer.id,
        repositionId: timer.repositionId,
        userId: timer.userId,
        area: timer.area,
        startTime: startTime!,
        endTime: endTime,
        elapsedTime,
      };
    });
    return localTimers;
  }

  async getReportData(type: string, startDate: string, endDate: string, filters: any): Promise<any> {
    // Implement report data retrieval logic here
    throw new Error("Method not implemented.");
  }

  async getUserAgendaEvents(userId: number): Promise<any[]> {
    // Implement user agenda events retrieval logic here
    throw new Error("Method not implemented.");
  }

  async setManualRepositionTime(repositionId: number, area: Area, userId: number, startTime: string, endTime: string, date: string, startDate: string, endDate: string): Promise<SharedRepositionTimer> {
    // Validar formato de tiempo (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      throw new Error('Formato de tiempo inválido. Use HH:MM');
    }

    // Función para normalizar fechas
    const normalizeDateString = (dateStr: string): string => {
      if (!dateStr) throw new Error('Fecha requerida');

      // Si viene en formato ISO, extraer solo la fecha
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }

      // Si es un objeto Date serializado, intentar parsearlo
      if (dateStr.includes('-') && dateStr.length >= 10) {
        return dateStr.substring(0, 10);
      }

      return dateStr;
    };

    // Normalizar todas las fechas
    const normalizedDate = normalizeDateString(date);
    const normalizedStartDate = normalizeDateString(startDate);
    const normalizedEndDate = normalizeDateString(endDate);

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(normalizedDate)) {
      console.log('Invalid date format received:', date, 'normalized:', normalizedDate);
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    if (!dateRegex.test(normalizedStartDate) || !dateRegex.test(normalizedEndDate)) {
      console.log('Invalid date formats received:', startDate, endDate, 'normalized:', normalizedStartDate, normalizedEndDate);
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Usar las fechas normalizadas
    date = normalizedDate;
    startDate = normalizedStartDate;
    endDate = normalizedEndDate;

    // Verificar si ya existe un timer para esta reposición y área
    const existingTimer = await db.select().from(repositionTimers)
      .where(and(
        eq(repositionTimers.repositionId, repositionId),
        eq(repositionTimers.area, area)
      )).limit(1);

    if (existingTimer.length > 0) {
      // No permitir cambios si ya existe un tiempo registrado
      throw new Error('Ya existe un tiempo registrado para esta área. No se puede modificar.');
    }

    // Calcular minutos transcurridos considerando fechas diferentes
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    const elapsedMilliseconds = endDateTime.getTime() - startDateTime.getTime();
    const elapsedMinutes = Math.floor(elapsedMilliseconds / (1000 * 60));

    // Asegurar que elapsedMinutes es un número válido
    if (isNaN(elapsedMinutes) || elapsedMinutes < 0) {
      throw new Error('Error al calcular el tiempo transcurrido');
    }

    console.log(`Manual time calculation: ${startDate} ${startTime} to ${endDate} ${endTime} = ${elapsedMinutes} minutes`);

    // Crear nuevo timer
    const [timer] = await db.insert(repositionTimers)
      .values({
        repositionId,
        area,
        userId,
        manualStartTime: startTime,
        manualEndTime: endTime,
        manualDate: date,
        manualStartDate: startDate,
        manualEndDate: endDate,
        elapsedMinutes: Math.round(elapsedMinutes), // Redondear para evitar decimales problemáticos
        isRunning: false,
      })
      .returning();

    console.log('Timer created with elapsed minutes:', timer.elapsedMinutes);

    // Registrar en historial con tiempo calculado
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = Math.round(elapsedMinutes % 60);
    const timeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    await db.insert(repositionHistory).values({
      repositionId,
      action: 'manual_time_set',
      description: `Tiempo registrado manualmente en área ${area}: ${startDate} ${startTime} - ${endDate} ${endTime} - Duración: ${timeFormatted}`,
      userId
    });

    return timer;
  }

  async getRepositionTimer(repositionId: number, area: Area): Promise<SharedRepositionTimer | null> {
    const [timer] = await db.select().from(repositionTimers)
      .where(and(
        eq(repositionTimers.repositionId, repositionId),
        eq(repositionTimers.area, area)
      )).limit(1);

    return timer || null;
  }

  // Funciones para gestión de materiales
  async updateRepositionMaterialStatus(repositionId: number, materialStatus: string, missingMaterials?: string, notes?: string): Promise<void> {
    const existingMaterial = await db.select().from(repositionMaterials)
      .where(eq(repositionMaterials.repositionId, repositionId))
      .limit(1);

    if (existingMaterial.length > 0) {
      await db.update(repositionMaterials)
        .set({
          materialStatus: materialStatus as any,
          missingMaterials,
          notes,
          updatedAt: new Date()
        })
        .where(eq(repositionMaterials.repositionId, repositionId));
    } else {
      await db.insert(repositionMaterials).values({
        repositionId,
        materialStatus: materialStatus as any,
        missingMaterials,
        notes
      });
    }

    // Registrar en historial
    await this.addRepositionHistory(
      repositionId,
      'material_status_updated',
      `Estado de materiales actualizado: ${materialStatus}${missingMaterials ? ` - Faltantes: ${missingMaterials}` : ''}`,
      1 // Esto debería ser el ID del usuario actual
    );
  }

  async pauseReposition(repositionId: number, reason: string, userId: number): Promise<void> {
    const existingMaterial = await db.select().from(repositionMaterials)
      .where(eq(repositionMaterials.repositionId, repositionId))
      .limit(1);

    if (existingMaterial.length > 0) {
      await db.update(repositionMaterials)
        .set({
          isPaused: true,
          pauseReason: reason,
          pausedBy: userId,
          pausedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(repositionMaterials.repositionId, repositionId));
    } else {
      await db.insert(repositionMaterials).values({
        repositionId,
        isPaused: true,
        pauseReason: reason,
        pausedBy: userId,
        pausedAt: new Date()
      });
    }

    // Registrar en historial
    await this.addRepositionHistory(
      repositionId,
      'paused',
      `Reposición pausada por almacén. Motivo: ${reason}`,
      userId
    );

    // Notificar a áreas relevantes
    const areaUsers = await db.select().from(users)
      .where(or(
        eq(users.area, 'admin'),
        eq(users.area, 'operaciones'),
        eq(users.area, 'envios')
      ));

    for (const user of areaUsers) {
      await this.createNotification({
        userId: user.id,
        type: 'reposition_paused',
        title: 'Reposición Pausada',
        message: `La reposición ha sido pausada por almacén. Motivo: ${reason}`,
        repositionId
      });
    }
  }

  async resumeReposition(repositionId: number, userId: number): Promise<void> {
    await db.update(repositionMaterials)
      .set({
        isPaused: false,
        pauseReason: null,
        resumedBy: userId,
        resumedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(repositionMaterials.repositionId, repositionId));

    // Registrar en historial
    await this.addRepositionHistory(
      repositionId,
      'resumed',
      'Reposición reanudada por almacén',
      userId
    );

    // Notificar a áreas relevantes
    const areaUsers = await db.select().from(users)
      .where(or(
        eq(users.area, 'admin'),
        eq(users.area, 'operaciones'),
        eq(users.area, 'envios')
      ));

    for (const user of areaUsers) {
      await this.createNotification({
        userId: user.id,
        type: 'reposition_resumed',
        title: 'Reposición Reanudada',
        message: 'La reposición ha sido reanudada por almacén',
        repositionId
      });
    }
  }

  async getRepositionMaterialStatus(repositionId: number): Promise<any> {
    const material = await db.select().from(repositionMaterials)
      .where(eq(repositionMaterials.repositionId, repositionId))
      .limit(1);

    return material[0] || null;
  }

  async saveRepositionDocument(documentData: {
    repositionId: number;
    filename: string;
    originalName: string;
    size: number;
    path: string;
    uploadedBy: number;
  }): Promise<any> {
      const allowedExtensions = ['.pdf', '.xml', '.jpg', '.jpeg', '.png'];
      const fileExtension = documentData.originalName.toLowerCase().split('.').pop();

      if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
          throw new Error('Tipo de archivo no permitido. Solo se permiten archivos PDF, XML, JPG, PNG y JPEG.');
      }

    const [document] = await db.insert(documents)
      .values({
        filename: documentData.filename,
        originalName: documentData.originalName,
        size: documentData.size,
        path: documentData.path,
        repositionId: documentData.repositionId,
        uploadedBy: documentData.uploadedBy,
      })
      .returning();

    return document;
  }

  async saveOrderDocument(documentData: {
    orderId: number;
    filename: string;
    originalName: string;
    size: number;
    path: string;
    uploadedBy: number;
  }): Promise<any> {
    console.log('=== SAVE ORDER DOCUMENT DEBUG ===');
    console.log('Document data received:', documentData);

    // Validate required fields
    if (!documentData.size || documentData.size <= 0) {
      throw new Error('Size field is required and must be greater than 0');
    }

    if (!documentData.filename || !documentData.originalName) {
      throw new Error('Filename and originalName are required');
    }

    if (!documentData.orderId || !documentData.uploadedBy) {
      throw new Error('OrderId and uploadedBy are required');
    }

    console.log('All validations passed, inserting document...');

    const [document] = await db.insert(documents)
      .values({
        filename: documentData.filename,
        originalName: documentData.originalName,
        size: documentData.size,
        path: documentData.path,
        orderId: documentData.orderId,
        uploadedBy: documentData.uploadedBy,
      })
      .returning();

    console.log('Document saved successfully:', document);
    console.log('=== END SAVE ORDER DOCUMENT DEBUG ===');

    return document;
  }

  async getRepositionDocuments(repositionId: number): Promise<any[]> {
    const docs = await db.select({
      id: documents.id,
      filename: documents.filename,
      originalName: documents.originalName,
      size: documents.size,
      uploadedBy: documents.uploadedBy,
      createdAt: documents.createdAt,
      uploaderName: users.name
    })
    .from(documents)
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(eq(documents.repositionId, repositionId))
    .orderBy(documents.createdAt);

    return docs;
  }

  async getRepositionPieces(repositionId: number): Promise<any[]> {
    const pieces = await db.select({
      id: repositionPieces.id,
      talla: repositionPieces.talla,
      cantidad: repositionPieces.cantidad,
      folioOriginal: repositionPieces.folioOriginal
    })
    .from(repositionPieces)
    .where(eq(repositionPieces.repositionId, repositionId))
    .orderBy(repositionPieces.id);

    console.log('Pieces from database:', pieces);
    return pieces;
  }

  async getAllRepositionsForAlmacen(): Promise<any[]> {
    const result = await db.select({
      id: repositions.id,
      folio: repositions.folio,
      type: repositions.type,
      solicitanteNombre: repositions.solicitanteNombre,
      solicitanteArea: repositions.solicitanteArea,
      modeloPrenda: repositions.modeloPrenda,
      tela: repositions.tela,
      color: repositions.color,
      tipoPieza: repositions.tipoPieza,
      consumoTela: repositions.consumoTela,
      urgencia: repositions.urgencia,
      currentArea: repositions.currentArea,
      status: repositions.status,
      createdAt: repositions.createdAt,
      isPaused: repositionMaterials.isPaused,
      pauseReason: repositionMaterials.pauseReason
    })
    .from(repositions)
    .leftJoin(repositionMaterials, eq(repositions.id, repositionMaterials.repositionId))
    .where(and(
      ne(repositions.status, 'eliminado' as RepositionStatus),
      ne(repositions.status, 'completado' as RepositionStatus)
    ))
    .orderBy(desc(repositions.createdAt));

    return result;
  }

async createReposition(data: InsertReposition & { folio: string, productos?: any[], telaContraste?: any, volverHacer?:string, materialesImplicados?:string, observaciones?: string }, pieces: InsertRepositionPiece[], createdBy: number): Promise<Reposition> {
    const { productos, telaContraste, volverHacer, materialesImplicados, observaciones, ...mainRepositionData } = data;

    const [reposition] = await db.insert(repositions)
      .values({
        ...mainRepositionData,
        createdBy,
        volverHacer: volverHacer,
        descripcionSuceso: data.descripcionSuceso,
        materialesImplicados: materialesImplicados,
        observaciones: observaciones,
        createdAt: createMexicoTimestamp()
      })
      .returning();

    if (pieces.length > 0) {
      await db.insert(repositionPieces)
        .values(pieces.map(piece => ({
          ...piece,
          repositionId: reposition.id
        })));
    }

    // Guardar productos adicionales si existen
    if (productos && productos.length > 0) {
      await db.insert(repositionProducts)
        .values(productos.map(producto => ({
          repositionId: reposition.id,
          modeloPrenda: producto.modeloPrenda,
          tela: producto.tela,
          color: producto.color,
          tipoPieza: producto.tipoPieza,
          consumoTela: producto.consumoTela || 0
        })));
    }

    // Guardar tela contraste si existe
    if (telaContraste) {
      await db.insert(repositionContrastFabrics)
        .values({
          repositionId: reposition.id,
          tela: telaContraste.tela,
          color: telaContraste.color,
          consumo: telaContraste.consumo
        });

      // Guardar piezas de tela contraste si existen
      if (telaContraste.pieces && telaContraste.pieces.length > 0) {
        // Crear entradas separadas para las piezas de contraste
        // Esto puede requerir una tabla adicional o manejo especial
      }
    }

    await this.addRepositionHistory(
      reposition.id,
      'created',
      `Reposición ${reposition.type} creada`,
      createdBy,
    );

    // Notificar a admin, operaciones y envíos sobre nueva reposición
    const adminUsers = await db.select().from(users)
      .where(eq(users.area, 'admin'));

    const operacionesUsers = await db.select().from(users)
      .where(eq(users.area, 'operaciones'));

    const enviosUsers = await db.select().from(users)
      .where(eq(users.area, 'envios'));

    const allTargetUsers = [...adminUsers, ...operacionesUsers, ...enviosUsers];

    for (const targetUser of allTargetUsers) {
      await this.createNotification({
        userId: targetUser.id,
        type: 'new_reposition',
        title: 'Nueva Solicitud de Reposición',
        message: `Se ha creado una nueva solicitud de ${data.type}: ${data.folio}`,
        repositionId: reposition.id,
      });
    }

    return reposition;
  }


  async getRepositionById(id: number): Promise<any | undefined> {
    const [reposition] = await db.select().from(repositions).where(eq(repositions.id, id));
    if (!reposition) return undefined;

    // Obtener tela de contraste si existe
    const contrastFabric = await db.select().from(repositionContrastFabrics)
      .where(eq(repositionContrastFabrics.repositionId, id))
      .limit(1);

    return {
      id: reposition.id,
      folio: reposition.folio,
      type: reposition.type,
      solicitanteNombre: reposition.solicitanteNombre,
      solicitanteArea: reposition.solicitanteArea,
      fechaSolicitud: reposition.fechaSolicitud,
      noSolicitud: reposition.noSolicitud,
      noHoja: reposition.noHoja,
      fechaCorte: reposition.fechaCorte,
      causanteDano: reposition.causanteDano,
      descripcionSuceso: reposition.descripcionSuceso,
      modeloPrenda: reposition.modeloPrenda,
      tela: reposition.tela,
      color: reposition.color,
      tipoPieza: reposition.tipoPieza,
      urgencia: reposition.urgencia,
      observaciones: reposition.observaciones,
      currentArea: reposition.currentArea,
      status: reposition.status,
      createdAt: reposition.createdAt,
      approvedAt: reposition.approvedAt,
      consumoTela: reposition.consumoTela,
      tipoAccidente: reposition.tipoAccidente,
      otroAccidente: reposition.otroAccidente,
      volverHacer: reposition.volverHacer,
      materialesImplicados: reposition.materialesImplicados,
      telaContraste: contrastFabric.length > 0 ? contrastFabric[0] : null
    };
  }

  async updateUser(userId: number, updateData: any): Promise<void> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar datos para actualización
      const updateFields: any = {
        name: updateData.name,
        username: updateData.username,
        area: updateData.area,
        updatedAt: new Date()
      };

      // Solo incluir password si se proporciona
      if (updateData.password) {
        updateFields.password = updateData.password;
      }

      await db.update(users)
        .set(updateFields)
        .where(eq(users.id, userId));

      console.log(`User ${userId} updated successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async addRepositionHistory(
    repositionId: number,
    action: string,
    description: string,
    userId: number,
    fromArea?: Area,
    toArea?: Area,
    pieces?: number
  ): Promise<void> {
    await db.insert(repositionHistory).values({
      repositionId,
      action,
      description,
      userId,
      fromArea,
      toArea,
      pieces,
      createdAt: createMexicoTimestamp()
    });
  }

   async getOrderHistory(orderId: number): Promise<any[]> {
    try {
      const history = await db
        .select({
          id: orderHistory.id,
          action: orderHistory.action,
          description: orderHistory.description,
          fromArea: orderHistory.fromArea,
          toArea: orderHistory.toArea,
          pieces: orderHistory.pieces,
          createdAt: orderHistory.createdAt,
        })
        .from(orderHistory)
        .where(eq(orderHistory.orderId, orderId))
        .orderBy(asc(orderHistory.createdAt));

      return history;
    } catch (error) {
      console.error("Error getting order history:", error);
      throw new Error("Error al obtener historial del pedido");
    }
  }

  async getOrderDocuments(orderId: number): Promise<any[]> {
    try {
      const docs = await db
        .select({
          id: documents.id,
          filename: documents.filename,
          originalName: documents.originalName,
          size: documents.size,
          uploadedBy: documents.uploadedBy,
          createdAt: documents.createdAt,
          uploaderName: users.name
        })
        .from(documents)
        .leftJoin(users, eq(documents.uploadedBy, users.id))
        .where(eq(documents.orderId, orderId))
        .orderBy(desc(documents.createdAt));

      return docs;
    } catch (error) {
      console.error("Error getting order documents:", error);
      throw new Error("Error al obtener documentos del pedido");
    }
  }

  // Funciones de métricas
  async getMonthlyMetrics(month: number, year: number): Promise<any> {
    console.log(`Getting monthly metrics for ${month}/${year}`);

    // Ajustar la fecha para considerar la zona horaria de México
    const startDate = new Date(year, month, 1);
    startDate.setHours(6, 0, 0, 0); // UTC+6 para México

    const endDate = new Date(year, month + 1, 0);
    endDate.setHours(29, 59, 59, 999); // Fin del día en UTC

    console.log('Date range:', startDate.toISOString(), 'to', endDate.toISOString());

    try {
      // Reposiciones del mes por área y tipo
      const repositionsQuery = await db.select({
        area: repositions.solicitanteArea,
        type: repositions.type,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(repositions)
      .where(and(
        gte(repositions.createdAt, startDate),
        lte(repositions.createdAt, endDate),
        ne(repositions.status, 'eliminado' as RepositionStatus)
      ))
      .groupBy(repositions.solicitanteArea, repositions.type);

    console.log('Repositions query result:', repositionsQuery);

      const totalRepositions = repositionsQuery.reduce((sum, item) => sum + item.count, 0);
      console.log('Total repositions:', totalRepositions);

      // Si no hay reposiciones, retornar datos vacíos
      if (totalRepositions === 0) {
        return {
          byArea: [],
          byAreaAndType: [],
          byCause: [],
          total: 0
        };
      }

      // Agrupar por área sumando todos los tipos
      const areaMap = new Map<string, { count: number, reposiciones: number, reprocesos: number }>();

      repositionsQuery.forEach(item => {
        const area = item.area || 'Sin área';
        if (!areaMap.has(area)) {
          areaMap.set(area, { count: 0, reposiciones: 0, reprocesos: 0 });
        }
        const areaData = areaMap.get(area)!;
        areaData.count += item.count;

        if (item.type === 'repocision') {
          areaData.reposiciones += item.count;
        } else if (item.type === 'reproceso') {
          areaData.reprocesos += item.count;
        }
      });

      // Calcular piezas por área usando un join directo sin contar repositions.id
      const byArea = await Promise.all(Array.from(areaMap.entries()).map(async ([area, data]) => {
        try {
          // Contar piezas directamente sin referencias a repositions.id en el SELECT
          const areaPiecesQuery = await db.select({
            totalPieces: sql<number>`COUNT(rp.id)::int`
          })
          .from(repositionPieces.alias('rp'))
          .innerJoin(repositions.alias('r'), eq(sql`rp.reposition_id`, sql`r.id`))
          .where(and(
            eq(sql`r.solicitante_area`, area),
            gte(sql`r.created_at`, startDate),
            lte(sql`r.created_at`, endDate),
            ne(sql`r.status`, 'eliminado')
          ));

          const pieces = areaPiecesQuery[0]?.totalPieces || 0;
          const percentage = totalRepositions > 0 ? Math.round((data.count / totalRepositions) * 100) : 0;

          return {
            area,
            count: data.count,
            reposiciones: data.reposiciones,
            reprocesos: data.reprocesos,
            pieces,
            percentage
          };
        } catch (error) {
          console.error(`Error calculating pieces for area ${area}:`, error);
          return {
            area,
            count: data.count,
            reposiciones: data.reposiciones,
            reprocesos: data.reprocesos,
            pieces: 0,
            percentage: totalRepositions > 0 ? Math.round((data.count / totalRepositions) * 100) : 0
          };
        }
      }));

      // Datos detallados por área y tipo para gráficos específicos
      const byAreaAndType = repositionsQuery.map(item => ({
        area: item.area || 'Sin área',
        type: item.type,
        count: item.count,
        percentage: totalRepositions > 0 ? Math.round((item.count / totalRepositions) * 100) : 0
      }));

      // Causas de daño del mes
      const causesQuery = await db.select({
        cause: repositions.tipoAccidente,
        count: sql<number>`COUNT(*)::int`
      })
      .from(repositions)
      .where(and(
        gte(repositions.createdAt, startDate),
        lte(repositions.createdAt, endDate),
        ne(repositions.status, 'eliminado' as RepositionStatus),
        isNotNull(repositions.tipoAccidente)
      ))
      .groupBy(repositions.tipoAccidente);

      const totalCauses = causesQuery.reduce((sum, item) => sum + item.count, 0);
      const byCause = causesQuery.map(item => ({
        cause: item.cause || 'Sin especificar',
        count: item.count,
        percentage: totalCauses > 0 ? Math.round((item.count / totalCauses) * 100) : 0
      }));

      console.log('Final metrics result:', { byArea, byAreaAndType, byCause, total: totalRepositions });

      return {
        byArea,
        byAreaAndType,
        byCause,
        total: totalRepositions
      };
    } catch (error) {
      console.error('Get monthly metrics error:', error);
      throw new Error('Error al obtener métricas mensuales: ' + error.message);
    }
  }

  async getOverallMetrics(): Promise<any> {
    console.log('Getting overall metrics...');

    // Total de reposiciones
    const totalRepositionsQuery = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(repositions)
      .where(ne(repositions.status, 'eliminado' as RepositionStatus));

    const totalRepositions = totalRepositionsQuery[0]?.count || 0;
    console.log('Total repositions:', totalRepositions);

    // Total de piezas
    const totalPiecesQuery = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(repositionPieces)
      .innerJoin(repositions, eq(repositionPieces.repositionId, repositions.id))
      .where(ne(repositions.status, 'eliminado' as RepositionStatus));

    const totalPieces = totalPiecesQuery[0]?.count || 0;
    console.log('Total pieces:', totalPieces);

    // Área más activa
    let mostActiveArea = 'N/A';
    if (totalRepositions > 0) {
      const mostActiveAreaQuery = await db.select({
        area: repositions.solicitanteArea,
        count: sql<number>`COUNT(*)::int`
      })
      .from(repositions)
      .where(and(
        ne(repositions.status, 'eliminado' as RepositionStatus),
        isNotNull(repositions.solicitanteArea)
      ))
      .groupBy(repositions.solicitanteArea)
      .orderBy(desc(sql<number>`COUNT(*)::int`))
      .limit(1);

      mostActiveArea = mostActiveAreaQuery[0]?.area || 'N/A';
    }
    console.log('Most active area:', mostActiveArea);

    // Promedio mensual (últimos 12 meses)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyAvgQuery = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(repositions)
      .where(and(
        gte(repositions.createdAt, twelveMonthsAgo),
        ne(repositions.status, 'eliminado' as RepositionStatus)
      ));

    const monthlyAverage = Math.round((monthlyAvgQuery[0]?.count || 0) / 12);
    console.log('Monthly average:', monthlyAverage);

    const result = {
      totalRepositions,
      totalPieces,
      mostActiveArea,
      monthlyAverage
    };

    console.log('Overall metrics result:', result);
    return result;
  }

  async getRequestAnalysis(): Promise<any> {
    console.log('Getting request analysis...');

    // Obtener todas las reposiciones agrupadas por número de solicitud
    const requestsQuery = await db.select({
      noSolicitud: repositions.noSolicitud,
      type: repositions.type,
      count: sql<number>`COUNT(*)::int`
    })
    .from(repositions)
    .where(and(
      ne(repositions.status, 'eliminado' as RepositionStatus),
      isNotNull(repositions.noSolicitud)
    ))
    .groupBy(repositions.noSolicitud, repositions.type);

    console.log('Requests query result:', requestsQuery);

    // Procesar los datos para obtener reposiciones y reprocesos por solicitud
    const requestsMap = new Map();

    requestsQuery.forEach(item => {
      const key = item.noSolicitud;
      if (!requestsMap.has(key)) {
        requestsMap.set(key, { reposiciones: 0, reprocesos: 0 });
      }

      const data = requestsMap.get(key);
      if (item.type === 'repocision') {
        data.reposiciones += item.count;
      } else if (item.type === 'reproceso') {
        data.reprocesos += item.count;
      }
    });

    console.log('Requests map:', requestsMap);

    // Convertir a array y calcular totales
    const topRequests = Array.from(requestsMap.entries())
      .map(([noSolicitud, data]: [string, any]) => ({
        noSolicitud,
        reposiciones: data.reposiciones,
        reprocesos: data.reprocesos,
        total: data.reposiciones + data.reprocesos
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const totalRequestsWithRepositions = requestsMap.size;
    const allRepositionsCount = requestsQuery.reduce((sum, item) => sum + item.count, 0);
    const averageRepositionsPerRequest = totalRequestsWithRepositions > 0 
      ? Math.round(allRepositionsCount / totalRequestsWithRepositions * 100) / 100 
      : 0;

    const mostProblematicRequest = topRequests[0]?.noSolicitud || 'N/A';

    const result = {
      totalRequestsWithRepositions,
      averageRepositionsPerRequest,
      mostProblematicRequest,
      topRequests
    };

    console.log('Request analysis result:', result);
    return result;
  }

  async exportMonthlyMetrics(month: number, year: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const metrics = await this.getMonthlyMetrics(month, year);

    // Hoja 1: Reposiciones por área
    const worksheet1 = workbook.addWorksheet('Por Área');
    worksheet1.columns = [
      { header: 'Área', key: 'area', width: 15 },
      { header: 'Total', key: 'count', width: 15 },
      { header: 'Reposiciones', key: 'reposiciones', width: 15 },
      { header: 'Reprocesos', key: 'reprocesos', width: 15 },
      { header: 'Piezas', key: 'pieces', width: 15 },
      { header: 'Porcentaje del Total', key: 'percentage', width: 18 }
    ];

    metrics.byArea.forEach((item: any) => {
      worksheet1.addRow({
        area: item.area,
        count: item.count,
        reposiciones: item.reposiciones || 0,
        reprocesos: item.reprocesos || 0,
        pieces: item.pieces,
        percentage: `${item.percentage}%`
      });
    });

    // Hoja 2: Causas de daño
    const worksheet2 = workbook.addWorksheet('Causas de Daño');
    worksheet2.columns = [
      { header: 'Causa', key: 'cause', width: 30 },
      { header: 'Cantidad', key: 'count', width: 15 },
      { header: 'Porcentaje', key: 'percentage', width: 15 }
    ];

    metrics.byCause.forEach((item: any) => {
      worksheet2.addRow(item);
    });

    // Estilo para headers
    [worksheet1, worksheet2].forEach(ws => {
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportOverallMetrics(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Métricas Generales');
    const metrics = await this.getOverallMetrics();

    worksheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor', key: 'value', width: 15 }
    ];

    worksheet.addRow({ metric: 'Total Reposiciones', value: metrics.totalRepositions });
    worksheet.addRow({ metric: 'Total Piezas', value: metrics.totalPieces });
    worksheet.addRow({ metric: 'Área Más Activa', value: metrics.mostActiveArea });
    worksheet.addRow({ metric: 'Promedio Mensual', value: metrics.monthlyAverage });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6E6' }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportRequestAnalysis(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Análisis de Solicitudes');

    // Headers
    worksheet.columns = [
      { header: 'No. Solicitud', key: 'noSolicitud', width: 15 },
      { header: 'Total Reposiciones', key: 'total', width: 18 },
      { header: 'Reposiciones', key: 'reposiciones', width: 15 },
      { header: 'Reprocesos', key: 'reprocesos', width: 15 },
    ];

    const analysis = await this.getRequestAnalysis();
    analysis.topRequests.forEach((request: any) => {
      worksheet.addRow(request);
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6E6' }
    };

    // Aplicar bordes a todas las celdas
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async clearEntireDatabase(): Promise<void> {
    console.log('Starting complete database clear...');

    try {
      // Eliminar en orden específico debido a foreign keys
      await db.delete(documents);
      await db.delete(repositionTimers);
      await db.delete(repositionTransfers);
      await db.delete(repositionHistory);
      await db.delete(repositionMaterials);
      await db.delete(repositionContrastFabrics);
      await db.delete(repositionProducts);
      await db.delete(repositionPieces);
      await db.delete(repositions);

      await db.delete(agendaEvents);
      await db.delete(adminPasswords);

      await db.delete(notifications);
      await db.delete(transfers);
      await db.delete(orderHistory);
      await db.delete(orderPieces);
      await db.delete(orders);

      // Mantener solo el usuario admin
      await db.delete(users).where(ne(users.area, 'admin'));

      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      throw new Error('Error al limpiar la base de datos: ' + error.message);
    }
  }

  async resetUserSequence(): Promise<void> {
    try {
      await db.execute(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1;`);
      console.log('User ID sequence reset successfully');
    } catch (error) {
      console.error('Error resetting user ID sequence:', error);
      throw new Error('Error al reiniciar la secuencia de ID de usuario: ' + error.message);
    }
  }
}

export const storage = new DatabaseStorage();