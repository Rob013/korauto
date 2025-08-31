export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cars: {
        Row: {
          buy_now_price: number | null
          color: string | null
          "Column Name": string | null
          condition: string | null
          Constraints: string | null
          created_at: string | null
          current_bid: number | null
          data_hash: string | null
          Description: string | null
          domain_name: string | null
          external_id: string | null
          final_bid: number | null
          fuel: string | null
          id: string | null
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_archived: boolean | null
          is_live: boolean | null
          keys_available: boolean | null
          last_synced_at: string | null
          location: string | null
          lot_number: string | null
          make: string | null
          mileage: number | null
          model: string | null
          price: number | null
          sale_date: string | null
          source_api: string | null
          status: string | null
          title: string | null
          transmission: string | null
          Type: string | null
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          buy_now_price?: number | null
          color?: string | null
          "Column Name"?: string | null
          condition?: string | null
          Constraints?: string | null
          created_at?: string | null
          current_bid?: number | null
          data_hash?: string | null
          Description?: string | null
          domain_name?: string | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          sale_date?: string | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          Type?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          buy_now_price?: number | null
          color?: string | null
          "Column Name"?: string | null
          condition?: string | null
          Constraints?: string | null
          created_at?: string | null
          current_bid?: number | null
          data_hash?: string | null
          Description?: string | null
          domain_name?: string | null
          external_id?: string | null
          final_bid?: number | null
          fuel?: string | null
          id?: string | null
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          sale_date?: string | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          Type?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      cars_cache: {
        Row: {
          api_id: string
          car_data: Json
          color: string | null
          condition: string | null
          created_at: string | null
          fuel: string | null
          id: string
          images: Json | null
          last_api_sync: string | null
          lot_data: Json | null
          lot_number: string | null
          make: string
          mileage: string | null
          model: string
          price: number | null
          price_cents: number | null
          rank_score: number | null
          transmission: string | null
          updated_at: string | null
          vin: string | null
          year: number
        }
        Insert: {
          api_id: string
          car_data: Json
          color?: string | null
          condition?: string | null
          created_at?: string | null
          fuel?: string | null
          id: string
          images?: Json | null
          last_api_sync?: string | null
          lot_data?: Json | null
          lot_number?: string | null
          make: string
          mileage?: string | null
          model: string
          price?: number | null
          price_cents?: number | null
          rank_score?: number | null
          transmission?: string | null
          updated_at?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          api_id?: string
          car_data?: Json
          color?: string | null
          condition?: string | null
          created_at?: string | null
          fuel?: string | null
          id?: string
          images?: Json | null
          last_api_sync?: string | null
          lot_data?: Json | null
          lot_number?: string | null
          make?: string
          mileage?: string | null
          model?: string
          price?: number | null
          price_cents?: number | null
          rank_score?: number | null
          transmission?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
      cars_staging: {
        Row: {
          buy_now_price: number | null
          color: string | null
          condition: string | null
          created_at: string | null
          current_bid: number | null
          data_hash: string | null
          domain_name: string | null
          external_id: string | null
          fuel: string | null
          id: string
          image_url: string | null
          images: Json | null
          is_active: boolean | null
          is_archived: boolean | null
          is_live: boolean | null
          keys_available: boolean | null
          last_synced_at: string | null
          location: string | null
          lot_number: string | null
          make: string | null
          mileage: number | null
          model: string | null
          price: number | null
          source_api: string | null
          status: string | null
          title: string | null
          transmission: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          current_bid?: number | null
          data_hash?: string | null
          domain_name?: string | null
          external_id?: string | null
          fuel?: string | null
          id: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          buy_now_price?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          current_bid?: number | null
          data_hash?: string | null
          domain_name?: string | null
          external_id?: string | null
          fuel?: string | null
          id?: string
          image_url?: string | null
          images?: Json | null
          is_active?: boolean | null
          is_archived?: boolean | null
          is_live?: boolean | null
          keys_available?: boolean | null
          last_synced_at?: string | null
          location?: string | null
          lot_number?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          source_api?: string | null
          status?: string | null
          title?: string | null
          transmission?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      favorite_cars: {
        Row: {
          car_id: string
          created_at: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_requests: {
        Row: {
          archived: boolean
          archived_at: string | null
          car_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          data_processing_consent: boolean | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          notes: string | null
          privacy_consent: boolean | null
          session_id: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          archived_at?: string | null
          car_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          data_processing_consent?: boolean | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          privacy_consent?: boolean | null
          session_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          archived_at?: string | null
          car_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          data_processing_consent?: boolean | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          privacy_consent?: boolean | null
          session_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
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
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      sync_errors: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          payload: Json | null
          resolved: boolean | null
          retry_count: number | null
          source_record_id: string | null
          sync_run_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          payload?: Json | null
          resolved?: boolean | null
          retry_count?: number | null
          source_record_id?: string | null
          sync_run_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          payload?: Json | null
          resolved?: boolean | null
          retry_count?: number | null
          source_record_id?: string | null
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_errors_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          current_page: number | null
          error_message: string | null
          estimated_total: number | null
          id: string
          last_checkpoint: Json | null
          last_processed_id: string | null
          last_source_updated_at: string | null
          source_api: string | null
          started_at: string
          status: string
          sync_type: string | null
          total_fetched: number | null
          total_skipped: number | null
          total_upserted: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          current_page?: number | null
          error_message?: string | null
          estimated_total?: number | null
          id?: string
          last_checkpoint?: Json | null
          last_processed_id?: string | null
          last_source_updated_at?: string | null
          source_api?: string | null
          started_at?: string
          status?: string
          sync_type?: string | null
          total_fetched?: number | null
          total_skipped?: number | null
          total_upserted?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          current_page?: number | null
          error_message?: string | null
          estimated_total?: number | null
          id?: string
          last_checkpoint?: Json | null
          last_processed_id?: string | null
          last_source_updated_at?: string | null
          source_api?: string | null
          started_at?: string
          status?: string
          sync_type?: string | null
          total_fetched?: number | null
          total_skipped?: number | null
          total_upserted?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          archived_lots_processed: number | null
          batch_number: number | null
          cars_processed: number | null
          completed_at: string | null
          created_at: string
          current_page: number | null
          error_message: string | null
          id: string
          is_scheduled: boolean | null
          last_activity_at: string | null
          last_archived_sync_at: string | null
          last_cars_sync_at: string | null
          last_successful_url: string | null
          max_pages: number | null
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
          batch_number?: number | null
          cars_processed?: number | null
          completed_at?: string | null
          created_at?: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_successful_url?: string | null
          max_pages?: number | null
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
          batch_number?: number | null
          cars_processed?: number | null
          completed_at?: string | null
          created_at?: string
          current_page?: number | null
          error_message?: string | null
          id?: string
          is_scheduled?: boolean | null
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_successful_url?: string | null
          max_pages?: number | null
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
      website_analytics: {
        Row: {
          action_type: string
          car_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          page_title: string | null
          page_url: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          car_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          car_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_old_inspection_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      bulk_merge_from_staging: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cars_filtered_count: {
        Args: { p_filters?: Json }
        Returns: number
      }
      cars_global_sort_page: {
        Args: {
          p_filters?: Json
          p_limit?: number
          p_offset?: number
          p_sort_dir?: string
          p_sort_field?: string
        }
        Returns: {
          color: string
          created_at: string
          fuel: string
          id: string
          image_url: string
          images: Json
          location: string
          make: string
          mileage: number
          model: string
          price: number
          price_cents: number
          rank_score: number
          title: string
          transmission: string
          year: number
        }[]
      }
      cars_keyset_page: {
        Args: {
          p_cursor_id?: string
          p_cursor_value?: string
          p_filters?: Json
          p_limit?: number
          p_sort_dir?: string
          p_sort_field?: string
        }
        Returns: {
          color: string
          created_at: string
          fuel: string
          id: string
          image_url: string
          images: Json
          location: string
          make: string
          mileage: string
          model: string
          price: number
          price_cents: number
          rank_score: number
          title: string
          transmission: string
          year: number
        }[]
      }
      check_rate_limit: {
        Args: {
          _action: string
          _identifier: string
          _max_requests?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      generate_sample_cars: {
        Args: { car_count?: number }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_missing_inactive: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
