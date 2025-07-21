CREATE TYPE "public"."area" AS ENUM('patronaje', 'corte', 'bordado', 'ensamble', 'plancha', 'calidad', 'operaciones', 'admin', 'almacen', 'diseño', 'envios');--> statement-breakpoint
CREATE TYPE "public"."material_status" AS ENUM('disponible', 'falta_parcial', 'no_disponible');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('transfer_request', 'transfer_accepted', 'transfer_rejected', 'order_completed', 'new_reposition', 'reposition_transfer', 'reposition_approved', 'reposition_rejected', 'reposition_completed', 'reposition_deleted', 'reposition_canceled', 'reposition_paused', 'reposition_resumed', 'reposition_received', 'transfer_processed', 'completion_approval_needed', 'partial_transfer_warning');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."reposition_status" AS ENUM('pendiente', 'aprobado', 'rechazado', 'completado', 'eliminado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."reposition_type" AS ENUM('repocision', 'reproceso');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('urgente', 'intermedio', 'poco_urgente');--> statement-breakpoint
CREATE TABLE "admin_passwords" (
	"id" serial PRIMARY KEY NOT NULL,
	"password" text NOT NULL,
	"created_by" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_by" integer NOT NULL,
	"assigned_to_area" "area" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"date" varchar(10) NOT NULL,
	"time" varchar(5) NOT NULL,
	"priority" varchar(10) DEFAULT 'media' NOT NULL,
	"status" varchar(15) DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"order_id" integer,
	"reposition_id" integer,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"transfer_id" integer,
	"order_id" integer,
	"reposition_id" integer,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"from_area" "area",
	"to_area" "area",
	"pieces" integer,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"area" "area" NOT NULL,
	"pieces" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"cliente_hotel" text NOT NULL,
	"no_solicitud" text NOT NULL,
	"no_hoja" text,
	"modelo" text NOT NULL,
	"tipo_prenda" text NOT NULL,
	"color" text NOT NULL,
	"tela" text NOT NULL,
	"total_piezas" integer NOT NULL,
	"current_area" "area" DEFAULT 'corte' NOT NULL,
	"status" "order_status" DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "orders_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "reposition_contrast_fabrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"tela" text NOT NULL,
	"color" text NOT NULL,
	"consumo" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"from_area" "area",
	"to_area" "area",
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"material_status" "material_status" DEFAULT 'disponible' NOT NULL,
	"missing_materials" text,
	"notes" text,
	"is_paused" boolean DEFAULT false NOT NULL,
	"pause_reason" text,
	"paused_by" integer,
	"paused_at" timestamp,
	"resumed_by" integer,
	"resumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"talla" text NOT NULL,
	"cantidad" integer NOT NULL,
	"folio_original" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"modelo_prenda" text NOT NULL,
	"tela" text NOT NULL,
	"color" text NOT NULL,
	"tipo_pieza" text NOT NULL,
	"consumo_tela" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_timers" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"area" "area" NOT NULL,
	"user_id" integer NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"elapsed_minutes" real,
	"is_running" boolean DEFAULT false,
	"manual_start_time" varchar(5),
	"manual_end_time" varchar(5),
	"manual_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reposition_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"reposition_id" integer NOT NULL,
	"from_area" "area" NOT NULL,
	"to_area" "area" NOT NULL,
	"notes" text,
	"created_by" integer NOT NULL,
	"processed_by" integer,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "repositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"type" "reposition_type" NOT NULL,
	"solicitante_nombre" text NOT NULL,
	"solicitante_area" "area" NOT NULL,
	"fecha_solicitud" timestamp DEFAULT now() NOT NULL,
	"no_solicitud" text NOT NULL,
	"no_hoja" text,
	"fecha_corte" text,
	"causante_dano" text NOT NULL,
	"tipo_accidente" text NOT NULL,
	"otro_accidente" text,
	"descripcion_suceso" text NOT NULL,
	"modelo_prenda" text NOT NULL,
	"tela" text NOT NULL,
	"color" text NOT NULL,
	"tipo_pieza" text NOT NULL,
	"consumo_tela" real,
	"urgencia" "urgency" NOT NULL,
	"observaciones" text,
	"volver_hacer" text,
	"materiales_implicados" text,
	"current_area" "area" NOT NULL,
	"status" "reposition_status" DEFAULT 'pendiente' NOT NULL,
	"created_by" integer NOT NULL,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"rejection_reason" text,
	CONSTRAINT "repositions_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"from_area" "area" NOT NULL,
	"to_area" "area" NOT NULL,
	"pieces" integer NOT NULL,
	"status" "transfer_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" integer NOT NULL,
	"processed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"area" "area" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;