


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_feature"("venue" "uuid", "feat_slug" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare fid int;
begin
  select id into fid from public.features where slug = feat_slug;
  if fid is null then raise exception 'feature % não existe', feat_slug; end if;
  insert into public.venue_features (venue_id, feature_id)
  values (venue, fid)
  on conflict do nothing;
end;
$$;


ALTER FUNCTION "public"."add_feature"("venue" "uuid", "feat_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id, name, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'name','Usuário'),
          coalesce(new.raw_user_meta_data->>'role','USER'))
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" integer NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."features" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."features_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."features_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."features_id_seq" OWNED BY "public"."features"."id";



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venue_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "image_url" "text",
    "published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "role" "text" DEFAULT 'USER'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "birth_date" "date",
    "avatar_url" "text",
    "bio" "text",
    "home_lat" numeric,
    "home_lng" numeric,
    "max_distance_km" numeric DEFAULT 10,
    "budget_level" numeric,
    "fav_categories" "text"[],
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['USER'::"text", 'OWNER'::"text", 'ADMIN'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feature_prefs" (
    "user_id" "uuid" NOT NULL,
    "feature_id" integer NOT NULL,
    "weight" smallint DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feature_prefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venue_features" (
    "venue_id" "uuid" NOT NULL,
    "feature_id" integer NOT NULL
);


ALTER TABLE "public"."venue_features" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."venue_features_view" AS
 SELECT "vf"."venue_id",
    "f"."slug"
   FROM ("public"."venue_features" "vf"
     JOIN "public"."features" "f" ON (("f"."id" = "vf"."feature_id")));


ALTER VIEW "public"."venue_features_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "avg_price" numeric(10,2),
    "status" "text" DEFAULT 'aberto'::"text" NOT NULL,
    "rating" numeric(2,1),
    "lat" double precision NOT NULL,
    "lng" double precision NOT NULL,
    "address" "text" NOT NULL,
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "logo_url" "text",
    "cover_url" "text"
);


ALTER TABLE "public"."venues" OWNER TO "postgres";


ALTER TABLE ONLY "public"."features" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."features_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feature_prefs"
    ADD CONSTRAINT "user_feature_prefs_pkey" PRIMARY KEY ("user_id", "feature_id");



ALTER TABLE ONLY "public"."venue_features"
    ADD CONSTRAINT "venue_features_pkey" PRIMARY KEY ("venue_id", "feature_id");



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_pkey" PRIMARY KEY ("id");



CREATE INDEX "posts_venue_created_idx" ON "public"."posts" USING "btree" ("venue_id", "created_at" DESC);



CREATE INDEX "venues_category_idx" ON "public"."venues" USING "btree" ("category");



CREATE INDEX "venues_owner_idx" ON "public"."venues" USING "btree" ("owner_id");



CREATE UNIQUE INDEX "venues_slug_key" ON "public"."venues" USING "btree" ("slug");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feature_prefs"
    ADD CONSTRAINT "user_feature_prefs_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feature_prefs"
    ADD CONSTRAINT "user_feature_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_features"
    ADD CONSTRAINT "venue_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venue_features"
    ADD CONSTRAINT "venue_features_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."venues"
    ADD CONSTRAINT "venues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "meu registro de prefs" ON "public"."user_feature_prefs" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "owner can delete posts" ON "public"."posts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "posts"."venue_id") AND ("v"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner can insert posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "posts"."venue_id") AND ("v"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner can update posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "posts"."venue_id") AND ("v"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "posts"."venue_id") AND ("v"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner manages venue_features" ON "public"."venue_features" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_features"."venue_id") AND ("v"."owner_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "venue_features"."venue_id") AND ("v"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owners can delete own" ON "public"."venues" FOR DELETE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "owners can insert" ON "public"."venues" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "owners can update own" ON "public"."venues" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read venue_features" ON "public"."venue_features" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public read venues" ON "public"."venues" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "public_read_published_posts" ON "public"."posts" FOR SELECT USING (("published" = true));



CREATE POLICY "public_read_venues_for_feed" ON "public"."venues" FOR SELECT USING (true);



CREATE POLICY "read own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "read published or owner" ON "public"."posts" FOR SELECT USING ((("published" = true) OR (EXISTS ( SELECT 1
   FROM "public"."venues" "v"
  WHERE (("v"."id" = "posts"."venue_id") AND ("v"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."user_feature_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venue_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venues" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_feature"("venue" "uuid", "feat_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_feature"("venue" "uuid", "feat_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_feature"("venue" "uuid", "feat_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON SEQUENCE "public"."features_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."features_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."features_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_feature_prefs" TO "anon";
GRANT ALL ON TABLE "public"."user_feature_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feature_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."venue_features" TO "anon";
GRANT ALL ON TABLE "public"."venue_features" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_features" TO "service_role";



GRANT ALL ON TABLE "public"."venue_features_view" TO "anon";
GRANT ALL ON TABLE "public"."venue_features_view" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_features_view" TO "service_role";



GRANT ALL ON TABLE "public"."venues" TO "anon";
GRANT ALL ON TABLE "public"."venues" TO "authenticated";
GRANT ALL ON TABLE "public"."venues" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







