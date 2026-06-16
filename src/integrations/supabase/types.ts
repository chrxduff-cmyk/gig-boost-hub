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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      avaliacoes_casa: {
        Row: {
          casa_id: string
          comentario: string | null
          created_at: string
          estrelas: number
          id: string
          user_id: string
        }
        Insert: {
          casa_id: string
          comentario?: string | null
          created_at?: string
          estrelas: number
          id?: string
          user_id: string
        }
        Update: {
          casa_id?: string
          comentario?: string | null
          created_at?: string
          estrelas?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_casa_casa_id_fkey"
            columns: ["casa_id"]
            isOneToOne: false
            referencedRelation: "casas_shows"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_estudio: {
        Row: {
          comentario: string | null
          created_at: string
          equipamentos: number
          estrutura: number
          estudio_id: string
          id: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          equipamentos: number
          estrutura: number
          estudio_id: string
          id?: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          equipamentos?: number
          estrutura?: number
          estudio_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_estudio_estudio_id_fkey"
            columns: ["estudio_id"]
            isOneToOne: false
            referencedRelation: "estudios_ensaio"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_produtor: {
        Row: {
          comentario: string | null
          created_at: string
          estrelas: number
          evento_id: string
          id: string
          produtor_id: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          estrelas: number
          evento_id: string
          id?: string
          produtor_id: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          estrelas?: number
          evento_id?: string
          id?: string
          produtor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_produtor_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_produtor_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_radio: {
        Row: {
          comentario: string | null
          created_at: string
          estrelas: number
          id: string
          radio_id: string
          user_id: string
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          estrelas: number
          id?: string
          radio_id: string
          user_id: string
        }
        Update: {
          comentario?: string | null
          created_at?: string
          estrelas?: number
          id?: string
          radio_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_radio_radio_id_fkey"
            columns: ["radio_id"]
            isOneToOne: false
            referencedRelation: "radios"
            referencedColumns: ["id"]
          },
        ]
      }
      bandas: {
        Row: {
          cidade: string | null
          created_at: string
          created_by: string | null
          foto: string | null
          id: string
          instagram: string | null
          musica: string | null
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
          created_by?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          musica?: string | null
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
          created_by?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          musica?: string | null
          nome?: string
          owner_id?: string | null
          release?: string | null
          spotify?: string | null
          status?: string
          youtube?: string | null
        }
        Relationships: []
      }
      casas_shows: {
        Row: {
          cidade: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          foto: string | null
          id: string
          instagram: string | null
          latitude: number | null
          longitude: number | null
          nome: string
          owner_id: string | null
          site: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          owner_id?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          owner_id?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_pix: {
        Row: {
          chave: string
          cidade: string
          id: string
          nome_recebedor: string
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          chave: string
          cidade: string
          id?: string
          nome_recebedor: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          chave?: string
          cidade?: string
          id?: string
          nome_recebedor?: string
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      estudios_ensaio: {
        Row: {
          cidade: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          endereco: string | null
          estado: string | null
          foto: string | null
          id: string
          instagram: string | null
          latitude: number | null
          longitude: number | null
          nome: string
          owner_id: string | null
          site: string | null
          status: string
          telefone: string | null
          updated_at: string
          valor_hora: number | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          nome: string
          owner_id?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor_hora?: number | null
        }
        Update: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          endereco?: string | null
          estado?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          nome?: string
          owner_id?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor_hora?: number | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          banner_url: string | null
          created_at: string
          data_evento: string | null
          data_fim_votacao: string | null
          data_inicio_votacao: string | null
          descricao: string | null
          id: string
          nome: string
          produtor_id: string | null
          status: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          data_evento?: string | null
          data_fim_votacao?: string | null
          data_inicio_votacao?: string | null
          descricao?: string | null
          id?: string
          nome: string
          produtor_id?: string | null
          status?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          data_evento?: string | null
          data_fim_votacao?: string | null
          data_inicio_votacao?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          produtor_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_produtor_id_fkey"
            columns: ["produtor_id"]
            isOneToOne: false
            referencedRelation: "produtores"
            referencedColumns: ["id"]
          },
        ]
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
      produtores: {
        Row: {
          bio: string | null
          cidade: string | null
          contato: string | null
          created_at: string
          created_by: string | null
          foto: string | null
          id: string
          instagram: string | null
          nome: string
          owner_id: string | null
          site: string | null
          status: string
        }
        Insert: {
          bio?: string | null
          cidade?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          nome: string
          owner_id?: string | null
          site?: string | null
          status?: string
        }
        Update: {
          bio?: string | null
          cidade?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          foto?: string | null
          id?: string
          instagram?: string | null
          nome?: string
          owner_id?: string | null
          site?: string | null
          status?: string
        }
        Relationships: []
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
      radios: {
        Row: {
          cidade: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          estado: string | null
          id: string
          logo: string | null
          nome: string
          owner_id: string | null
          site: string | null
          status: string
          stream_url: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          logo?: string | null
          nome: string
          owner_id?: string | null
          site?: string | null
          status?: string
          stream_url?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          estado?: string | null
          id?: string
          logo?: string | null
          nome?: string
          owner_id?: string | null
          site?: string | null
          status?: string
          stream_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reivindicacoes: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          mensagem: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          mensagem?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          mensagem?: string | null
          status?: string
          user_id?: string
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
      aprovar_reivindicacao: { Args: { _reiv_id: string }; Returns: undefined }
      cancelar_apoio: { Args: { _apoio_id: string }; Returns: undefined }
      get_pix_config_public: {
        Args: never
        Returns: {
          chave: string
          cidade: string
          nome_recebedor: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      moderar_cadastro: {
        Args: { _aprovar: boolean; _entity_type: string; _id: string }
        Returns: undefined
      }
      pode_avaliar_produtor: {
        Args: { _evento_id: string; _produtor_id: string; _user_id: string }
        Returns: boolean
      }
      votacao_esta_aberta: { Args: { _evento_id: string }; Returns: boolean }
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
