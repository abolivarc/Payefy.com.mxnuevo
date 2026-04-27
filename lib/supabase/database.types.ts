// Generado automáticamente desde Supabase. No editar a mano.
// Regenerar con: pnpm supabase:types (o desde el MCP de Supabase).

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
      business_sectors: {
        Row: {
          base_rate_amex: number
          base_rate_credit: number
          base_rate_debit: number
          base_rate_international: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          mcc_code: string
          name: string
          updated_at: string
        }
        Insert: {
          base_rate_amex: number
          base_rate_credit: number
          base_rate_debit: number
          base_rate_international: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mcc_code: string
          name: string
          updated_at?: string
        }
        Update: {
          base_rate_amex?: number
          base_rate_credit?: number
          base_rate_debit?: number
          base_rate_international?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          mcc_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_tiers: {
        Row: {
          description: string | null
          display_order: number
          id: string
          max_volume: number | null
          min_volume: number
          rate: number
          updated_at: string
        }
        Insert: {
          description?: string | null
          display_order: number
          id?: string
          max_volume?: number | null
          min_volume: number
          rate: number
          updated_at?: string
        }
        Update: {
          description?: string | null
          display_order?: number
          id?: string
          max_volume?: number | null
          min_volume?: number
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      msi_rates: {
        Row: {
          id: string
          is_available: boolean
          issuer: Database["public"]["Enums"]["msi_issuer"]
          months: number
          rate: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_available?: boolean
          issuer: Database["public"]["Enums"]["msi_issuer"]
          months: number
          rate: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_available?: boolean
          issuer?: Database["public"]["Enums"]["msi_issuer"]
          months?: number
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_constants: {
        Row: {
          description: string
          key: string
          unit: string
          updated_at: string
          value: number
        }
        Insert: {
          description: string
          key: string
          unit: string
          updated_at?: string
          value: number
        }
        Update: {
          description?: string
          key?: string
          unit?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      terminals: {
        Row: {
          created_at: string
          description: string | null
          features: string[]
          id: string
          insurance_monthly_price: number | null
          is_active: boolean
          model: string
          purchase_price: number | null
          rent_monthly_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          insurance_monthly_price?: number | null
          is_active?: boolean
          model: string
          purchase_price?: number | null
          rent_monthly_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[]
          id?: string
          insurance_monthly_price?: number | null
          is_active?: boolean
          model?: string
          purchase_price?: number | null
          rent_monthly_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      msi_issuer: "prosa" | "banamex" | "bbva"
      user_role:
        | "admin"
        | "director_comercial"
        | "agente_comercial"
        | "onboarding"
        | "cliente"
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
      msi_issuer: ["prosa", "banamex", "bbva"],
      user_role: [
        "admin",
        "director_comercial",
        "agente_comercial",
        "onboarding",
        "cliente",
      ],
    },
  },
} as const
