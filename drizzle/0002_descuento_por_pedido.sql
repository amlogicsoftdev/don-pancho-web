ALTER TABLE "pedidos" ADD COLUMN "descuento_aplicado_por" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "descuento_aplicado_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_descuento_aplicado_por_usuarios_id_fk" FOREIGN KEY ("descuento_aplicado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;