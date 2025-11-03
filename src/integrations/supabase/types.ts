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
      car_grades: {
        Row: {
          car_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manufacturer_id: string
          model_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          car_count?: number | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          manufacturer_id: string
          model_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          car_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer_id?: string
          model_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_grades_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_grades_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      car_models: {
        Row: {
          car_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manufacturer_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          car_count?: number | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          manufacturer_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          car_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer_id?: string
          name?: string
          updated_at?: string | null
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
      car_trims: {
        Row: {
          car_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manufacturer_id: string
          model_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          car_count?: number | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          manufacturer_id: string
          model_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          car_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manufacturer_id?: string
          model_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_trims_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_trims_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
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
          acceleration: string | null
          accident_history: string | null
          all_images_urls: string[] | null
          api_id: string
          api_version: string | null
          auction_date: string | null
          bid_count: number | null
          body_style: string | null
          books_count: number | null
          car_data: Json
          co2_emissions: string | null
          color: string | null
          condition: string | null
          created_at: string | null
          cylinders: number | null
          damage_primary: string | null
          damage_secondary: string | null
          data_completeness_score: number | null
          doors: number | null
          drive_type: string | null
          engine_displacement: string | null
          engine_size: string | null
          estimated_value: number | null
          external_url: string | null
          features: Json | null
          first_registration: string | null
          fuel: string | null
          fuel_consumption: string | null
          grade: string | null
          high_res_images: Json | null
          id: string
          image_count: number | null
          image_url: string | null
          images: Json | null
          inspection_report: Json | null
          insurance_group: string | null
          keys_count: number | null
          keys_count_detailed: number | null
          last_api_response: Json | null
          last_api_sync: string | null
          last_updated_source: string | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          lot_data: Json | null
          lot_number: string | null
          lot_seller: string | null
          make: string
          max_power: string | null
          mileage: string | null
          model: string
          modifications: string | null
          mot_expiry: string | null
          original_api_data: Json | null
          previous_owners: number | null
          price: number | null
          price_cents: number | null
          price_eur: number | null
          price_usd: number | null
          rank_score: number | null
          registration_date: string | null
          reserve_met: boolean | null
          road_tax: number | null
          sale_status: string | null
          sale_title: string | null
          seats: number | null
          seller_notes: string | null
          seller_type: string | null
          service_book_available: boolean | null
          service_history: string | null
          source_site: string | null
          spare_key_available: boolean | null
          sync_batch_id: string | null
          sync_metadata: Json | null
          sync_retry_count: number | null
          thumbnail_url: string | null
          time_left: string | null
          title_status: string | null
          top_speed: string | null
          torque: string | null
          transmission: string | null
          updated_at: string | null
          views_count: number | null
          vin: string | null
          warranty_info: string | null
          watchers_count: number | null
          year: number
        }
        Insert: {
          acceleration?: string | null
          accident_history?: string | null
          all_images_urls?: string[] | null
          api_id: string
          api_version?: string | null
          auction_date?: string | null
          bid_count?: number | null
          body_style?: string | null
          books_count?: number | null
          car_data: Json
          co2_emissions?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          cylinders?: number | null
          damage_primary?: string | null
          damage_secondary?: string | null
          data_completeness_score?: number | null
          doors?: number | null
          drive_type?: string | null
          engine_displacement?: string | null
          engine_size?: string | null
          estimated_value?: number | null
          external_url?: string | null
          features?: Json | null
          first_registration?: string | null
          fuel?: string | null
          fuel_consumption?: string | null
          grade?: string | null
          high_res_images?: Json | null
          id: string
          image_count?: number | null
          image_url?: string | null
          images?: Json | null
          inspection_report?: Json | null
          insurance_group?: string | null
          keys_count?: number | null
          keys_count_detailed?: number | null
          last_api_response?: Json | null
          last_api_sync?: string | null
          last_updated_source?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          lot_data?: Json | null
          lot_number?: string | null
          lot_seller?: string | null
          make: string
          max_power?: string | null
          mileage?: string | null
          model: string
          modifications?: string | null
          mot_expiry?: string | null
          original_api_data?: Json | null
          previous_owners?: number | null
          price?: number | null
          price_cents?: number | null
          price_eur?: number | null
          price_usd?: number | null
          rank_score?: number | null
          registration_date?: string | null
          reserve_met?: boolean | null
          road_tax?: number | null
          sale_status?: string | null
          sale_title?: string | null
          seats?: number | null
          seller_notes?: string | null
          seller_type?: string | null
          service_book_available?: boolean | null
          service_history?: string | null
          source_site?: string | null
          spare_key_available?: boolean | null
          sync_batch_id?: string | null
          sync_metadata?: Json | null
          sync_retry_count?: number | null
          thumbnail_url?: string | null
          time_left?: string | null
          title_status?: string | null
          top_speed?: string | null
          torque?: string | null
          transmission?: string | null
          updated_at?: string | null
          views_count?: number | null
          vin?: string | null
          warranty_info?: string | null
          watchers_count?: number | null
          year: number
        }
        Update: {
          acceleration?: string | null
          accident_history?: string | null
          all_images_urls?: string[] | null
          api_id?: string
          api_version?: string | null
          auction_date?: string | null
          bid_count?: number | null
          body_style?: string | null
          books_count?: number | null
          car_data?: Json
          co2_emissions?: string | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          cylinders?: number | null
          damage_primary?: string | null
          damage_secondary?: string | null
          data_completeness_score?: number | null
          doors?: number | null
          drive_type?: string | null
          engine_displacement?: string | null
          engine_size?: string | null
          estimated_value?: number | null
          external_url?: string | null
          features?: Json | null
          first_registration?: string | null
          fuel?: string | null
          fuel_consumption?: string | null
          grade?: string | null
          high_res_images?: Json | null
          id?: string
          image_count?: number | null
          image_url?: string | null
          images?: Json | null
          inspection_report?: Json | null
          insurance_group?: string | null
          keys_count?: number | null
          keys_count_detailed?: number | null
          last_api_response?: Json | null
          last_api_sync?: string | null
          last_updated_source?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          lot_data?: Json | null
          lot_number?: string | null
          lot_seller?: string | null
          make?: string
          max_power?: string | null
          mileage?: string | null
          model?: string
          modifications?: string | null
          mot_expiry?: string | null
          original_api_data?: Json | null
          previous_owners?: number | null
          price?: number | null
          price_cents?: number | null
          price_eur?: number | null
          price_usd?: number | null
          rank_score?: number | null
          registration_date?: string | null
          reserve_met?: boolean | null
          road_tax?: number | null
          sale_status?: string | null
          sale_title?: string | null
          seats?: number | null
          seller_notes?: string | null
          seller_type?: string | null
          service_book_available?: boolean | null
          service_history?: string | null
          source_site?: string | null
          spare_key_available?: boolean | null
          sync_batch_id?: string | null
          sync_metadata?: Json | null
          sync_retry_count?: number | null
          thumbnail_url?: string | null
          time_left?: string | null
          title_status?: string | null
          top_speed?: string | null
          torque?: string | null
          transmission?: string | null
          updated_at?: string | null
          views_count?: number | null
          vin?: string | null
          warranty_info?: string | null
          watchers_count?: number | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          notes?: string | null
          privacy_consent?: boolean | null
          session_id?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          car_count: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          car_count?: number | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          car_count?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
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
      sync_schedule: {
        Row: {
          cars_new: number | null
          cars_synced: number | null
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string
          next_sync_at: string | null
          status: string | null
          sync_type: string
          updated_at: string
        }
        Insert: {
          cars_new?: number | null
          cars_synced?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string
          next_sync_at?: string | null
          status?: string | null
          sync_type: string
          updated_at?: string
        }
        Update: {
          cars_new?: number | null
          cars_synced?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string
          next_sync_at?: string | null
          status?: string | null
          sync_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          api_endpoint_cursor: string | null
          api_last_check: string | null
          api_total_records: number | null
          archived_lots_processed: number | null
          batch_number: number | null
          batch_size: number | null
          cars_processed: number | null
          checkpoint_data: Json | null
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          current_page: number | null
          data_mapping_version: string | null
          data_quality_checks: Json | null
          error_message: string | null
          failed_batches: Json | null
          id: string
          images_download_queue: Json | null
          images_failed: number | null
          images_processed: number | null
          is_scheduled: boolean | null
          last_activity_at: string | null
          last_archived_sync_at: string | null
          last_cars_sync_at: string | null
          last_cursor: string | null
          last_heartbeat: string | null
          last_record_id: string | null
          last_successful_record_id: string | null
          last_successful_url: string | null
          max_concurrent_requests: number | null
          max_pages: number | null
          next_url: string | null
          performance_metrics: Json | null
          rate_limit_delay_ms: number | null
          records_processed: number | null
          resume_token: string | null
          retry_count: number | null
          retry_queue: Json | null
          source_endpoints: Json | null
          started_at: string | null
          status: string
          sync_type: string
          total_pages: number | null
          total_records: number | null
        }
        Insert: {
          api_endpoint_cursor?: string | null
          api_last_check?: string | null
          api_total_records?: number | null
          archived_lots_processed?: number | null
          batch_number?: number | null
          batch_size?: number | null
          cars_processed?: number | null
          checkpoint_data?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          current_page?: number | null
          data_mapping_version?: string | null
          data_quality_checks?: Json | null
          error_message?: string | null
          failed_batches?: Json | null
          id?: string
          images_download_queue?: Json | null
          images_failed?: number | null
          images_processed?: number | null
          is_scheduled?: boolean | null
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_cursor?: string | null
          last_heartbeat?: string | null
          last_record_id?: string | null
          last_successful_record_id?: string | null
          last_successful_url?: string | null
          max_concurrent_requests?: number | null
          max_pages?: number | null
          next_url?: string | null
          performance_metrics?: Json | null
          rate_limit_delay_ms?: number | null
          records_processed?: number | null
          resume_token?: string | null
          retry_count?: number | null
          retry_queue?: Json | null
          source_endpoints?: Json | null
          started_at?: string | null
          status?: string
          sync_type?: string
          total_pages?: number | null
          total_records?: number | null
        }
        Update: {
          api_endpoint_cursor?: string | null
          api_last_check?: string | null
          api_total_records?: number | null
          archived_lots_processed?: number | null
          batch_number?: number | null
          batch_size?: number | null
          cars_processed?: number | null
          checkpoint_data?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          current_page?: number | null
          data_mapping_version?: string | null
          data_quality_checks?: Json | null
          error_message?: string | null
          failed_batches?: Json | null
          id?: string
          images_download_queue?: Json | null
          images_failed?: number | null
          images_processed?: number | null
          is_scheduled?: boolean | null
          last_activity_at?: string | null
          last_archived_sync_at?: string | null
          last_cars_sync_at?: string | null
          last_cursor?: string | null
          last_heartbeat?: string | null
          last_record_id?: string | null
          last_successful_record_id?: string | null
          last_successful_url?: string | null
          max_concurrent_requests?: number | null
          max_pages?: number | null
          next_url?: string | null
          performance_metrics?: Json | null
          rate_limit_delay_ms?: number | null
          records_processed?: number | null
          resume_token?: string | null
          retry_count?: number | null
          retry_queue?: Json | null
          source_endpoints?: Json | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      anonymize_old_inspection_requests: { Args: never; Returns: number }
      bulk_merge_from_staging: { Args: never; Returns: Json }
      cars_filtered_count: { Args: { p_filters?: Json }; Returns: number }
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
      cars_global_sorted: {
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
          mileage: string
          model: string
          price: number
          price_cents: number
          rank_score: number
          row_number: number
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
      cars_search_sorted: { Args: { req: Json }; Returns: Json }
      check_rate_limit: {
        Args: {
          _action: string
          _identifier: string
          _max_requests?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      generate_sample_cars: { Args: { car_count?: number }; Returns: number }
      get_accurate_sync_progress: {
        Args: never
        Returns: {
          cache_count: number
          correction_applied: boolean
          display_count: number
          main_count: number
          sync_page: number
          sync_status: string
          sync_status_records: number
        }[]
      }
      get_grades_by_model: {
        Args: { p_model_id: string }
        Returns: {
          car_count: number
          id: string
          name: string
        }[]
      }
      get_models_by_manufacturer: {
        Args: { p_manufacturer_id: string }
        Returns: {
          car_count: number
          id: string
          name: string
        }[]
      }
      get_precise_resume_position: { Args: never; Returns: Json }
      get_real_time_sync_progress: { Args: never; Returns: Json }
      get_resume_position: { Args: never; Returns: Json }
      get_sync_checkpoint: { Args: { sync_id: string }; Returns: Json }
      get_sync_progress: { Args: never; Returns: Json }
      get_trims_by_model: {
        Args: { p_model_id: string }
        Returns: {
          car_count: number
          id: string
          name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      map_complete_api_data: { Args: { api_record: Json }; Returns: Json }
      mark_missing_inactive: { Args: never; Returns: Json }
      remove_old_sold_cars: { Args: never; Returns: undefined }
      save_precise_sync_checkpoint: {
        Args: {
          api_cursor: string
          batch_results: Json
          page_number: number
          record_id: string
          sync_id: string
        }
        Returns: undefined
      }
      save_sync_checkpoint: {
        Args: { checkpoint_data: Json; sync_id: string }
        Returns: undefined
      }
      update_sold_car_status: { Args: never; Returns: undefined }
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
