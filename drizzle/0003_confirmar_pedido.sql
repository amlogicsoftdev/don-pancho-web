ALTER TABLE "pedidos" ADD COLUMN "tiempo_estimado_min" integer;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "entrega_estimada" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "comandas_impresas" integer DEFAULT 0 NOT NULL;