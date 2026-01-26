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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          created_at: string
          event_meta: Json | null
          event_type: string
          guild_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_meta?: Json | null
          event_type: string
          guild_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_meta?: Json | null
          event_type?: string
          guild_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          created_at: string | null
          ends_at: string | null
          guild_id: string | null
          id: string
          sku_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["Entitlement Status"]
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          guild_id?: string | null
          id: string
          sku_id: string
          starts_at?: string | null
          status: Database["public"]["Enums"]["Entitlement Status"]
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          guild_id?: string | null
          id?: string
          sku_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["Entitlement Status"]
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          accent_color: string
          id: string
          joined_at: string
          member_count: number
          name: string
          owner_id: string
        }
        Insert: {
          accent_color?: string
          id: string
          joined_at?: string
          member_count: number
          name: string
          owner_id: string
        }
        Update: {
          accent_color?: string
          id?: string
          joined_at?: string
          member_count?: number
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          discord_access_token: string
          discord_id: string
          discord_refresh_token: string
          discord_token_expires_at: string
          email: string
          id: string
          manageable_guild_ids: string[]
          username: string
        }
        Insert: {
          created_at?: string | null
          discord_access_token: string
          discord_id: string
          discord_refresh_token: string
          discord_token_expires_at: string
          email: string
          id?: string
          manageable_guild_ids?: string[]
          username: string
        }
        Update: {
          created_at?: string | null
          discord_access_token?: string
          discord_id?: string
          discord_refresh_token?: string
          discord_token_expires_at?: string
          email?: string
          id?: string
          manageable_guild_ids?: string[]
          username?: string
        }
        Relationships: []
      }
      session_rsvp_slots: {
        Row: {
          capacity: number
          emoji: string | null
          guild_id: string
          id: string
          roles_required: string[] | null
          session_id: string
          title: string
        }
        Insert: {
          capacity: number
          emoji?: string | null
          guild_id: string
          id?: string
          roles_required?: string[] | null
          session_id: string
          title: string
        }
        Update: {
          capacity?: number
          emoji?: string | null
          guild_id?: string
          id?: string
          roles_required?: string[] | null
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rsvp_slots_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rsvp_slots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_rsvps: {
        Row: {
          created_at: string
          id: string
          rsvp_slot_id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rsvp_slot_id: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rsvp_slot_id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_rsvps_rsvp_slot_id_fkey"
            columns: ["rsvp_slot_id"]
            isOneToOne: false
            referencedRelation: "session_rsvp_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rsvps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["discord_id"]
          },
        ]
      }
      session_templates: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          duration_ms: number | null
          expires_at_utc: string | null
          guild_id: string
          id: string
          last_post_utc: string | null
          mention_roles: string[] | null
          native_events: boolean
          next_post_utc: string | null
          post_before_ms: number
          post_in_thread: boolean
          rrule: string | null
          rsvps: Json | null
          start_hour: number | null
          start_minute: number | null
          starts_at_utc: string
          time_zone: string
          title: string
          url: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          expires_at_utc?: string | null
          guild_id: string
          id?: string
          last_post_utc?: string | null
          mention_roles?: string[] | null
          native_events?: boolean
          next_post_utc?: string | null
          post_before_ms: number
          post_in_thread?: boolean
          rrule?: string | null
          rsvps?: Json | null
          start_hour?: number | null
          start_minute?: number | null
          starts_at_utc: string
          time_zone: string
          title: string
          url?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          expires_at_utc?: string | null
          guild_id?: string
          id?: string
          last_post_utc?: string | null
          mention_roles?: string[] | null
          native_events?: boolean
          next_post_utc?: string | null
          post_before_ms?: number
          post_in_thread?: boolean
          rrule?: string | null
          rsvps?: Json | null
          start_hour?: number | null
          start_minute?: number | null
          starts_at_utc?: string
          time_zone?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_templates_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          duration_ms: number | null
          event_id: string | null
          guild_id: string
          id: string
          mention_roles: string[] | null
          signup_id: string
          starts_at_utc: string | null
          template_id: string | null
          thread_id: string | null
          time_zone: string
          title: string
          url: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          event_id?: string | null
          guild_id: string
          id?: string
          mention_roles?: string[] | null
          signup_id: string
          starts_at_utc?: string | null
          template_id?: string | null
          thread_id?: string | null
          time_zone: string
          title: string
          url?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          duration_ms?: number | null
          event_id?: string | null
          guild_id?: string
          id?: string
          mention_roles?: string[] | null
          signup_id?: string
          starts_at_utc?: string | null
          template_id?: string | null
          thread_id?: string | null
          time_zone?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_guild_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "session_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      "Entitlement Status": "ACTIVE" | "EXPIRED" | "CANCELED"
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
      "Entitlement Status": ["ACTIVE", "EXPIRED", "CANCELED"],
    },
  },
} as const
