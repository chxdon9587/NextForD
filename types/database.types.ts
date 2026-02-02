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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      backings: {
        Row: {
          amount: number
          backed_at: string | null
          backer_id: string
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          project_id: string
          reward_id: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["backing_status"] | null
          stripe_payment_intent_id: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          backed_at?: string | null
          backer_id: string
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_id: string
          reward_id?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["backing_status"] | null
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          backed_at?: string | null
          backer_id?: string
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          project_id?: string
          reward_id?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["backing_status"] | null
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backings_backer_id_fkey"
            columns: ["backer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backings_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_creator_reply: boolean | null
          is_deleted: boolean | null
          is_edited: boolean | null
          parent_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_creator_reply?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          parent_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_creator_reply?: boolean | null
          is_deleted?: boolean | null
          is_edited?: boolean | null
          parent_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          backing_id: string | null
          created_at: string | null
          currency: string | null
          held_at: string | null
          id: string
          milestone_id: string | null
          project_id: string
          released_at: string | null
          status: Database["public"]["Enums"]["escrow_status"] | null
          stripe_account_id: string | null
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          backing_id?: string | null
          created_at?: string | null
          currency?: string | null
          held_at?: string | null
          id?: string
          milestone_id?: string | null
          project_id: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"] | null
          stripe_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          backing_id?: string | null
          created_at?: string | null
          currency?: string | null
          held_at?: string | null
          id?: string
          milestone_id?: string | null
          project_id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"] | null
          stripe_account_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_backing_id_fkey"
            columns: ["backing_id"]
            isOneToOne: false
            referencedRelation: "backings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completion_proof: string | null
          created_at: string | null
          current_amount: number | null
          deadline_days: number
          description: string | null
          goal_amount: number
          id: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["milestone_status"] | null
          title: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          completion_proof?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline_days: number
          description?: string | null
          goal_amount: number
          id?: string
          order_index: number
          project_id: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          title: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          completion_proof?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline_days?: number
          description?: string | null
          goal_amount?: number
          id?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["milestone_status"] | null
          title?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          images: string[] | null
          project_id: string
          title: string
          updated_at: string | null
          view_count: number | null
          visibility: Database["public"]["Enums"]["update_visibility"] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          project_id: string
          title: string
          updated_at?: string | null
          view_count?: number | null
          visibility?: Database["public"]["Enums"]["update_visibility"] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          images?: string[] | null
          project_id?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
          visibility?: Database["public"]["Enums"]["update_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          backer_count: number | null
          category: Database["public"]["Enums"]["project_category"]
          cover_image: string | null
          created_at: string | null
          creator_id: string
          currency: string | null
          current_amount: number | null
          deadline: string | null
          description: string
          funding_type: Database["public"]["Enums"]["funding_type"] | null
          gallery: Json | null
          goal_amount: number
          id: string
          launch_date: string | null
          like_count: number | null
          slug: string
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          backer_count?: number | null
          category: Database["public"]["Enums"]["project_category"]
          cover_image?: string | null
          created_at?: string | null
          creator_id: string
          currency?: string | null
          current_amount?: number | null
          deadline?: string | null
          description: string
          funding_type?: Database["public"]["Enums"]["funding_type"] | null
          gallery?: Json | null
          goal_amount: number
          id?: string
          launch_date?: string | null
          like_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          backer_count?: number | null
          category?: Database["public"]["Enums"]["project_category"]
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string
          currency?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string
          funding_type?: Database["public"]["Enums"]["funding_type"] | null
          gallery?: Json | null
          goal_amount?: number
          id?: string
          launch_date?: string | null
          like_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          estimated_delivery: string | null
          id: string
          is_active: boolean | null
          is_limited: boolean | null
          order_index: number
          project_id: string
          quantity_claimed: number | null
          quantity_total: number | null
          shipping_locations: string[] | null
          shipping_required: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          order_index: number
          project_id: string
          quantity_claimed?: number | null
          quantity_total?: number | null
          shipping_locations?: string[] | null
          shipping_required?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          is_active?: boolean | null
          is_limited?: boolean | null
          order_index?: number
          project_id?: string
          quantity_claimed?: number | null
          quantity_total?: number | null
          shipping_locations?: string[] | null
          shipping_required?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_connect_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_connect_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_connect_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_project_slug: {
        Args: { project_id?: string; project_title: string }
        Returns: string
      }
      get_creator_stats: {
        Args: { p_creator_id: string }
        Returns: {
          success_rate: number
          total_backers: number
          total_projects: number
          total_raised: number
        }[]
      }
      get_project_stats: {
        Args: { p_project_id: string }
        Returns: {
          avg_backing: number
          completion_percentage: number
          days_remaining: number
          total_amount: number
          total_backers: number
        }[]
      }
    }
    Enums: {
      backing_status: "pending" | "confirmed" | "refunded" | "cancelled"
      escrow_status: "held" | "released" | "refunded"
      funding_type: "all_or_nothing" | "flexible" | "milestone" | "in_demand"
      milestone_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "verified"
        | "failed"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      project_category:
        | "3D_PRINTER"
        | "FILAMENT"
        | "TOOL"
        | "ACCESSORY"
        | "SOFTWARE"
        | "OTHER"
      project_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "live"
        | "successful"
        | "failed"
        | "cancelled"
      update_visibility: "public" | "backers_only"
      user_role: "backer" | "creator" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      backing_status: ["pending", "confirmed", "refunded", "cancelled"],
      escrow_status: ["held", "released", "refunded"],
      funding_type: ["all_or_nothing", "flexible", "milestone", "in_demand"],
      milestone_status: [
        "pending",
        "in_progress",
        "completed",
        "verified",
        "failed",
      ],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      project_category: [
        "3D_PRINTER",
        "FILAMENT",
        "TOOL",
        "ACCESSORY",
        "SOFTWARE",
        "OTHER",
      ],
      project_status: [
        "draft",
        "pending_review",
        "approved",
        "live",
        "successful",
        "failed",
        "cancelled",
      ],
      update_visibility: ["public", "backers_only"],
      user_role: ["backer", "creator", "admin"],
    },
  },
} as const
