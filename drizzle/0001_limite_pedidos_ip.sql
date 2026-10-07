ALTER TABLE "pedidos" ADD COLUMN "ip_hash" text;--> statement-breakpoint
CREATE INDEX "pedidos_ip_hash_idx" ON "pedidos" USING btree ("ip_hash","creado_en");