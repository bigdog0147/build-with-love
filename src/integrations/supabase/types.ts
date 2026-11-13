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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          admin_role: string
          created_at: string
          email: string
          email_verified: boolean
          failed_login_attempts: number
          full_name: string
          is_active: boolean
          is_super_admin: boolean
          last_login_at: string | null
          locked_until: string | null
          must_change_password: boolean
          permissions: string[]
          trusted_devices: string[]
          two_factor_enabled: boolean
          two_factor_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: string
          created_at?: string
          email: string
          email_verified?: boolean
          failed_login_attempts?: number
          full_name?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean
          permissions?: string[]
          trusted_devices?: string[]
          two_factor_enabled?: boolean
          two_factor_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: string
          created_at?: string
          email?: string
          email_verified?: boolean
          failed_login_attempts?: number
          full_name?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean
          permissions?: string[]
          trusted_devices?: string[]
          two_factor_enabled?: boolean
          two_factor_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip: string | null
          target_id: string | null
          target_label: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_password_resets: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invalidated_at: string | null
          requested_ip: string | null
          requested_user_agent: string | null
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invalidated_at?: string | null
          requested_ip?: string | null
          requested_user_agent?: string | null
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          requested_ip?: string | null
          requested_user_agent?: string | null
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      allocations: {
        Row: {
          color: string
          id: string
          label: string
          percent: number
          sort_order: number
          user_id: string
        }
        Insert: {
          color: string
          id?: string
          label: string
          percent: number
          sort_order?: number
          user_id: string
        }
        Update: {
          color?: string
          id?: string
          label?: string
          percent?: number
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          label: string
          last_used_at: string | null
          prefix: string
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          label?: string
          last_used_at?: string | null
          prefix: string
          revoked_at?: string | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          label?: string
          last_used_at?: string | null
          prefix?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string
          email_hash: string | null
          email_masked: string | null
          event_type: string
          id: string
          ip: string | null
          metadata: Json
          reason: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email_hash?: string | null
          email_masked?: string | null
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json
          reason?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email_hash?: string | null
          email_masked?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json
          reason?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_runs: {
        Row: {
          checksum: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          kind: string
          row_counts: Json
          status: string
          tables: string[]
          total_rows: number
        }
        Insert: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind?: string
          row_counts?: Json
          status?: string
          tables?: string[]
          total_rows?: number
        }
        Update: {
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind?: string
          row_counts?: Json
          status?: string
          tables?: string[]
          total_rows?: number
        }
        Relationships: []
      }
      cards: {
        Row: {
          created_at: string
          gradient: string
          id: string
          last4: string
          name: string
          sort_order: number
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gradient: string
          id?: string
          last4: string
          name: string
          sort_order?: number
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          gradient?: string
          id?: string
          last4?: string
          name?: string
          sort_order?: number
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          author_id: string | null
          author_name: string
          author_role: string
          body: string
          created_at: string
          id: string
          read_at: string | null
          thread_id: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          author_role?: string
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          thread_id: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          last_message_at: string
          status: string
          subject: string
          unread_for_admin: number
          unread_for_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject?: string
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
          subject?: string
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      confirmation_downloads: {
        Row: {
          created_at: string
          document_count: number
          document_title: string
          event_key: string
          id: string
          reference: string | null
          round_id: string | null
          round_name: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_count?: number
          document_title: string
          event_key: string
          id?: string
          reference?: string | null
          round_id?: string | null
          round_name: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_count?: number
          document_title?: string
          event_key?: string
          id?: string
          reference?: string | null
          round_id?: string | null
          round_name?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_downloads_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "raise_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_settings: {
        Row: {
          code: string
          created_at: string
          decimals: number
          is_enabled: boolean
          kind: string
          label: string
          sort_order: number
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          decimals?: number
          is_enabled?: boolean
          kind?: string
          label: string
          sort_order?: number
          symbol?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          decimals?: number
          is_enabled?: boolean
          kind?: string
          label?: string
          sort_order?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: Database["public"]["Enums"]["deposit_method"]
          note: string | null
          proof_path: string | null
          reference: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["deposit_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          method?: Database["public"]["Enums"]["deposit_method"]
          note?: string | null
          proof_path?: string | null
          reference?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["deposit_method"]
          note?: string | null
          proof_path?: string | null
          reference?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["deposit_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string
          holding_id: string
          id: string
          kind: Database["public"]["Enums"]["distribution_kind"]
          note: string | null
          paid_at: string
          product_id: string
          transaction_id: string | null
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string
          holding_id: string
          id?: string
          kind?: Database["public"]["Enums"]["distribution_kind"]
          note?: string | null
          paid_at?: string
          product_id: string
          transaction_id?: string | null
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          holding_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["distribution_kind"]
          note?: string | null
          paid_at?: string
          product_id?: string
          transaction_id?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "investment_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "investment_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      document_notification_deliveries: {
        Row: {
          attempts: number
          created_at: string
          document_id: string
          email_sent: boolean
          error: string | null
          failed_at: string | null
          id: string
          idempotency_key: string | null
          inapp_sent: boolean
          last_attempt_at: string | null
          last_error: string | null
          next_attempt_at: string | null
          queued_at: string
          reason: string | null
          retryable: boolean
          sent_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          document_id: string
          email_sent?: boolean
          error?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          inapp_sent?: boolean
          last_attempt_at?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          queued_at?: string
          reason?: string | null
          retryable?: boolean
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          document_id?: string
          email_sent?: boolean
          error?: string | null
          failed_at?: string | null
          id?: string
          idempotency_key?: string | null
          inapp_sent?: boolean
          last_attempt_at?: string | null
          last_error?: string | null
          next_attempt_at?: string | null
          queued_at?: string
          reason?: string | null
          retryable?: boolean
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_notification_deliveries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_published: boolean
          product_id: string | null
          published_at: string
          title: string
          updated_at: string
          user_id: string | null
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          is_published?: boolean
          product_id?: string | null
          published_at?: string
          title: string
          updated_at?: string
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_published?: boolean
          product_id?: string | null
          published_at?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "investment_products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          html_body: string
          id: string
          is_active: boolean
          note: string | null
          status_key: string
          subject: string
          template_name: string
          text_body: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_body: string
          id?: string
          is_active?: boolean
          note?: string | null
          status_key: string
          subject: string
          template_name?: string
          text_body: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_body?: string
          id?: string
          is_active?: boolean
          note?: string | null
          status_key?: string
          subject?: string
          template_name?: string
          text_body?: string
          version?: number
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          code: string
          fetched_at: string
          is_manual: boolean
          rate_to_usd: number
          source: string
          updated_at: string
        }
        Insert: {
          code: string
          fetched_at?: string
          is_manual?: boolean
          rate_to_usd: number
          source?: string
          updated_at?: string
        }
        Update: {
          code?: string
          fetched_at?: string
          is_manual?: boolean
          rate_to_usd?: number
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      fx_refresh_runs: {
        Row: {
          created_at: string
          currency_count: number
          error: string | null
          id: string
          ok: boolean
          source: string
        }
        Insert: {
          created_at?: string
          currency_count?: number
          error?: string | null
          id?: string
          ok: boolean
          source: string
        }
        Update: {
          created_at?: string
          currency_count?: number
          error?: string | null
          id?: string
          ok?: boolean
          source?: string
        }
        Relationships: []
      }
      holding_valuations: {
        Row: {
          as_of: string
          created_at: string
          created_by: string | null
          holding_id: string
          id: string
          note: string | null
          product_id: string
          unit_price: number
          user_id: string
          value: number
        }
        Insert: {
          as_of?: string
          created_at?: string
          created_by?: string | null
          holding_id: string
          id?: string
          note?: string | null
          product_id: string
          unit_price?: number
          user_id: string
          value?: number
        }
        Update: {
          as_of?: string
          created_at?: string
          created_by?: string | null
          holding_id?: string
          id?: string
          note?: string | null
          product_id?: string
          unit_price?: number
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "holding_valuations_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "investment_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holding_valuations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "investment_products"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_holdings: {
        Row: {
          created_at: string
          currency: string
          current_value: number
          id: string
          invested: number
          product_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["holding_status"]
          transaction_id: string | null
          units: number
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          current_value?: number
          id?: string
          invested: number
          product_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["holding_status"]
          transaction_id?: string | null
          units?: number
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          current_value?: number
          id?: string
          invested?: number
          product_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["holding_status"]
          transaction_id?: string | null
          units?: number
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holdings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "investment_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_holdings_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_products: {
        Row: {
          capacity: number | null
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string
          id: string
          minimum: number
          name: string
          sector: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          summary: string
          target_yield: number
          term_months: number
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          minimum?: number
          name: string
          sector?: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          summary?: string
          target_yield?: number
          term_months?: number
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string
          id?: string
          minimum?: number
          name?: string
          sector?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          summary?: string
          target_yield?: number
          term_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      kyc_profiles: {
        Row: {
          country_of_residence: string | null
          created_at: string
          current_step: number
          date_of_birth: string | null
          doc_back_path: string | null
          doc_front_path: string | null
          doc_type: Database["public"]["Enums"]["kyc_doc_type"] | null
          email_verified: boolean
          expected_usage: string | null
          full_legal_name: string | null
          id_status: Database["public"]["Enums"]["kyc_status"]
          nationality: string | null
          phone_number: string | null
          phone_verified: boolean
          postal_code: string | null
          recovery_email: string | null
          residential_address: string | null
          selfie_path: string | null
          source_of_funds: string | null
          tax_country: string | null
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          country_of_residence?: string | null
          created_at?: string
          current_step?: number
          date_of_birth?: string | null
          doc_back_path?: string | null
          doc_front_path?: string | null
          doc_type?: Database["public"]["Enums"]["kyc_doc_type"] | null
          email_verified?: boolean
          expected_usage?: string | null
          full_legal_name?: string | null
          id_status?: Database["public"]["Enums"]["kyc_status"]
          nationality?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          recovery_email?: string | null
          residential_address?: string | null
          selfie_path?: string | null
          source_of_funds?: string | null
          tax_country?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          country_of_residence?: string | null
          created_at?: string
          current_step?: number
          date_of_birth?: string | null
          doc_back_path?: string | null
          doc_front_path?: string | null
          doc_type?: Database["public"]["Enums"]["kyc_doc_type"] | null
          email_verified?: boolean
          expected_usage?: string | null
          full_legal_name?: string | null
          id_status?: Database["public"]["Enums"]["kyc_status"]
          nationality?: string | null
          phone_number?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          recovery_email?: string | null
          residential_address?: string | null
          selfie_path?: string | null
          source_of_funds?: string | null
          tax_country?: string | null
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          created_at: string
          decimals: number
          id: string
          label: string
          sort_order: number
          sub: string | null
          suffix: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          decimals?: number
          id?: string
          label: string
          sort_order?: number
          sub?: string | null
          suffix?: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          decimals?: number
          id?: string
          label?: string
          sort_order?: number
          sub?: string | null
          suffix?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          author: string
          body: string
          category: string
          cover_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string
          id: string
          locale: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          locale?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string
          id?: string
          locale?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_broadcasts: {
        Row: {
          audience: string
          created_at: string
          detail: string
          email_sent: boolean
          id: string
          recipient_count: number
          sent_by: string | null
          title: string
          tone: string
        }
        Insert: {
          audience?: string
          created_at?: string
          detail: string
          email_sent?: boolean
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title: string
          tone?: string
        }
        Update: {
          audience?: string
          created_at?: string
          detail?: string
          email_sent?: boolean
          id?: string
          recipient_count?: number
          sent_by?: string | null
          title?: string
          tone?: string
        }
        Relationships: []
      }
      notification_digest_queue: {
        Row: {
          attempts: number
          category: string
          created_at: string
          deliver_after: string
          detail: string
          error: string | null
          id: string
          idempotency_key: string | null
          reason: string
          sent_at: string | null
          status: string
          template: string | null
          template_data: Json
          title: string
          tone: string
          user_id: string
        }
        Insert: {
          attempts?: number
          category: string
          created_at?: string
          deliver_after?: string
          detail: string
          error?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string
          sent_at?: string | null
          status?: string
          template?: string | null
          template_data?: Json
          title: string
          tone?: string
          user_id: string
        }
        Update: {
          attempts?: number
          category?: string
          created_at?: string
          deliver_after?: string
          detail?: string
          error?: string | null
          id?: string
          idempotency_key?: string | null
          reason?: string
          sent_at?: string | null
          status?: string
          template?: string | null
          template_data?: Json
          title?: string
          tone?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_dispatch_log: {
        Row: {
          attempt_trail: Json
          attempts: number
          category: string
          created_at: string
          detail: string | null
          id: string
          idempotency_key: string | null
          label: string
          payload: Json | null
          resent_at: string | null
          resent_by: string | null
          resent_from: string | null
          retryable: boolean
          status: string
          template: string | null
          user_id: string | null
        }
        Insert: {
          attempt_trail?: Json
          attempts?: number
          category: string
          created_at?: string
          detail?: string | null
          id?: string
          idempotency_key?: string | null
          label: string
          payload?: Json | null
          resent_at?: string | null
          resent_by?: string | null
          resent_from?: string | null
          retryable?: boolean
          status: string
          template?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_trail?: Json
          attempts?: number
          category?: string
          created_at?: string
          detail?: string | null
          id?: string
          idempotency_key?: string | null
          label?: string
          payload?: Json | null
          resent_at?: string | null
          resent_by?: string | null
          resent_from?: string | null
          retryable?: boolean
          status?: string
          template?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_dispatch_log_resent_from_fkey"
            columns: ["resent_from"]
            isOneToOne: false
            referencedRelation: "notification_dispatch_log"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          announcements_email: boolean
          announcements_inapp: boolean
          created_at: string
          deposits_email: boolean
          deposits_inapp: boolean
          digest_hour: number
          kyc_email: boolean
          kyc_inapp: boolean
          locale: string | null
          quiet_hours_enabled: boolean
          quiet_hours_end: number
          quiet_hours_start: number
          raise_digest: string
          raise_email: boolean
          raise_event_cancelled_email: boolean
          raise_event_interest_email: boolean
          raise_event_withdrawn_email: boolean
          raise_inapp: boolean
          reports_email: boolean
          reports_inapp: boolean
          security_email: boolean
          security_inapp: boolean
          time_zone: string
          updated_at: string
          user_id: string
          withdrawals_email: boolean
          withdrawals_inapp: boolean
        }
        Insert: {
          announcements_email?: boolean
          announcements_inapp?: boolean
          created_at?: string
          deposits_email?: boolean
          deposits_inapp?: boolean
          digest_hour?: number
          kyc_email?: boolean
          kyc_inapp?: boolean
          locale?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          raise_digest?: string
          raise_email?: boolean
          raise_event_cancelled_email?: boolean
          raise_event_interest_email?: boolean
          raise_event_withdrawn_email?: boolean
          raise_inapp?: boolean
          reports_email?: boolean
          reports_inapp?: boolean
          security_email?: boolean
          security_inapp?: boolean
          time_zone?: string
          updated_at?: string
          user_id: string
          withdrawals_email?: boolean
          withdrawals_inapp?: boolean
        }
        Update: {
          announcements_email?: boolean
          announcements_inapp?: boolean
          created_at?: string
          deposits_email?: boolean
          deposits_inapp?: boolean
          digest_hour?: number
          kyc_email?: boolean
          kyc_inapp?: boolean
          locale?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: number
          quiet_hours_start?: number
          raise_digest?: string
          raise_email?: boolean
          raise_event_cancelled_email?: boolean
          raise_event_interest_email?: boolean
          raise_event_withdrawn_email?: boolean
          raise_inapp?: boolean
          reports_email?: boolean
          reports_inapp?: boolean
          security_email?: boolean
          security_inapp?: boolean
          time_zone?: string
          updated_at?: string
          user_id?: string
          withdrawals_email?: boolean
          withdrawals_inapp?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          detail: string
          id: string
          kind: string
          read_at: string | null
          title: string
          tone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          tone?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          tone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          display_name: string
          first_name: string | null
          id: string
          initials: string
          interests: string[]
          last_name: string | null
          membership: string
          organization: string | null
          phone: string | null
          role: string
          tier: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          id: string
          initials?: string
          interests?: string[]
          last_name?: string | null
          membership?: string
          organization?: string | null
          phone?: string | null
          role?: string
          tier?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          id?: string
          initials?: string
          interests?: string[]
          last_name?: string | null
          membership?: string
          organization?: string | null
          phone?: string | null
          role?: string
          tier?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      raise_commitments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          holding_id: string | null
          id: string
          interest_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          round_id: string
          status: Database["public"]["Enums"]["raise_commitment_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          holding_id?: string | null
          id?: string
          interest_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id: string
          status?: Database["public"]["Enums"]["raise_commitment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          holding_id?: string | null
          id?: string
          interest_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id?: string
          status?: Database["public"]["Enums"]["raise_commitment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "raise_commitments_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "investment_holdings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raise_commitments_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "raise_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raise_commitments_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "raise_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raise_commitments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raise_commitments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      raise_interests: {
        Row: {
          created_at: string
          currency: string
          id: string
          indicative_amount: number
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          round_id: string
          status: Database["public"]["Enums"]["raise_interest_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          indicative_amount: number
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id: string
          status?: Database["public"]["Enums"]["raise_interest_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          indicative_amount?: number
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          round_id?: string
          status?: Database["public"]["Enums"]["raise_interest_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raise_interests_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "raise_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      raise_round_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          inapp_enabled: boolean
          round_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          inapp_enabled?: boolean
          round_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          inapp_enabled?: boolean
          round_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raise_round_preferences_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "raise_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      raise_rounds: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          highlights: string[]
          id: string
          minimum_ticket: number
          name: string
          narrative: string
          opens_at: string | null
          product_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["raise_round_status"]
          target_amount: number
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          highlights?: string[]
          id?: string
          minimum_ticket?: number
          name: string
          narrative?: string
          opens_at?: string | null
          product_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["raise_round_status"]
          target_amount: number
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          highlights?: string[]
          id?: string
          minimum_ticket?: number
          name?: string
          narrative?: string
          opens_at?: string | null
          product_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["raise_round_status"]
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raise_rounds_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "investment_products"
            referencedColumns: ["id"]
          },
        ]
      }
      report_runs: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          range_end: string
          range_start: string
          report_key: string
          row_count: number
          summary: Json
          title: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          range_end: string
          range_start: string
          report_key: string
          row_count?: number
          summary?: Json
          title: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          range_end?: string
          range_start?: string
          report_key?: string
          row_count?: number
          summary?: Json
          title?: string
        }
        Relationships: []
      }
      reset_rate_limits: {
        Row: {
          attempted_at: string
          id: string
          key_type: string
          key_value: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          key_type: string
          key_value: string
        }
        Update: {
          attempted_at?: string
          id?: string
          key_type?: string
          key_value?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          amount: number | null
          band: string
          context: Json
          created_at: string
          currency: string | null
          decided_at: string | null
          decided_by: string | null
          decision: string
          decision_note: string | null
          id: string
          ip: string | null
          kind: string
          score: number
          subject_id: string | null
          subject_type: string | null
          triggered: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          band?: string
          context?: Json
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          decision_note?: string | null
          id?: string
          ip?: string | null
          kind: string
          score?: number
          subject_id?: string | null
          subject_type?: string | null
          triggered?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          band?: string
          context?: Json
          created_at?: string
          currency?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          decision_note?: string | null
          id?: string
          ip?: string | null
          kind?: string
          score?: number
          subject_id?: string | null
          subject_type?: string | null
          triggered?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      risk_rules: {
        Row: {
          description: string
          is_enabled: boolean
          key: string
          label: string
          threshold: number
          updated_at: string
          weight: number
        }
        Insert: {
          description?: string
          is_enabled?: boolean
          key: string
          label: string
          threshold?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          description?: string
          is_enabled?: boolean
          key?: string
          label?: string
          threshold?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          handle: string | null
          icon_key: string
          id: string
          is_visible: boolean
          label: string
          network: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          icon_key?: string
          id?: string
          is_visible?: boolean
          label: string
          network: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          icon_key?: string
          id?: string
          is_visible?: boolean
          label?: string
          network?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          default_currency: string
          default_locale: string
          deposit_min: number
          id: boolean
          maintenance_message: string
          maintenance_mode: boolean
          platform_name: string
          registration_open: boolean
          session_timeout_minutes: number
          support_email: string
          updated_at: string
          updated_by: string | null
          withdrawal_fee_pct: number
          withdrawal_min: number
        }
        Insert: {
          default_currency?: string
          default_locale?: string
          deposit_min?: number
          id?: boolean
          maintenance_message?: string
          maintenance_mode?: boolean
          platform_name?: string
          registration_open?: boolean
          session_timeout_minutes?: number
          support_email?: string
          updated_at?: string
          updated_by?: string | null
          withdrawal_fee_pct?: number
          withdrawal_min?: number
        }
        Update: {
          default_currency?: string
          default_locale?: string
          deposit_min?: number
          id?: boolean
          maintenance_message?: string
          maintenance_mode?: boolean
          platform_name?: string
          registration_open?: boolean
          session_timeout_minutes?: number
          support_email?: string
          updated_at?: string
          updated_by?: string | null
          withdrawal_fee_pct?: number
          withdrawal_min?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          kind: string
          name: string
          occurred_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          kind: string
          name: string
          occurred_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          name?: string
          occurred_at?: string
          status?: string
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
      wallets: {
        Row: {
          balance: number
          code: string
          created_at: string
          delta_pct: number
          fiat_value: number | null
          id: string
          label: string
          sort_order: number
          tint: string
          user_id: string
        }
        Insert: {
          balance?: number
          code: string
          created_at?: string
          delta_pct?: number
          fiat_value?: number | null
          id?: string
          label: string
          sort_order?: number
          tint?: string
          user_id: string
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string
          delta_pct?: number
          fiat_value?: number | null
          id?: string
          label?: string
          sort_order?: number
          tint?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event: string
          id: string
          next_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event: string
          id?: string
          next_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event?: string
          id?: string
          next_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          id: string
          is_active: boolean
          label: string
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          label: string
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          label?: string
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination_details: string
          destination_label: string
          destination_type: Database["public"]["Enums"]["withdrawal_destination"]
          id: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          destination_details?: string
          destination_label: string
          destination_type?: Database["public"]["Enums"]["withdrawal_destination"]
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination_details?: string
          destination_label?: string
          destination_type?: Database["public"]["Enums"]["withdrawal_destination"]
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_privileged_writer: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      deposit_method: "bank_transfer" | "card" | "crypto" | "wire"
      deposit_status: "pending" | "approved" | "rejected" | "cancelled"
      distribution_kind: "income" | "capital_return"
      document_category:
        | "prospectus"
        | "factsheet"
        | "term_sheet"
        | "report"
        | "statement"
        | "agreement"
      document_visibility:
        | "all_investors"
        | "single_investor"
        | "product_subscribers"
      holding_status: "pending" | "active" | "closed" | "rejected"
      kyc_doc_type:
        | "passport"
        | "national_id"
        | "drivers_license"
        | "residence_permit"
      kyc_status:
        | "not_started"
        | "submitted"
        | "under_review"
        | "verified"
        | "rejected"
      product_status: "draft" | "published" | "retired"
      raise_commitment_status:
        | "awaiting_funding"
        | "funded"
        | "accepted"
        | "released"
        | "cancelled"
      raise_interest_status: "submitted" | "invited" | "declined" | "withdrawn"
      raise_round_status: "draft" | "open" | "closed" | "funded"
      withdrawal_destination: "bank_account" | "external_wallet"
      withdrawal_status: "pending" | "approved" | "rejected" | "cancelled"
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
      deposit_method: ["bank_transfer", "card", "crypto", "wire"],
      deposit_status: ["pending", "approved", "rejected", "cancelled"],
      distribution_kind: ["income", "capital_return"],
      document_category: [
        "prospectus",
        "factsheet",
        "term_sheet",
        "report",
        "statement",
        "agreement",
      ],
      document_visibility: [
        "all_investors",
        "single_investor",
        "product_subscribers",
      ],
      holding_status: ["pending", "active", "closed", "rejected"],
      kyc_doc_type: [
        "passport",
        "national_id",
        "drivers_license",
        "residence_permit",
      ],
      kyc_status: [
        "not_started",
        "submitted",
        "under_review",
        "verified",
        "rejected",
      ],
      product_status: ["draft", "published", "retired"],
      raise_commitment_status: [
        "awaiting_funding",
        "funded",
        "accepted",
        "released",
        "cancelled",
      ],
      raise_interest_status: ["submitted", "invited", "declined", "withdrawn"],
      raise_round_status: ["draft", "open", "closed", "funded"],
      withdrawal_destination: ["bank_account", "external_wallet"],
      withdrawal_status: ["pending", "approved", "rejected", "cancelled"],
    },
  },
} as const
