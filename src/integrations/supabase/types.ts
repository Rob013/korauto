export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      api_cars: {
        Row: {
          acceleration: number | null
          airbags: string | null
          api_data: Json | null
          body_type: string | null
          buy_now_price: number | null
          co2_emissions: number | null
          color: string | null
          condition: string | null
          created_at: string | null
          current_bid: number | null
          cylinders: number | null
          damage_main: string | null
          damage_second: string | null
          displacement: number | null
          domain_name: string | null
          drive_wheel: string | null
          end_time: string | null
          euro_standard: string | null
          exterior_images: string[] | null
          external_id: string | null
          final_bid: number | null
          fuel: string | null
          fuel_consumption_city: number | null
          fuel_consumption_combined: number | null
          fuel_consumption_highway: number | null
          grade_iaai: string | null
          height_mm: number | null
          horsepower: number | null
          id: string
          image_url: string | null
          images: string[] | null
          interior_images: string[] | null
          is_live: boolean | null
          keys_available: boolean | null
          length_mm: number | null
          location: string | null
          lot_number: string | null
          make: string
          mileage: number | null
          model: string
          price: number
          safety_rating_frontal: number | null
          safety_rating_overall: number | null
          safety_rating_rollover: number | null
          safety_rating_side: number | null
          sale_date: string | null
          seller: string | null
          seller_type: string | null
          title: string | null
          top_speed: number | null
          torque: number | null
          transmission: string | null
          updated_at: string | null
          vehicle_type: string | null
          video_urls: string[] | null
          vin: string | null
          watchers: number | null
          weight_kg: number | null
          wheelbase_mm: number | null
          width_mm: number | null
          year: number
        }
        Insert: {
          acceleration?: number | null
          airbags?: string | null
          api_data?: Json | null
          body_type?: string | null
          buy_now_price?: number | null
          co2_emissions?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          current_bid?: number | null
          cylinders?: number | null
          damage_main?: string | null
          damage_second?: string | null
          displacement?: number | null
          domain_name?: string | null
          drive_wheel?: string | null
          end_time?: string | null
          euro_standard?: string | null
          exterior_images?: string[] | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          fuel_consumption_city?: number | null
          fuel_consumption_combined?: number | null
          fuel_consumption_highway?: number | null
          grade_iaai?: string | null
          height_mm?: number | null
          horsepower?: number | null
          id: string
          image_url?: string | null
          images?: string[] | null
          interior_images?: string[] | null
          is_live?: boolean | null
          keys_available?: boolean | null
          length_mm?: number | null
          location?: string | null
          lot_number?: string | null
          make: string
          mileage?: number | null
          model: string
          price: number
          safety_rating_frontal?: number | null
          safety_rating_overall?: number | null
          safety_rating_rollover?: number | null
          safety_rating_side?: number | null
          sale_date?: string | null
          seller?: string | null
          seller_type?: string | null
          title?: string | null
          top_speed?: number | null
          torque?: number | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          video_urls?: string[] | null
          vin?: string | null
          watchers?: number | null
          weight_kg?: number | null
          wheelbase_mm?: number | null
          width_mm?: number | null
          year: number
        }
        Update: {
          acceleration?: number | null
          airbags?: string | null
          api_data?: Json | null
          body_type?: string | null
          buy_now_price?: number | null
          co2_emissions?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          current_bid?: number | null
          cylinders?: number | null
          damage_main?: string | null
          damage_second?: string | null
          displacement?: number | null
          domain_name?: string | null
          drive_wheel?: string | null
          end_time?: string | null
          euro_standard?: string | null
          exterior_images?: string[] | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          fuel_consumption_city?: number | null
          fuel_consumption_combined?: number | null
          fuel_consumption_highway?: number | null
          grade_iaai?: string | null
          height_mm?: number | null
          horsepower?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          interior_images?: string[] | null
          is_live?: boolean | null
          keys_available?: boolean | null
          length_mm?: number | null
          location?: string | null
          lot_number?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number
          safety_rating_frontal?: number | null
          safety_rating_overall?: number | null
          safety_rating_rollover?: number | null
          safety_rating_side?: number | null
          sale_date?: string | null
          seller?: string | null
          seller_type?: string | null
          title?: string | null
          top_speed?: number | null
          torque?: number | null
          transmission?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          video_urls?: string[] | null
          vin?: string | null
          watchers?: number | null
          weight_kg?: number | null
          wheelbase_mm?: number | null
          width_mm?: number | null
          year?: number
        }
        Relationships: []
      }
      api_sync_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_sync_at: string | null
          records_synced: number | null
          status: string | null
          sync_type: string
          total_records: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          records_synced?: number | null
          status?: string | null
          sync_type: string
          total_records?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          records_synced?: number | null
          status?: string | null
          sync_type?: string
          total_records?: number | null
        }
        Relationships: []
      }
      car_models: {
        Row: {
          body_types: string[] | null
          created_at: string | null
          engine_types: string[] | null
          fuel_types: string[] | null
          id: number
          manufacturer_id: number | null
          manufacturer_name: string | null
          name: string
          updated_at: string | null
          year_from: number | null
          year_to: number | null
        }
        Insert: {
          body_types?: string[] | null
          created_at?: string | null
          engine_types?: string[] | null
          fuel_types?: string[] | null
          id: number
          manufacturer_id?: number | null
          manufacturer_name?: string | null
          name: string
          updated_at?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Update: {
          body_types?: string[] | null
          created_at?: string | null
          engine_types?: string[] | null
          fuel_types?: string[] | null
          id?: number
          manufacturer_id?: number | null
          manufacturer_name?: string | null
          name?: string
          updated_at?: string | null
          year_from?: number | null
          year_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "car_models_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      car_views: {
        Row: {
          car_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          car_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          car_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          api_data: Json | null
          body_type: string | null
          buy_now_price: number | null
          color: string | null
          condition: string | null
          converted_at: string | null
          created_at: string
          current_bid: number | null
          damage_main: string | null
          damage_second: string | null
          domain_name: string | null
          drive_wheel: string | null
          end_time: string | null
          exterior_images: string[] | null
          external_id: string | null
          final_bid: number | null
          fuel: string | null
          id: string
          image: string | null
          images: string[] | null
          interior_images: string[] | null
          is_live: boolean | null
          keys_available: boolean | null
          last_synced_at: string | null
          location: string | null
          lot_number: string | null
          make: string
          mileage: number | null
          model: string
          original_price_usd: number | null
          photo_urls: string[] | null
          price: number
          sale_date: string | null
          seller: string | null
          seller_type: string | null
          source_api: string | null
          status: string
          title: string | null
          transmission: string | null
          updated_at: string
          vehicle_type: string | null
          video_urls: string[] | null
          vin: string | null
          watchers: number | null
          year: number
        }
        Insert: {
          api_data?: Json | null
          body_type?: string | null
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          converted_at?: string | null
          created_at?: string
          current_bid?: number | null
          damage_main?: string | null
          damage_second?: string | null
          domain_name?: string | null
          drive_wheel?: string | null
          end_time?: string | null
          exterior_images?: string[] | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id: string
          image?: string | null
          images?: string[] | null
          interior_images?: string[] | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make: string
          mileage?: number | null
          model: string
          original_price_usd?: number | null
          photo_urls?: string[] | null
          price: number
          sale_date?: string | null
          seller?: string | null
          seller_type?: string | null
          source_api?: string | null
          status?: string
          title?: string | null
          transmission?: string | null
          updated_at?: string
          vehicle_type?: string | null
          video_urls?: string[] | null
          vin?: string | null
          watchers?: number | null
          year: number
        }
        Update: {
          api_data?: Json | null
          body_type?: string | null
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          converted_at?: string | null
          created_at?: string
          current_bid?: number | null
          damage_main?: string | null
          damage_second?: string | null
          domain_name?: string | null
          drive_wheel?: string | null
          end_time?: string | null
          exterior_images?: string[] | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id?: string
          image?: string | null
          images?: string[] | null
          interior_images?: string[] | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string
          mileage?: number | null
          model?: string
          original_price_usd?: number | null
          photo_urls?: string[] | null
          price?: number
          sale_date?: string | null
          seller?: string | null
          seller_type?: string | null
          source_api?: string | null
          status?: string
          title?: string | null
          transmission?: string | null
          updated_at?: string
          vehicle_type?: string | null
          video_urls?: string[] | null
          vin?: string | null
          watchers?: number | null
          year?: number
        }
        Relationships: []
      }
      favorite_cars: {
        Row: {
          car_id: string
          car_image: string | null
          car_make: string | null
          car_model: string | null
          car_price: number | null
          car_year: number | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_id: string
          car_image?: string | null
          car_make?: string | null
          car_model?: string | null
          car_price?: number | null
          car_year?: number | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_id?: string
          car_image?: string | null
          car_make?: string | null
          car_model?: string | null
          car_price?: number | null
          car_year?: number | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      inspection_requests: {
        Row: {
          car_id: string | null
          car_make: string | null
          car_model: string | null
          car_year: number | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          updated_at: string
        }
        Insert: {
          car_id?: string | null
          car_make?: string | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          updated_at?: string
        }
        Update: {
          car_id?: string | null
          car_make?: string | null
          car_model?: string | null
          car_year?: number | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_requests_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          country: string | null
          created_at: string | null
          id: number
          logo_url: string | null
          models_count: number | null
          name: string
          popular_models: string[] | null
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id: number
          logo_url?: string | null
          models_count?: number | null
          name: string
          popular_models?: string[] | null
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: number
          logo_url?: string | null
          models_count?: number | null
          name?: string
          popular_models?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_metadata: {
        Row: {
          created_at: string | null
          current_page: number | null
          error_message: string | null
          id: string
          last_updated: string | null
          next_url: string | null
          status: string | null
          sync_type: string
          synced_records: number | null
          total_records: number | null
        }
        Insert: {
          created_at?: string | null
          current_page?: number | null
          error_message?: string | null
          id?: string
          last_updated?: string | null
          next_url?: string | null
          status?: string | null
          sync_type: string
          synced_records?: number | null
          total_records?: number | null
        }
        Update: {
          created_at?: string | null
          current_page?: number | null
          error_message?: string | null
          id?: string
          last_updated?: string | null
          next_url?: string | null
          status?: string | null
          sync_type?: string
          synced_records?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          records_synced: number | null
          status: string
          sync_type: string
          total_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_type: string
          total_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_type?: string
          total_records?: number | null
        }
        Relationships: []
      }
      user_dashboard_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          favorite_searches: Json | null
          id: string
          preferred_makes: string[] | null
          preferred_price_range: unknown | null
          preferred_year_range: unknown | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          favorite_searches?: Json | null
          id?: string
          preferred_makes?: string[] | null
          preferred_price_range?: unknown | null
          preferred_year_range?: unknown | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          favorite_searches?: Json | null
          id?: string
          preferred_makes?: string[] | null
          preferred_price_range?: unknown | null
          preferred_year_range?: unknown | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_sync_metadata: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
