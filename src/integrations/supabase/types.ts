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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
