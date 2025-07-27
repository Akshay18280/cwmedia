export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string
          excerpt: string
          author_id: string | null
          published_at: string
          updated_at: string
          category: string
          tags: string[] | null
          cover_image: string | null
          reading_time: number
          views: number
          likes: number
          featured: boolean
        }
        Insert: {
          id?: string
          title: string
          content: string
          excerpt: string
          author_id?: string | null
          published_at?: string
          updated_at?: string
          category: string
          tags?: string[] | null
          cover_image?: string | null
          reading_time?: number
          views?: number
          likes?: number
          featured?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          excerpt?: string
          author_id?: string | null
          published_at?: string
          updated_at?: string
          category?: string
          tags?: string[] | null
          cover_image?: string | null
          reading_time?: number
          views?: number
          likes?: number
          featured?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          content: string
          author_id: string | null
          post_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          author_id?: string | null
          post_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          author_id?: string | null
          post_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletters: {
        Row: {
          id: string
          email: string
          subscription_date: string
          status: string
          preferences: Json | null
        }
        Insert: {
          id?: string
          email: string
          subscription_date?: string
          status?: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          email?: string
          subscription_date?: string
          status?: string
          preferences?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
