/**
 * Hand-authored mirror of supabase/migrations/20260825000001_initial_schema.sql.
 *
 * TODO(DECISIONS.md): once a real Supabase project exists, replace this file
 * with `npx supabase gen types typescript --linked > src/types/database.ts`
 * and keep it generated from then on. Hand-authored in the meantime so the
 * Supabase clients (and embedded `.select("*, related(*)")` queries) are
 * typed from day one. `Relationships` entries mirror the FK constraints in
 * the migration, including Postgres's default `<table>_<column>_fkey`
 * naming convention.
 */

export type StoreUserRole = "owner" | "admin" | "editor";
export type TeamType = "club" | "national_team";
export type PriceDisplayMode = "show_price" | "consult" | "hidden";
export type ProductStatus = "draft" | "active" | "sold_out" | "hidden";
export type ProductImageType = "original" | "generated" | "social_feed" | "social_story" | "detail";
export type AiGenerationType = "try_on";
export type AiGenerationStatus =
  "pending" | "processing" | "succeeded" | "failed" | "approved" | "discarded";
export type AnalyticsEventType =
  "catalog_view" | "product_view" | "whatsapp_click" | "selection_add";

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          whatsapp_number: string | null;
          instagram_url: string | null;
          currency: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          whatsapp_number?: string | null;
          instagram_url?: string | null;
          currency?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      store_users: {
        Row: {
          id: string;
          store_id: string;
          user_id: string;
          role: StoreUserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          user_id: string;
          role?: StoreUserRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          type: TeamType;
          country: string | null;
          logo_url: string | null;
          featured: boolean;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          type: TeamType;
          country?: string | null;
          logo_url?: string | null;
          featured?: boolean;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "teams_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["competitions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "competitions_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          team_id: string;
          collection_id: string | null;
          competition_id: string | null;
          name: string;
          slug: string;
          season: string | null;
          model: string | null;
          product_type: string | null;
          description: string | null;
          price: number | null;
          promotional_price: number | null;
          price_display_mode: PriceDisplayMode;
          status: ProductStatus;
          featured: boolean;
          new_arrival: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          team_id: string;
          collection_id?: string | null;
          competition_id?: string | null;
          name: string;
          slug: string;
          season?: string | null;
          model?: string | null;
          product_type?: string | null;
          description?: string | null;
          price?: number | null;
          promotional_price?: number | null;
          price_display_mode?: PriceDisplayMode;
          status?: ProductStatus;
          featured?: boolean;
          new_arrival?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      product_sizes: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          size: string;
          quantity: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          size: string;
          quantity?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_sizes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_sizes_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_sizes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          image_type: ProductImageType;
          url: string;
          sort_order: number;
          ai_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          image_type: ProductImageType;
          url: string;
          sort_order?: number;
          ai_generated?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_images_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      store_hero_images: {
        Row: {
          id: string;
          store_id: string;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          url: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_hero_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "store_hero_images_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_models: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_models"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ai_models_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_model_poses: {
        Row: {
          id: string;
          store_id: string;
          ai_model_id: string;
          name: string;
          reference_image_url: string | null;
          active: boolean;
          usage_count: number;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          ai_model_id: string;
          name: string;
          reference_image_url?: string | null;
          active?: boolean;
          usage_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_model_poses"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ai_model_poses_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_model_poses_ai_model_id_fkey";
            columns: ["ai_model_id"];
            isOneToOne: false;
            referencedRelation: "ai_models";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_generations: {
        Row: {
          id: string;
          store_id: string;
          user_id: string | null;
          product_id: string | null;
          provider: string;
          model: string;
          generation_type: AiGenerationType;
          status: AiGenerationStatus;
          cost_estimate: number | null;
          // Added by 20260825000004_ai_generation_fields.sql — see that
          // migration's header comment for why these aren't in PRD.md §11's
          // original field list.
          result_image_url: string | null;
          product_image_id: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          user_id?: string | null;
          product_id?: string | null;
          provider: string;
          model: string;
          generation_type?: AiGenerationType;
          status?: AiGenerationStatus;
          cost_estimate?: number | null;
          result_image_url?: string | null;
          product_image_id?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ai_generations_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_product_image_id_fkey";
            columns: ["product_image_id"];
            isOneToOne: false;
            referencedRelation: "product_images";
            referencedColumns: ["id"];
          },
        ];
      };
      store_settings: {
        Row: {
          id: string;
          store_id: string;
          daily_ai_generation_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          daily_ai_generation_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: true;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: AnalyticsEventType;
          product_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          event_type: AnalyticsEventType;
          product_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "analytics_events_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
