export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      ai_feedback: {
        Row: {
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_id: string | null
          rating: number
        }
        Insert: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          rating: number
        }
        Update: {
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_journey_experiences: {
        Row: {
          day_from: number | null
          day_to: number | null
          experience_id: string
          journey_id: string
          position: number
          reason: string | null
        }
        Insert: {
          day_from?: number | null
          day_to?: number | null
          experience_id: string
          journey_id: string
          position?: number
          reason?: string | null
        }
        Update: {
          day_from?: number | null
          day_to?: number | null
          experience_id?: string
          journey_id?: string
          position?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_journey_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journey_experiences_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "ai_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_journeys: {
        Row: {
          access_token: string
          ai_model: string | null
          ai_provider: string | null
          conversation_id: string | null
          created_at: string
          generation_ms: number | null
          id: string
          input: Json
          itinerary: Json
          language: string
          lead_id: string | null
          status: Database["public"]["Enums"]["journey_status"]
          summary: string | null
          tokens_used: number | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          access_token?: string
          ai_model?: string | null
          ai_provider?: string | null
          conversation_id?: string | null
          created_at?: string
          generation_ms?: number | null
          id?: string
          input: Json
          itinerary?: Json
          language?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          summary?: string | null
          tokens_used?: number | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          access_token?: string
          ai_model?: string | null
          ai_provider?: string | null
          conversation_id?: string | null
          created_at?: string
          generation_ms?: number | null
          id?: string
          input?: Json
          itinerary?: Json
          language?: string
          lead_id?: string | null
          status?: Database["public"]["Enums"]["journey_status"]
          summary?: string | null
          tokens_used?: number | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_journeys_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_journeys_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          is_active: boolean
          language: string
          metadata: Json
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          language?: string
          metadata?: Json
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_lead_captures: {
        Row: {
          consent_at: string | null
          conversation_id: string | null
          created_at: string
          email: string | null
          id: string
          interests: string[] | null
          language: string
          message: string | null
          name: string | null
          phone: string | null
          preferred_destination: string | null
          preferred_period: string | null
          raw_context: string | null
          source_page: string | null
          status: string
        }
        Insert: {
          consent_at?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          language?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          preferred_destination?: string | null
          preferred_period?: string | null
          raw_context?: string | null
          source_page?: string | null
          status?: string
        }
        Update: {
          consent_at?: string | null
          conversation_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interests?: string[] | null
          language?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          preferred_destination?: string | null
          preferred_period?: string | null
          raw_context?: string | null
          source_page?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_lead_captures_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          conversation_id: string | null
          created_at: string
          destination_id: string | null
          experience_id: string | null
          id: string
          message_id: string | null
          position: number
          recommendation_reason: string | null
          was_clicked: boolean
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          destination_id?: string | null
          experience_id?: string | null
          id?: string
          message_id?: string | null
          position?: number
          recommendation_reason?: string | null
          was_clicked?: boolean
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          destination_id?: string | null
          experience_id?: string | null
          id?: string
          message_id?: string | null
          position?: number
          recommendation_reason?: string | null
          was_clicked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: Json | null
          id: string
          name: Json
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: Json | null
          id?: string
          name: Json
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: Json | null
          id?: string
          name?: Json
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      blog_post_experiences: {
        Row: {
          experience_id: string
          post_id: string
        }
        Insert: {
          experience_id: string
          post_id: string
        }
        Update: {
          experience_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_experiences_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          blocks: Json | null
          category_id: string | null
          content: Json | null
          created_at: string
          excerpt: Json | null
          featured_credit: string | null
          featured_image: string | null
          generation: Json | null
          id: string
          is_featured: boolean
          published_at: string | null
          reading_time: number | null
          seo: Json
          slug: Json
          status: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          blocks?: Json | null
          category_id?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: Json | null
          featured_credit?: string | null
          featured_image?: string | null
          generation?: Json | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          reading_time?: number | null
          seo?: Json
          slug: Json
          status?: Database["public"]["Enums"]["content_status"]
          title: Json
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          blocks?: Json | null
          category_id?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: Json | null
          featured_credit?: string | null
          featured_image?: string | null
          generation?: Json | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          reading_time?: number | null
          seo?: Json
          slug?: Json
          status?: Database["public"]["Enums"]["content_status"]
          title?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          id: string
          name: Json
          slug: string
        }
        Insert: {
          id?: string
          name: Json
          slug: string
        }
        Update: {
          id?: string
          name?: Json
          slug?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          experience_date_id: string | null
          experience_id: string
          id: string
          lead_id: string | null
          metadata: Json
          notes: string | null
          reference_code: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          travelers_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          experience_date_id?: string | null
          experience_id: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          reference_code: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          travelers_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          experience_date_id?: string | null
          experience_id?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          notes?: string | null
          reference_code?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          travelers_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: Json | null
          icon: string | null
          id: string
          is_active: boolean
          name: Json
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: Json
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      community_matches: {
        Row: {
          a_accepted: boolean | null
          b_accepted: boolean | null
          created_at: string
          experience_date_id: string | null
          id: string
          profile_a_id: string
          profile_b_id: string
          reasons: Json
          score: number | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
        }
        Insert: {
          a_accepted?: boolean | null
          b_accepted?: boolean | null
          created_at?: string
          experience_date_id?: string | null
          id?: string
          profile_a_id: string
          profile_b_id: string
          reasons?: Json
          score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Update: {
          a_accepted?: boolean | null
          b_accepted?: boolean | null
          created_at?: string
          experience_date_id?: string | null
          id?: string
          profile_a_id?: string
          profile_b_id?: string
          reasons?: Json
          score?: number | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_matches_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_matches_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_matches_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "traveler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ended_at: string | null
          id: string
          is_escalated: boolean
          language: string
          lead_id: string | null
          metadata: Json
          profile_id: string | null
          satisfaction_rating: number | null
          started_at: string
          summary: string | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          is_escalated?: boolean
          language?: string
          lead_id?: string | null
          metadata?: Json
          profile_id?: string | null
          satisfaction_rating?: number | null
          started_at?: string
          summary?: string | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          is_escalated?: boolean
          language?: string
          lead_id?: string | null
          metadata?: Json
          profile_id?: string | null
          satisfaction_rating?: number | null
          started_at?: string
          summary?: string | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          hero_image: string | null
          id: string
          is_active: boolean
          name: Json
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          hero_image?: string | null
          id?: string
          is_active?: boolean
          name: Json
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          hero_image?: string | null
          id?: string
          is_active?: boolean
          name?: Json
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      destinations: {
        Row: {
          altitude_m: number | null
          climate: Json
          country_id: string
          created_at: string
          description: Json | null
          gallery: string[] | null
          hero_image: string | null
          hero_kicker: Json | null
          id: string
          is_active: boolean
          latitude: number | null
          long_description: Json | null
          longitude: number | null
          name: Json
          seo: Json
          slug: Json
          sort_order: number
          template: Database["public"]["Enums"]["page_template"]
          timezone: string | null
          updated_at: string
        }
        Insert: {
          altitude_m?: number | null
          climate?: Json
          country_id: string
          created_at?: string
          description?: Json | null
          gallery?: string[] | null
          hero_image?: string | null
          hero_kicker?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          long_description?: Json | null
          longitude?: number | null
          name: Json
          seo?: Json
          slug: Json
          sort_order?: number
          template?: Database["public"]["Enums"]["page_template"]
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          altitude_m?: number | null
          climate?: Json
          country_id?: string
          created_at?: string
          description?: Json | null
          gallery?: string[] | null
          hero_image?: string | null
          hero_kicker?: Json | null
          id?: string
          is_active?: boolean
          latitude?: number | null
          long_description?: Json | null
          longitude?: number | null
          name?: Json
          seo?: Json
          slug?: Json
          sort_order?: number
          template?: Database["public"]["Enums"]["page_template"]
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destinations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_dates: {
        Row: {
          created_at: string
          end_date: string
          experience_id: string
          id: string
          meeting_point: Json
          notes: Json | null
          price: number | null
          spots_taken: number
          spots_total: number | null
          start_date: string
          status: Database["public"]["Enums"]["experience_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          experience_id: string
          id?: string
          meeting_point?: Json
          notes?: Json | null
          price?: number | null
          spots_taken?: number
          spots_total?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["experience_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          experience_id?: string
          id?: string
          meeting_point?: Json
          notes?: Json | null
          price?: number | null
          spots_taken?: number
          spots_total?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["experience_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_dates_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_facilitators: {
        Row: {
          experience_id: string
          facilitator_id: string
          role: string
          sort_order: number
        }
        Insert: {
          experience_id: string
          facilitator_id: string
          role?: string
          sort_order?: number
        }
        Update: {
          experience_id?: string
          facilitator_id?: string
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_facilitators_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_facilitators_facilitator_id_fkey"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "facilitators"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_faqs: {
        Row: {
          answer: Json
          experience_id: string
          id: string
          question: Json
          sort_order: number
        }
        Insert: {
          answer: Json
          experience_id: string
          id?: string
          question: Json
          sort_order?: number
        }
        Update: {
          answer?: Json
          experience_id?: string
          id?: string
          question?: Json
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_faqs_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_highlights: {
        Row: {
          description: Json | null
          experience_id: string
          grupo: string | null
          grupo_titulo: Json | null
          icon: string | null
          id: string
          sort_order: number
          title: Json
        }
        Insert: {
          description?: Json | null
          experience_id: string
          grupo?: string | null
          grupo_titulo?: Json | null
          icon?: string | null
          id?: string
          sort_order?: number
          title: Json
        }
        Update: {
          description?: Json | null
          experience_id?: string
          grupo?: string | null
          grupo_titulo?: Json | null
          icon?: string | null
          id?: string
          sort_order?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "experience_highlights_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_inclusions: {
        Row: {
          experience_id: string
          id: string
          is_included: boolean
          sort_order: number
          text: Json
        }
        Insert: {
          experience_id: string
          id?: string
          is_included: boolean
          sort_order?: number
          text: Json
        }
        Update: {
          experience_id?: string
          id?: string
          is_included?: boolean
          sort_order?: number
          text?: Json
        }
        Relationships: [
          {
            foreignKeyName: "experience_inclusions_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_interests: {
        Row: {
          created_at: string
          email: string
          experience_date_id: string | null
          experience_id: string
          id: string
          lead_id: string | null
          lista_de_espera: boolean
          message: string | null
          metadata: Json
          name: string
          origem: string
          phone: string | null
          situacao: Database["public"]["Enums"]["interesse_situacao"]
          travelers_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          experience_date_id?: string | null
          experience_id: string
          id?: string
          lead_id?: string | null
          lista_de_espera?: boolean
          message?: string | null
          metadata?: Json
          name: string
          origem?: string
          phone?: string | null
          situacao?: Database["public"]["Enums"]["interesse_situacao"]
          travelers_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          experience_date_id?: string | null
          experience_id?: string
          id?: string
          lead_id?: string | null
          lista_de_espera?: boolean
          message?: string | null
          metadata?: Json
          name?: string
          origem?: string
          phone?: string | null
          situacao?: Database["public"]["Enums"]["interesse_situacao"]
          travelers_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_interests_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_interests_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_interests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_packing_items: {
        Row: {
          catalog_item_id: string
          experience_id: string
          is_required: boolean
          note: Json | null
          sort_order: number
        }
        Insert: {
          catalog_item_id: string
          experience_id: string
          is_required?: boolean
          note?: Json | null
          sort_order?: number
        }
        Update: {
          catalog_item_id?: string
          experience_id?: string
          is_required?: boolean
          note?: Json | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_packing_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "packing_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_packing_items_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_partnership: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          side: Database["public"]["Enums"]["partnership_side"]
          sort_order: number
          text: Json
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          side: Database["public"]["Enums"]["partnership_side"]
          sort_order?: number
          text: Json
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          side?: Database["public"]["Enums"]["partnership_side"]
          sort_order?: number
          text?: Json
        }
        Relationships: [
          {
            foreignKeyName: "experience_partnership_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          audience: Database["public"]["Enums"]["audience_type"]
          category_id: string | null
          closing_text: Json | null
          closing_title: Json | null
          created_at: string
          description: Json | null
          destination_id: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          duration_days: number | null
          gallery: string[] | null
          group_size_max: number | null
          group_size_min: number | null
          hero_image: string | null
          hero_kicker: Json | null
          hero_video: string | null
          id: string
          intentions: string[]
          is_featured: boolean
          marketing: Json
          metadata: Json
          period_label: Json | null
          physical_demand: number | null
          price_currency: string
          price_from: number | null
          price_note: Json | null
          published_at: string | null
          relax_text: Json | null
          seo: Json
          short_description: Json | null
          slug: Json
          sort_order: number
          status: Database["public"]["Enums"]["experience_status"]
          subtitle: Json | null
          template: Database["public"]["Enums"]["page_template"]
          title: Json
          updated_at: string
          value_proposition: Json | null
          whatsapp_number: string | null
          who_is_this_for: Json | null
          why_created: Json | null
        }
        Insert: {
          audience?: Database["public"]["Enums"]["audience_type"]
          category_id?: string | null
          closing_text?: Json | null
          closing_title?: Json | null
          created_at?: string
          description?: Json | null
          destination_id?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_days?: number | null
          gallery?: string[] | null
          group_size_max?: number | null
          group_size_min?: number | null
          hero_image?: string | null
          hero_kicker?: Json | null
          hero_video?: string | null
          id?: string
          intentions?: string[]
          is_featured?: boolean
          marketing?: Json
          metadata?: Json
          period_label?: Json | null
          physical_demand?: number | null
          price_currency?: string
          price_from?: number | null
          price_note?: Json | null
          published_at?: string | null
          relax_text?: Json | null
          seo?: Json
          short_description?: Json | null
          slug: Json
          sort_order?: number
          status?: Database["public"]["Enums"]["experience_status"]
          subtitle?: Json | null
          template?: Database["public"]["Enums"]["page_template"]
          title: Json
          updated_at?: string
          value_proposition?: Json | null
          whatsapp_number?: string | null
          who_is_this_for?: Json | null
          why_created?: Json | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["audience_type"]
          category_id?: string | null
          closing_text?: Json | null
          closing_title?: Json | null
          created_at?: string
          description?: Json | null
          destination_id?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          duration_days?: number | null
          gallery?: string[] | null
          group_size_max?: number | null
          group_size_min?: number | null
          hero_image?: string | null
          hero_kicker?: Json | null
          hero_video?: string | null
          id?: string
          intentions?: string[]
          is_featured?: boolean
          marketing?: Json
          metadata?: Json
          period_label?: Json | null
          physical_demand?: number | null
          price_currency?: string
          price_from?: number | null
          price_note?: Json | null
          published_at?: string | null
          relax_text?: Json | null
          seo?: Json
          short_description?: Json | null
          slug?: Json
          sort_order?: number
          status?: Database["public"]["Enums"]["experience_status"]
          subtitle?: Json | null
          template?: Database["public"]["Enums"]["page_template"]
          title?: Json
          updated_at?: string
          value_proposition?: Json | null
          whatsapp_number?: string | null
          who_is_this_for?: Json | null
          why_created?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      facilitators: {
        Row: {
          bio: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          photo: string | null
          seo: Json
          short_bio: Json | null
          slug: string
          social_links: Json
          sort_order: number
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          bio?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          photo?: string | null
          seo?: Json
          short_bio?: Json | null
          slug: string
          social_links?: Json
          sort_order?: number
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          bio?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          photo?: string | null
          seo?: Json
          short_bio?: Json | null
          slug?: string
          social_links?: Json
          sort_order?: number
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: Json
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          question: Json
          sort_order: number
        }
        Insert: {
          answer: Json
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question: Json
          sort_order?: number
        }
        Update: {
          answer?: Json
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          question?: Json
          sort_order?: number
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      itinerary_days: {
        Row: {
          created_at: string
          day_number: number
          description: Json | null
          experience_id: string
          id: string
          image: string | null
          location: string | null
          sort_order: number
          title: Json
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: Json | null
          experience_id: string
          id?: string
          image?: string | null
          location?: string | null
          sort_order?: number
          title: Json
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: Json | null
          experience_id?: string
          id?: string
          image?: string | null
          location?: string | null
          sort_order?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: string | null
          country: string | null
          created_at: string
          desired_month: string | null
          email: string | null
          experience_id: string | null
          id: string
          message: string | null
          metadata: Json
          name: string | null
          phone: string | null
          preferred_destination: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: string
          travelers_count: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          country?: string | null
          created_at?: string
          desired_month?: string | null
          email?: string | null
          experience_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          name?: string | null
          phone?: string | null
          preferred_destination?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: string
          travelers_count?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          country?: string | null
          created_at?: string
          desired_month?: string | null
          email?: string | null
          experience_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          name?: string | null
          phone?: string | null
          preferred_destination?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: string
          travelers_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt_text: Json | null
          caption: Json | null
          created_at: string
          filename: string
          folder: string
          height: number | null
          id: string
          metadata: Json
          mime_type: string
          original_filename: string | null
          size_bytes: number | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by: string | null
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string
          filename: string
          folder?: string
          height?: number | null
          id?: string
          metadata?: Json
          mime_type: string
          original_filename?: string | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string
          filename?: string
          folder?: string
          height?: number | null
          id?: string
          metadata?: Json
          mime_type?: string
          original_filename?: string | null
          size_bytes?: number | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          uploaded_by?: string | null
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json
          recommended_experiences: string[] | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json
          recommended_experiences?: string[] | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          recommended_experiences?: string[] | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          language: string
          name: string | null
          source: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          language?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          language?: string
          name?: string | null
          source?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      packing_catalog_items: {
        Row: {
          category: Database["public"]["Enums"]["packing_category"]
          conditions: Json
          created_at: string
          default_quantity: number | null
          description: Json | null
          id: string
          is_active: boolean
          is_essential: boolean
          name: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["packing_category"]
          conditions?: Json
          created_at?: string
          default_quantity?: number | null
          description?: Json | null
          id?: string
          is_active?: boolean
          is_essential?: boolean
          name: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["packing_category"]
          conditions?: Json
          created_at?: string
          default_quantity?: number | null
          description?: Json | null
          id?: string
          is_active?: boolean
          is_essential?: boolean
          name?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      packing_list_items: {
        Row: {
          added_by_traveler: boolean
          catalog_item_id: string | null
          category: Database["public"]["Enums"]["packing_category"]
          checked_at: string | null
          created_at: string
          description: string | null
          id: string
          is_checked: boolean
          is_essential: boolean
          list_id: string
          name: string
          note: string | null
          quantity: number | null
          reason: string | null
          sort_order: number
        }
        Insert: {
          added_by_traveler?: boolean
          catalog_item_id?: string | null
          category?: Database["public"]["Enums"]["packing_category"]
          checked_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_checked?: boolean
          is_essential?: boolean
          list_id: string
          name: string
          note?: string | null
          quantity?: number | null
          reason?: string | null
          sort_order?: number
        }
        Update: {
          added_by_traveler?: boolean
          catalog_item_id?: string | null
          category?: Database["public"]["Enums"]["packing_category"]
          checked_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_checked?: boolean
          is_essential?: boolean
          list_id?: string
          name?: string
          note?: string | null
          quantity?: number | null
          reason?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "packing_list_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "packing_catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "packing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_lists: {
        Row: {
          access_token: string
          ai_model: string | null
          booking_id: string | null
          context: Json
          created_at: string
          experience_date_id: string | null
          experience_id: string
          generated_by: string
          id: string
          language: string
          lead_id: string | null
          traveler_email: string | null
          traveler_name: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          ai_model?: string | null
          booking_id?: string | null
          context?: Json
          created_at?: string
          experience_date_id?: string | null
          experience_id: string
          generated_by?: string
          id?: string
          language?: string
          lead_id?: string | null
          traveler_email?: string | null
          traveler_name?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          ai_model?: string | null
          booking_id?: string | null
          context?: Json
          created_at?: string
          experience_date_id?: string | null
          experience_id?: string
          generated_by?: string
          id?: string
          language?: string
          lead_id?: string | null
          traveler_email?: string | null
          traveler_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_lists_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_lists_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_lists_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packing_lists_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          metadata: Json
          phone: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          metadata?: Json
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          created_at: string
          experience_id: string | null
          id: string
          is_featured: boolean
          location: string | null
          name: string
          photo: string | null
          quote: Json
          rating: number | null
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
        }
        Insert: {
          created_at?: string
          experience_id?: string | null
          id?: string
          is_featured?: boolean
          location?: string | null
          name: string
          photo?: string | null
          quote: Json
          rating?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
        }
        Update: {
          created_at?: string
          experience_id?: string | null
          id?: string
          is_featured?: boolean
          location?: string | null
          name?: string
          photo?: string | null
          quote?: Json
          rating?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_guides: {
        Row: {
          category_id: string | null
          conditions: Json
          content: Json
          country_id: string | null
          created_at: string
          created_by: string | null
          destination_id: string | null
          experience_id: string | null
          for_beginners: boolean
          id: string
          is_active: boolean
          priority: number
          scope: Database["public"]["Enums"]["guide_scope"]
          sort_order: number
          source_url: string | null
          summary: Json | null
          title: Json
          topic: Database["public"]["Enums"]["guide_topic"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          conditions?: Json
          content: Json
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          destination_id?: string | null
          experience_id?: string | null
          for_beginners?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          scope?: Database["public"]["Enums"]["guide_scope"]
          sort_order?: number
          source_url?: string | null
          summary?: Json | null
          title: Json
          topic: Database["public"]["Enums"]["guide_topic"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          conditions?: Json
          content?: Json
          country_id?: string | null
          created_at?: string
          created_by?: string | null
          destination_id?: string | null
          experience_id?: string | null
          for_beginners?: boolean
          id?: string
          is_active?: boolean
          priority?: number
          scope?: Database["public"]["Enums"]["guide_scope"]
          sort_order?: number
          source_url?: string | null
          summary?: Json | null
          title?: Json
          topic?: Database["public"]["Enums"]["guide_topic"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_guides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_guides_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_guides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_guides_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_guides_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_profiles: {
        Row: {
          access_token: string
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          booking_id: string | null
          city: string | null
          consent_matching: boolean
          consent_matching_at: string | null
          consent_revoked_at: string | null
          created_at: string
          display_name: string
          email: string | null
          experience_date_id: string | null
          id: string
          interests: string[]
          languages: string[]
          lead_id: string | null
          phone: string | null
          share_contact: boolean
          traveler_types: Database["public"]["Enums"]["traveler_type"][]
          updated_at: string
          visibility: string
        }
        Insert: {
          access_token?: string
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          booking_id?: string | null
          city?: string | null
          consent_matching?: boolean
          consent_matching_at?: string | null
          consent_revoked_at?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          experience_date_id?: string | null
          id?: string
          interests?: string[]
          languages?: string[]
          lead_id?: string | null
          phone?: string | null
          share_contact?: boolean
          traveler_types?: Database["public"]["Enums"]["traveler_type"][]
          updated_at?: string
          visibility?: string
        }
        Update: {
          access_token?: string
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          booking_id?: string | null
          city?: string | null
          consent_matching?: boolean
          consent_matching_at?: string | null
          consent_revoked_at?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          experience_date_id?: string | null
          id?: string
          interests?: string[]
          languages?: string[]
          lead_id?: string | null
          phone?: string | null
          share_contact?: boolean
          traveler_types?: Database["public"]["Enums"]["traveler_type"][]
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_profiles_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_profiles_experience_date_id_fkey"
            columns: ["experience_date_id"]
            isOneToOne: false
            referencedRelation: "experience_dates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_updated_at: { Args: { target_table: string }; Returns: undefined }
      demanda_por_saida: {
        Args: never
        Returns: {
          em_espera: number
          experience_date_id: string
          experience_id: string
          inicio: string
          interessados: number
          titulo: string
          vagas_restantes: number
        }[]
      }
      diagnostico_contas: {
        Args: never
        Returns: {
          ativo: boolean
          confirmado: boolean
          email: string
          papel: string
          situacao: string
          tem_perfil: boolean
          ultimo_acesso: string
        }[]
      }
      diagnostico_exposicao: {
        Args: never
        Returns: {
          operacao: string
          policy: string
          tabela: string
        }[]
      }
      diagnostico_tabelas: {
        Args: never
        Returns: {
          acesso_anonimo: boolean
          linhas: number
          qtd_policies: number
          rls_ligado: boolean
          tabela: string
        }[]
      }
      experiencia_publicada: { Args: { exp_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      promover_admin: { Args: { email_alvo: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      audience_type: "viajante" | "facilitador"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      content_status: "draft" | "published" | "archived"
      difficulty_level: "beginner" | "intermediate" | "advanced" | "all_levels"
      experience_status: "draft" | "published" | "archived" | "sold_out"
      guide_scope:
        | "global"
        | "country"
        | "destination"
        | "experience"
        | "category"
      guide_topic:
        | "o_que_levar"
        | "o_que_fazer"
        | "o_que_nao_fazer"
        | "ponto_de_encontro"
        | "documentos"
        | "saude"
        | "clima"
        | "dinheiro"
        | "conectividade"
        | "cultura_local"
        | "alimentacao"
        | "seguranca"
        | "viagem_em_grupo"
        | "pratica_espiritual"
        | "acessibilidade"
        | "pagamento"
      interesse_situacao: "novo" | "contatado" | "convertido" | "desistiu"
      journey_status: "draft" | "saved" | "shared" | "converted" | "archived"
      lead_source:
        | "website"
        | "whatsapp"
        | "concierge"
        | "journey_builder"
        | "referral"
        | "social"
        | "other"
      match_status: "suggested" | "accepted" | "declined" | "expired"
      media_type: "image" | "video" | "pdf" | "document"
      packing_category:
        | "documento"
        | "roupa"
        | "calcado"
        | "higiene"
        | "saude"
        | "equipamento"
        | "eletronico"
        | "pratica"
        | "dinheiro"
        | "outro"
      page_template: "classico" | "roteiro" | "territorio" | "convite"
      partnership_side: "facilitador" | "neosenses"
      traveler_type:
        | "viaja_sozinho"
        | "casal"
        | "grupo_amigos"
        | "familia"
        | "terapeuta"
        | "praticante_yoga"
        | "iniciante_meditacao"
        | "praticante_experiente"
        | "facilitador"
        | "outro"
      user_role: "admin" | "editor" | "viewer"
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
      audience_type: ["viajante", "facilitador"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      content_status: ["draft", "published", "archived"],
      difficulty_level: ["beginner", "intermediate", "advanced", "all_levels"],
      experience_status: ["draft", "published", "archived", "sold_out"],
      guide_scope: [
        "global",
        "country",
        "destination",
        "experience",
        "category",
      ],
      guide_topic: [
        "o_que_levar",
        "o_que_fazer",
        "o_que_nao_fazer",
        "ponto_de_encontro",
        "documentos",
        "saude",
        "clima",
        "dinheiro",
        "conectividade",
        "cultura_local",
        "alimentacao",
        "seguranca",
        "viagem_em_grupo",
        "pratica_espiritual",
        "acessibilidade",
        "pagamento",
      ],
      interesse_situacao: ["novo", "contatado", "convertido", "desistiu"],
      journey_status: ["draft", "saved", "shared", "converted", "archived"],
      lead_source: [
        "website",
        "whatsapp",
        "concierge",
        "journey_builder",
        "referral",
        "social",
        "other",
      ],
      match_status: ["suggested", "accepted", "declined", "expired"],
      media_type: ["image", "video", "pdf", "document"],
      packing_category: [
        "documento",
        "roupa",
        "calcado",
        "higiene",
        "saude",
        "equipamento",
        "eletronico",
        "pratica",
        "dinheiro",
        "outro",
      ],
      page_template: ["classico", "roteiro", "territorio", "convite"],
      partnership_side: ["facilitador", "neosenses"],
      traveler_type: [
        "viaja_sozinho",
        "casal",
        "grupo_amigos",
        "familia",
        "terapeuta",
        "praticante_yoga",
        "iniciante_meditacao",
        "praticante_experiente",
        "facilitador",
        "outro",
      ],
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const

