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
      apoios: {
        Row: {
          banda_id: string
          created_at: string
          evento_id: string | null
          id: string
          nome_apoiador: string
          pontos: number
          status: string
          txid: string | null
          valor: number
        }
        Insert: {
          banda_id: string
          created_at?: string
          evento_id?: string | null
          id?: string
          nome_apoiador: string
          pontos?: number
          status?: string
          txid?: string | null
          valor: number
        }
        Update: {
          banda_id?: string
          created_at?: string
          evento_id?: string | null
          id?: string
          nome_apoiador?: string
          pontos?: number
          status?: string
          txid?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "apoios_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "bandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apoios_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      bandas: {
        Row: {
          cidade: string | null
          created_at: string
          foto: string | null
          id: string
          instagram: string | null
          nome: string
          owner_id: string | null
          release: string | null
          spotify: string | null
          status: string
          youtube: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          foto?: string | null
          id?: string
          instagram?: string | null
          nome: string
          owner_id?: string | null
          release?: string | null
          spotify?: string | null
          status?: string
          youtube?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          foto?: string | null
          id?: string
          instagram?: string | null
          nome?: string
          owner_id?: string | null
          release?: string | null
          spotify?: string | null
          status?: string
          youtube?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          data_evento: string | null
          data_fim_votacao: string | null
          data_inicio_votacao: string | null
          descricao: string | null
          id: string
          nome: string
          status: string
        }
        Insert: {
          created_at?: string
          data_evento?: string | null
          data_fim_votacao?: string | null
          data_inicio_votacao?: string | null
          descricao?: string | null
          id?: string
          nome: string
          status?: string
        }
        Update: {
          created_at?: string
          data_evento?: string | null
          data_fim_votacao?: string | null
          data_inicio_votacao?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
        }
        Relationships: []
      }
      participacao_evento: {
        Row: {
          banda_id: string
          created_at: string
          evento_id: string
          id: string
          pontos: number
          qr_code: string | null
          txid: string | null
        }
        Insert: {
          banda_id: string
          created_at?: string
          evento_id: string
          id?: string
          pontos?: number
          qr_code?: string | null
          txid?: string | null
        }
        Update: {
          banda_id?: string
          created_at?: string
          evento_id?: string
          id?: string
          pontos?: number
          qr_code?: string | null
          txid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participacao_evento_banda_id_fkey"
            columns: ["banda_id"]
            isOneToOne: false
            referencedRelation: "bandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participacao_evento_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cidade: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          termos_aceitos_em: string | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome: string
          termos_aceitos_em?: string | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          termos_aceitos_em?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      aprovar_apoio: { Args: { _apoio_id: string }; Returns: undefined }
      cancelar_apoio: { Args: { _apoio_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "banda" | "publico"
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
      app_role: ["admin", "banda", "publico"],
    },
  },
} as const
