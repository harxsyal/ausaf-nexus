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
      production_tasks: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string | null
          editor: string | null
          id: string
          notes: string | null
          producer: string | null
          reporter: string | null
          source: string | null
          stage: Database["public"]["Enums"]["production_stage"]
          target_platform: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          editor?: string | null
          id?: string
          notes?: string | null
          producer?: string | null
          reporter?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["production_stage"]
          target_platform?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          editor?: string | null
          id?: string
          notes?: string | null
          producer?: string | null
          reporter?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["production_stage"]
          target_platform?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      social_tasks: {
        Row: {
          asset_page: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["social_task_status"]
          task_type: Database["public"]["Enums"]["social_task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          asset_page?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["social_task_status"]
          task_type?: Database["public"]["Enums"]["social_task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          asset_page?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["social_task_status"]
          task_type?: Database["public"]["Enums"]["social_task_type"]
          title?: string
          updated_at?: string
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
      website_tasks: {
        Row: {
          article_type: Database["public"]["Enums"]["web_article_type"]
          category: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          editor: string | null
          headline: string
          id: string
          language: Database["public"]["Enums"]["web_language"]
          notes: string | null
          status: Database["public"]["Enums"]["web_task_status"]
          updated_at: string
          url: string | null
          writer: string | null
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["web_article_type"]
          category?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          editor?: string | null
          headline: string
          id?: string
          language?: Database["public"]["Enums"]["web_language"]
          notes?: string | null
          status?: Database["public"]["Enums"]["web_task_status"]
          updated_at?: string
          url?: string | null
          writer?: string | null
        }
        Update: {
          article_type?: Database["public"]["Enums"]["web_article_type"]
          category?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          editor?: string | null
          headline?: string
          id?: string
          language?: Database["public"]["Enums"]["web_language"]
          notes?: string | null
          status?: Database["public"]["Enums"]["web_task_status"]
          updated_at?: string
          url?: string | null
          writer?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_production: { Args: { _user: string }; Returns: boolean }
      can_access_social: { Args: { _user: string }; Returns: boolean }
      can_access_website: { Args: { _user: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "social_media" | "website" | "production"
      production_stage:
        | "idea_received"
        | "researching"
        | "shooting"
        | "voice_over"
        | "editing"
        | "ready"
        | "scheduled"
        | "published"
      social_platform: "facebook" | "youtube" | "instagram" | "tiktok" | "x"
      social_task_status:
        | "pending"
        | "in_progress"
        | "ready"
        | "published"
        | "delayed"
      social_task_type: "post" | "poster" | "reel" | "breaking"
      task_priority: "low" | "medium" | "high" | "urgent"
      web_article_type: "news" | "original" | "postcard"
      web_language: "urdu" | "english" | "other"
      web_task_status: "draft" | "in_review" | "ready" | "published" | "delayed"
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
      app_role: ["super_admin", "social_media", "website", "production"],
      production_stage: [
        "idea_received",
        "researching",
        "shooting",
        "voice_over",
        "editing",
        "ready",
        "scheduled",
        "published",
      ],
      social_platform: ["facebook", "youtube", "instagram", "tiktok", "x"],
      social_task_status: [
        "pending",
        "in_progress",
        "ready",
        "published",
        "delayed",
      ],
      social_task_type: ["post", "poster", "reel", "breaking"],
      task_priority: ["low", "medium", "high", "urgent"],
      web_article_type: ["news", "original", "postcard"],
      web_language: ["urdu", "english", "other"],
      web_task_status: ["draft", "in_review", "ready", "published", "delayed"],
    },
  },
} as const
