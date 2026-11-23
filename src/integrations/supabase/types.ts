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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      map_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          map_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          map_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          map_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "map_comments_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "map_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_comments_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      map_votes: {
        Row: {
          created_at: string
          map_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          map_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          map_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "map_votes_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "map_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_votes_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "map_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maps: {
        Row: {
          created_at: string
          description: string
          dice: number
          id: string
          is_public: boolean
          length: number | null
          made_by_dicey: boolean
          owner_id: string
          platforms: Json
          plays: number
          tiles: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          dice?: number
          id?: string
          is_public?: boolean
          length?: number | null
          made_by_dicey?: boolean
          owner_id: string
          platforms?: Json
          plays?: number
          tiles?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          dice?: number
          id?: string
          is_public?: boolean
          length?: number | null
          made_by_dicey?: boolean
          owner_id?: string
          platforms?: Json
          plays?: number
          tiles?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maps_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listing_contents: {
        Row: {
          listing_id: string
          payload: Json
        }
        Insert: {
          listing_id: string
          payload: Json
        }
        Update: {
          listing_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "market_listing_contents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          kind: string
          preview: Json
          price: number
          sales: number
          seller_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          kind: string
          preview?: Json
          price: number
          sales?: number
          seller_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          kind?: string
          preview?: Json
          price?: number
          sales?: number
          seller_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          listing_id: string
          price: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          listing_id: string
          price: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          listing_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_purchases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "market_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      online_lobbies: {
        Row: {
          code: string
          created_at: string
          id: string
          state: Json
          updated_at: string
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          state: Json
          updated_at?: string
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          state?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      online_seats: {
        Row: {
          created_at: string
          lobby_id: string
          seat: number
          token: string
        }
        Insert: {
          created_at?: string
          lobby_id: string
          seat: number
          token?: string
        }
        Update: {
          created_at?: string
          lobby_id?: string
          seat?: number
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "online_seats_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "online_lobbies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          creator_bonus_month: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          creator_bonus_month?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          creator_bonus_month?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      map_cards: {
        Row: {
          comments: number | null
          created_at: string | null
          description: string | null
          dice: number | null
          dislikes: number | null
          id: string | null
          is_public: boolean | null
          length: number | null
          likes: number | null
          made_by_dicey: boolean | null
          owner_id: string | null
          plays: number | null
          title: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          comments?: never
          created_at?: string | null
          description?: string | null
          dice?: number | null
          dislikes?: never
          id?: string | null
          is_public?: boolean | null
          length?: number | null
          likes?: never
          made_by_dicey?: boolean | null
          owner_id?: string | null
          plays?: number | null
          title?: string | null
          updated_at?: string | null
          username?: never
        }
        Update: {
          comments?: never
          created_at?: string | null
          description?: string | null
          dice?: number | null
          dislikes?: never
          id?: string | null
          is_public?: boolean | null
          length?: number | null
          likes?: never
          made_by_dicey?: boolean | null
          owner_id?: string | null
          plays?: number | null
          title?: string | null
          updated_at?: string | null
          username?: never
        }
        Relationships: [
          {
            foreignKeyName: "maps_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      buy_listing: { Args: { _listing_id: string }; Returns: number }
      can_see_map: { Args: { _map_id: string }; Returns: boolean }
      count_map_play: { Args: { _map_id: string }; Returns: undefined }
      create_listing: {
        Args: {
          _description: string
          _kind: string
          _map_id: string
          _payload: Json
          _price: number
          _title: string
        }
        Returns: string
      }
      follow_counts: {
        Args: { _user_id: string }
        Returns: {
          followers: number
          following: number
        }[]
      }
      get_online_lobby: {
        Args: { _code: string }
        Returns: {
          code: string
          state: Json
          version: number
        }[]
      }
      map_vote_total: {
        Args: { _map_id: string; _value: number }
        Returns: number
      }
      my_wallet: { Args: never; Returns: number }
      player_name: { Args: { _user_id: string }; Returns: string }
      player_names: {
        Args: { _ids: string[] }
        Returns: {
          id: string
          username: string
        }[]
      }
      set_listing_active: {
        Args: { _active: boolean; _listing_id: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
