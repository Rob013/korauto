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
      cars: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          buy_now_price: number | null
          color: string | null
          condition: string | null
          created_at: string
          current_bid: number | null
          domain_name: string | null
          external_id: string | null
          final_bid: number | null
          fuel: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_archived: boolean | null
          is_live: boolean | null
          keys_available: boolean | null
          last_synced_at: string | null
          location: string | null
          lot_number: string | null
          make: string
          mileage: number | null
          model: string
          price: number
          sale_date: string | null
          sold_price: number | null
          source_api: string | null
          status: string | null
          title: string | null
          transmission: string | null
          updated_at: string
          vin: string | null
          year: number
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_bid?: number | null
          domain_name?: string | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id: string
          image_url?: string | null
          images?: Json | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make: string
          mileage?: number | null
          model: string
          price?: number
          sale_date?: string | null
          sold_price?: number | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year: number
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string
          current_bid?: number | null
          domain_name?: string | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price?: number
          sale_date?: string | null
          sold_price?: number | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          updated_at?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      favorite_cars: {
        Row: {
          car_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_cars_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_favorite_cars_car_id"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_requests: {
        Row: {
          car_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          car_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          status?: string | null
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
      sync_status: {
        Row: {
          archived_lots_processed: number | null
          cars_processed: number | null
          completed_at: string | null
          created_at: string
          current_page: number | null
          error_message: string | null
          id: string
          last_activity_at: string | null
          last_archived_sync_at: string | null
          last_cars_sync_at: string | null
          last_successful_url: string | null
          next_url: string | null
          records_processed: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          sync_type: string
          total_pages: number | null
          total_records: number | null
        }
        Insert: {
          archived_lots_processed?: number | null
          cars_processed?: number | null
          completed_at?: string | null
          created_at?: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_successful_url?: string | null
          next_url?: string | null
          records_processed?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          sync_type: string
          total_pages?: number | null
          total_records?: number | null
        }
        Update: {
          archived_lots_processed?: number | null
          cars_processed?: number | null
          completed_at?: string | null
          created_at?: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_successful_url?: string | null
          next_url?: string | null
          records_processed?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
          total_pages?: number | null
          total_records?: number | null
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_sample_cars: {
        Args: { car_count?: number }
        Returns: number
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
