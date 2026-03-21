export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          total_copies: number;
          publisher: string | null;
          year_published: number | null;
          genres: string[];
          themes: string[];
          description: string | null;
          ai_enriched: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          total_copies?: number;
          publisher?: string | null;
          year_published?: number | null;
          genres?: string[];
          themes?: string[];
          description?: string | null;
          ai_enriched?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["books"]["Insert"]>;
      };
      schools: {
        Row: {
          id: string;
          name: string;
          archived: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          archived?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
      };
      checkouts: {
        Row: {
          id: string;
          book_id: string;
          borrower_first_name: string;
          borrower_surname_initial: string;
          school_id: string;
          checked_out_at: string;
          due_at: string;
          returned_at: string | null;
          reminder_sent: boolean;
          overdue_alert_sent: boolean;
        };
        Insert: {
          id?: string;
          book_id: string;
          borrower_first_name: string;
          borrower_surname_initial: string;
          school_id: string;
          checked_out_at?: string;
          due_at: string;
          returned_at?: string | null;
          reminder_sent?: boolean;
          overdue_alert_sent?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["checkouts"]["Insert"]>;
      };
      app_settings: {
        Row: {
          id: string;
          reminder_email: string;
          loan_duration_days: number;
        };
        Insert: {
          id?: string;
          reminder_email: string;
          loan_duration_days?: number;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
      };
    };
  };
};

export type Book = Database["public"]["Tables"]["books"]["Row"];
export type School = Database["public"]["Tables"]["schools"]["Row"];
export type Checkout = Database["public"]["Tables"]["checkouts"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
