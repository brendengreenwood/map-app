CREATE TABLE "competitor_commodities" (
	"id" text PRIMARY KEY NOT NULL,
	"competitor_id" text NOT NULL,
	"commodity" text NOT NULL,
	CONSTRAINT "competitor_commodities_unique" UNIQUE("competitor_id","commodity")
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lng" double precision,
	"lat" double precision,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "elevator_commodities" (
	"id" text PRIMARY KEY NOT NULL,
	"elevator_id" text NOT NULL,
	"commodity" text NOT NULL,
	CONSTRAINT "elevator_commodities_unique" UNIQUE("elevator_id","commodity")
);
--> statement-breakpoint
CREATE TABLE "elevators" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_user_id" text,
	"name" text NOT NULL,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" serial PRIMARY KEY NOT NULL,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"name" text,
	"category" text,
	"value" double precision,
	"properties" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "merchant_originators" (
	"merchant_user_id" text NOT NULL,
	"originator_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "merchant_originators_merchant_user_id_originator_user_id_pk" PRIMARY KEY("merchant_user_id","originator_user_id")
);
--> statement-breakpoint
CREATE TABLE "producer_assignments" (
	"producer_id" text NOT NULL,
	"originator_user_id" text NOT NULL,
	CONSTRAINT "producer_assignments_producer_id_originator_user_id_pk" PRIMARY KEY("producer_id","originator_user_id")
);
--> statement-breakpoint
CREATE TABLE "producer_commodities" (
	"id" text PRIMARY KEY NOT NULL,
	"producer_id" text NOT NULL,
	"commodity" text NOT NULL,
	CONSTRAINT "producer_commodities_unique" UNIQUE("producer_id","commodity")
);
--> statement-breakpoint
CREATE TABLE "producer_locations" (
	"id" text PRIMARY KEY NOT NULL,
	"producer_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"lng" double precision,
	"lat" double precision,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "producers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"business_name" text,
	"lng" double precision,
	"lat" double precision,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "competitor_commodities" ADD CONSTRAINT "competitor_commodities_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevator_commodities" ADD CONSTRAINT "elevator_commodities_elevator_id_elevators_id_fk" FOREIGN KEY ("elevator_id") REFERENCES "public"."elevators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elevators" ADD CONSTRAINT "elevators_merchant_user_id_users_id_fk" FOREIGN KEY ("merchant_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_originators" ADD CONSTRAINT "merchant_originators_merchant_user_id_users_id_fk" FOREIGN KEY ("merchant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_originators" ADD CONSTRAINT "merchant_originators_originator_user_id_users_id_fk" FOREIGN KEY ("originator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_assignments" ADD CONSTRAINT "producer_assignments_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_assignments" ADD CONSTRAINT "producer_assignments_originator_user_id_users_id_fk" FOREIGN KEY ("originator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_commodities" ADD CONSTRAINT "producer_commodities_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_locations" ADD CONSTRAINT "producer_locations_producer_id_producers_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_elevators_merchant_user" ON "elevators" USING btree ("merchant_user_id");--> statement-breakpoint
CREATE INDEX "idx_features_coords" ON "features" USING btree ("lng","lat");--> statement-breakpoint
CREATE INDEX "idx_features_category" ON "features" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_merchant_originators_merchant" ON "merchant_originators" USING btree ("merchant_user_id");--> statement-breakpoint
CREATE INDEX "idx_merchant_originators_originator" ON "merchant_originators" USING btree ("originator_user_id");--> statement-breakpoint
CREATE INDEX "idx_producer_assignments_originator" ON "producer_assignments" USING btree ("originator_user_id");--> statement-breakpoint
CREATE INDEX "idx_producer_locations_producer" ON "producer_locations" USING btree ("producer_id");