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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      concursos: {
        Row: {
          coluna1_qtd: number
          coluna2_qtd: number
          coluna3_qtd: number
          coluna4_qtd: number
          coluna5_qtd: number
          created_at: string
          d1: number
          d10: number
          d11: number
          d12: number
          d13: number
          d14: number
          d15: number
          d2: number
          d3: number
          d4: number
          d5: number
          d6: number
          d7: number
          d8: number
          d9: number
          data_concurso: string
          id: string
          linha1_qtd: number
          linha2_qtd: number
          linha3_qtd: number
          linha4_qtd: number
          linha5_qtd: number
          numero_concurso: number
          qtd_fibonacci: number
          qtd_impares: number
          qtd_multiplos_3: number
          qtd_pares: number
          qtd_primos: number
          repetidas_do_anterior: number
          soma_dezenas: number
        }
        Insert: {
          coluna1_qtd?: number
          coluna2_qtd?: number
          coluna3_qtd?: number
          coluna4_qtd?: number
          coluna5_qtd?: number
          created_at?: string
          d1: number
          d10: number
          d11: number
          d12: number
          d13: number
          d14: number
          d15: number
          d2: number
          d3: number
          d4: number
          d5: number
          d6: number
          d7: number
          d8: number
          d9: number
          data_concurso: string
          id?: string
          linha1_qtd?: number
          linha2_qtd?: number
          linha3_qtd?: number
          linha4_qtd?: number
          linha5_qtd?: number
          numero_concurso: number
          qtd_fibonacci?: number
          qtd_impares?: number
          qtd_multiplos_3?: number
          qtd_pares?: number
          qtd_primos?: number
          repetidas_do_anterior?: number
          soma_dezenas?: number
        }
        Update: {
          coluna1_qtd?: number
          coluna2_qtd?: number
          coluna3_qtd?: number
          coluna4_qtd?: number
          coluna5_qtd?: number
          created_at?: string
          d1?: number
          d10?: number
          d11?: number
          d12?: number
          d13?: number
          d14?: number
          d15?: number
          d2?: number
          d3?: number
          d4?: number
          d5?: number
          d6?: number
          d7?: number
          d8?: number
          d9?: number
          data_concurso?: string
          id?: string
          linha1_qtd?: number
          linha2_qtd?: number
          linha3_qtd?: number
          linha4_qtd?: number
          linha5_qtd?: number
          numero_concurso?: number
          qtd_fibonacci?: number
          qtd_impares?: number
          qtd_multiplos_3?: number
          qtd_pares?: number
          qtd_primos?: number
          repetidas_do_anterior?: number
          soma_dezenas?: number
        }
        Relationships: []
      }
      estatisticas_dezenas: {
        Row: {
          atraso_atual: number
          dezena: number
          e_fibonacci: boolean
          e_multiplo_3: boolean
          e_par: boolean
          e_primo: boolean
          frequencia_total: number
          id: string
          maior_atraso_historico: number
        }
        Insert: {
          atraso_atual?: number
          dezena: number
          e_fibonacci?: boolean
          e_multiplo_3?: boolean
          e_par?: boolean
          e_primo?: boolean
          frequencia_total?: number
          id?: string
          maior_atraso_historico?: number
        }
        Update: {
          atraso_atual?: number
          dezena?: number
          e_fibonacci?: boolean
          e_multiplo_3?: boolean
          e_par?: boolean
          e_primo?: boolean
          frequencia_total?: number
          id?: string
          maior_atraso_historico?: number
        }
        Relationships: []
      }
      jogos_gerados: {
        Row: {
          d1: number
          d10: number
          d11: number
          d12: number
          d13: number
          d14: number
          d15: number
          d2: number
          d3: number
          d4: number
          d5: number
          d6: number
          d7: number
          d8: number
          d9: number
          data_geracao: string
          id: string
          referencia_concurso: number | null
          tipo_modelo: string
        }
        Insert: {
          d1: number
          d10: number
          d11: number
          d12: number
          d13: number
          d14: number
          d15: number
          d2: number
          d3: number
          d4: number
          d5: number
          d6: number
          d7: number
          d8: number
          d9: number
          data_geracao?: string
          id?: string
          referencia_concurso?: number | null
          tipo_modelo: string
        }
        Update: {
          d1?: number
          d10?: number
          d11?: number
          d12?: number
          d13?: number
          d14?: number
          d15?: number
          d2?: number
          d3?: number
          d4?: number
          d5?: number
          d6?: number
          d7?: number
          d8?: number
          d9?: number
          data_geracao?: string
          id?: string
          referencia_concurso?: number | null
          tipo_modelo?: string
        }
        Relationships: []
      }
      trincas_frequentes: {
        Row: {
          dezena1: number
          dezena2: number
          dezena3: number
          frequencia_trinca: number
          id: string
        }
        Insert: {
          dezena1: number
          dezena2: number
          dezena3: number
          frequencia_trinca?: number
          id?: string
        }
        Update: {
          dezena1?: number
          dezena2?: number
          dezena3?: number
          frequencia_trinca?: number
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalcular_estatisticas: { Args: never; Returns: undefined }
      recalcular_repetidas_do_anterior: { Args: never; Returns: undefined }
      recalcular_trincas: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
