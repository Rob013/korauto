export type Database = {
  public: {
    Tables: {
      cars_cache: {
        Row: {
          id: string;
          api_id: string;
          make: string;
          model: string;
          year: number;
          price: number | null;
          price_cents: number | null;
          images: any | null;
          created_at: string | null;
          updated_at: string | null;
          [key: string]: any;
        };
        Insert: {
          id?: string;
          api_id: string;
          make: string;
          model: string;
          year: number;
          price?: number | null;
          price_cents?: number | null;
          images?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          api_id?: string;
          make?: string;
          model?: string;
          year?: number;
          price?: number | null;
          price_cents?: number | null;
          images?: any | null;
          created_at?: string | null;
          updated_at?: string | null;
          [key: string]: any;
        };
      };
      sync_status: {
        Row: {
          id: string;
          status: string;
          current_page: number;
          records_processed: number;
          started_at: string | null;
          completed_at: string | null;
          last_activity_at: string | null;
          error_message: string | null;
          [key: string]: any;
        };
        Insert: {
          id: string;
          status: string;
          current_page?: number;
          records_processed?: number;
          started_at?: string | null;
          completed_at?: string | null;
          last_activity_at?: string | null;
          error_message?: string | null;
          [key: string]: any;
        };
        Update: {
          id?: string;
          status?: string;
          current_page?: number;
          records_processed?: number;
          started_at?: string | null;
          completed_at?: string | null;
          last_activity_at?: string | null;
          error_message?: string | null;
          [key: string]: any;
        };
      };
    };
  };
};