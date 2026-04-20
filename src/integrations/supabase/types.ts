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
      asset_users: {
        Row: {
          asset_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_users_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          platform: string | null
          status: Database["public"]["Enums"]["asset_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          platform?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          read_at: string | null
          task_dept: Database["public"]["Enums"]["task_dept"] | null
          task_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          task_dept?: Database["public"]["Enums"]["task_dept"] | null
          task_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          task_dept?: Database["public"]["Enums"]["task_dept"] | null
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      production_tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          caption_draft: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          editor: string | null
          final_caption: string | null
          final_publish_url: string | null
          final_title: string | null
          id: string
          notes: string | null
          posted_asset: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          producer: string | null
          publish_title_draft: string | null
          reporter: string | null
          source: string | null
          stage: Database["public"]["Enums"]["production_stage"]
          target_platform: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          editor?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          id?: string
          notes?: string | null
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          producer?: string | null
          publish_title_draft?: string | null
          reporter?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["production_stage"]
          target_platform?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          editor?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          id?: string
          notes?: string | null
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          producer?: string | null
          publish_title_draft?: string | null
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
          allowed_assets: string[]
          allowed_categories: string[]
          created_at: string
          department: string | null
          full_name: string | null
          id: string
          last_active: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          username: string | null
        }
        Insert: {
          allowed_assets?: string[]
          allowed_categories?: string[]
          created_at?: string
          department?: string | null
          full_name?: string | null
          id: string
          last_active?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          allowed_assets?: string[]
          allowed_categories?: string[]
          created_at?: string
          department?: string | null
          full_name?: string | null
          id?: string
          last_active?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      social_tasks: {
        Row: {
          asset_page: string | null
          assigned_by: string | null
          assigned_to: string | null
          caption_draft: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          final_caption: string | null
          final_publish_url: string | null
          final_title: string | null
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posted_asset: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          publish_title_draft: string | null
          source: string | null
          status: Database["public"]["Enums"]["social_task_status"]
          task_type: Database["public"]["Enums"]["social_task_type"]
          title: string
          updated_at: string
        }
        Insert: {
          asset_page?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          publish_title_draft?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["social_task_status"]
          task_type?: Database["public"]["Enums"]["social_task_type"]
          title: string
          updated_at?: string
        }
        Update: {
          asset_page?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          publish_title_draft?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["social_task_status"]
          task_type?: Database["public"]["Enums"]["social_task_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string | null
          author_label: string | null
          body: string
          created_at: string
          id: string
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_label?: string | null
          body: string
          created_at?: string
          id?: string
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_label?: string | null
          body?: string
          created_at?: string
          id?: string
          task_dept?: Database["public"]["Enums"]["task_dept"]
          task_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_events: {
        Row: {
          actor_id: string | null
          actor_label: string | null
          created_at: string
          event_type: string
          id: string
          summary: string
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          event_type: string
          id?: string
          summary: string
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
        }
        Update: {
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          event_type?: string
          id?: string
          summary?: string
          task_dept?: Database["public"]["Enums"]["task_dept"]
          task_id?: string
        }
        Relationships: []
      }
      task_proof: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          published_at: string | null
          screenshot_path: string | null
          submitted_by: string | null
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          screenshot_path?: string | null
          submitted_by?: string | null
          task_dept: Database["public"]["Enums"]["task_dept"]
          task_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          screenshot_path?: string | null
          submitted_by?: string | null
          task_dept?: Database["public"]["Enums"]["task_dept"]
          task_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      user_job_roles: {
        Row: {
          created_at: string
          id: string
          job_role: Database["public"]["Enums"]["job_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_role: Database["public"]["Enums"]["job_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_role?: Database["public"]["Enums"]["job_role"]
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
      warnings_logs: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          details: string | null
          id: string
          issued_by: string | null
          reason: string
          related_dept: Database["public"]["Enums"]["task_dept"] | null
          related_task_id: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["warning_severity"]
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issued_by?: string | null
          reason: string
          related_dept?: Database["public"]["Enums"]["task_dept"] | null
          related_task_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["warning_severity"]
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          details?: string | null
          id?: string
          issued_by?: string | null
          reason?: string
          related_dept?: Database["public"]["Enums"]["task_dept"] | null
          related_task_id?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["warning_severity"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_tasks: {
        Row: {
          article_type: Database["public"]["Enums"]["web_article_type"]
          assigned_by: string | null
          assigned_to: string | null
          caption_draft: string | null
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          editor: string | null
          final_caption: string | null
          final_publish_url: string | null
          final_title: string | null
          headline: string
          id: string
          language: Database["public"]["Enums"]["web_language"]
          notes: string | null
          posted_asset: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          publish_title_draft: string | null
          site: string | null
          source: string | null
          status: Database["public"]["Enums"]["web_task_status"]
          updated_at: string
          url: string | null
          writer: string | null
        }
        Insert: {
          article_type?: Database["public"]["Enums"]["web_article_type"]
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          editor?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          headline: string
          id?: string
          language?: Database["public"]["Enums"]["web_language"]
          notes?: string | null
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          publish_title_draft?: string | null
          site?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["web_task_status"]
          updated_at?: string
          url?: string | null
          writer?: string | null
        }
        Update: {
          article_type?: Database["public"]["Enums"]["web_article_type"]
          assigned_by?: string | null
          assigned_to?: string | null
          caption_draft?: string | null
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          editor?: string | null
          final_caption?: string | null
          final_publish_url?: string | null
          final_title?: string | null
          headline?: string
          id?: string
          language?: Database["public"]["Enums"]["web_language"]
          notes?: string | null
          posted_asset?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          publish_title_draft?: string | null
          site?: string | null
          source?: string | null
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
      admin_list_users: {
        Args: never
        Returns: {
          allowed_assets: string[]
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          last_active: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["account_status"]
          username: string
        }[]
      }
      admin_set_user_job_roles: {
        Args: {
          _roles: Database["public"]["Enums"]["job_role"][]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_user_status: {
        Args: {
          _status: Database["public"]["Enums"]["account_status"]
          _user_id: string
        }
        Returns: undefined
      }
      can_access_dept: {
        Args: { _dept: Database["public"]["Enums"]["task_dept"]; _user: string }
        Returns: boolean
      }
      can_access_production: { Args: { _user: string }; Returns: boolean }
      can_access_social: { Args: { _user: string }; Returns: boolean }
      can_access_website: { Args: { _user: string }; Returns: boolean }
      dashboard_admin: { Args: never; Returns: Json }
      dashboard_production: { Args: never; Returns: Json }
      dashboard_social: { Args: never; Returns: Json }
      dashboard_website: { Args: never; Returns: Json }
      get_user_job_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["job_role"][]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_job_role: {
        Args: {
          _role: Database["public"]["Enums"]["job_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _perm: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_valid_status_transition: {
        Args: { _from: string; _to: string }
        Returns: boolean
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      profile_label: { Args: { _user: string }; Returns: string }
      resolve_user_by_label: { Args: { _label: string }; Returns: string }
      touch_last_active: { Args: never; Returns: undefined }
      user_has_asset: {
        Args: { _asset: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "disabled"
      app_permission:
        | "create_task"
        | "edit_task"
        | "assign_task"
        | "reassign_task"
        | "publish_task"
        | "view_all_tasks"
        | "manage_users"
        | "manage_assets"
      app_role: "super_admin" | "social_media" | "website" | "production"
      asset_status: "active" | "inactive"
      job_role:
        | "super_admin"
        | "department_head"
        | "publisher"
        | "editor"
        | "designer"
        | "writer"
        | "reporter"
        | "viewer"
      notification_type:
        | "new_task_assigned"
        | "deadline_near"
        | "overdue_task"
        | "task_rejected"
        | "task_published"
      production_stage:
        | "idea_received"
        | "researching"
        | "shooting"
        | "voice_over"
        | "editing"
        | "ready"
        | "scheduled"
        | "published"
        | "pending"
        | "assigned"
        | "in_progress"
        | "delayed"
        | "rejected"
        | "archived"
      social_platform: "facebook" | "youtube" | "instagram" | "tiktok" | "x"
      social_task_status:
        | "pending"
        | "in_progress"
        | "ready"
        | "published"
        | "delayed"
        | "assigned"
        | "rejected"
        | "archived"
      social_task_type: "post" | "poster" | "reel" | "breaking"
      task_dept: "social" | "website" | "production"
      task_priority: "low" | "medium" | "high" | "urgent"
      warning_severity: "info" | "minor" | "major" | "critical"
      web_article_type: "news" | "original" | "postcard"
      web_language: "urdu" | "english" | "other"
      web_task_status:
        | "draft"
        | "in_review"
        | "ready"
        | "published"
        | "delayed"
        | "pending"
        | "assigned"
        | "in_progress"
        | "rejected"
        | "archived"
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
      account_status: ["active", "disabled"],
      app_permission: [
        "create_task",
        "edit_task",
        "assign_task",
        "reassign_task",
        "publish_task",
        "view_all_tasks",
        "manage_users",
        "manage_assets",
      ],
      app_role: ["super_admin", "social_media", "website", "production"],
      asset_status: ["active", "inactive"],
      job_role: [
        "super_admin",
        "department_head",
        "publisher",
        "editor",
        "designer",
        "writer",
        "reporter",
        "viewer",
      ],
      notification_type: [
        "new_task_assigned",
        "deadline_near",
        "overdue_task",
        "task_rejected",
        "task_published",
      ],
      production_stage: [
        "idea_received",
        "researching",
        "shooting",
        "voice_over",
        "editing",
        "ready",
        "scheduled",
        "published",
        "pending",
        "assigned",
        "in_progress",
        "delayed",
        "rejected",
        "archived",
      ],
      social_platform: ["facebook", "youtube", "instagram", "tiktok", "x"],
      social_task_status: [
        "pending",
        "in_progress",
        "ready",
        "published",
        "delayed",
        "assigned",
        "rejected",
        "archived",
      ],
      social_task_type: ["post", "poster", "reel", "breaking"],
      task_dept: ["social", "website", "production"],
      task_priority: ["low", "medium", "high", "urgent"],
      warning_severity: ["info", "minor", "major", "critical"],
      web_article_type: ["news", "original", "postcard"],
      web_language: ["urdu", "english", "other"],
      web_task_status: [
        "draft",
        "in_review",
        "ready",
        "published",
        "delayed",
        "pending",
        "assigned",
        "in_progress",
        "rejected",
        "archived",
      ],
    },
  },
} as const
