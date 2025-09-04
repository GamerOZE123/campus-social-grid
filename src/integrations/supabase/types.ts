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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      advertising_clicks: {
        Row: {
          advertising_post_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          advertising_post_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          advertising_post_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      advertising_likes: {
        Row: {
          advertising_post_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          advertising_post_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          advertising_post_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      advertising_posts: {
        Row: {
          click_count: number
          company_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_active: boolean
          likes_count: number
          redirect_url: string
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          likes_count?: number
          redirect_url: string
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          likes_count?: number
          redirect_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          auction_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          auction_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          created_at: string
          current_price: number
          description: string | null
          end_time: string
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          reserve_price: number | null
          starting_price: number
          title: string
          user_id: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          current_price?: number
          description?: string | null
          end_time: string
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          reserve_price?: number | null
          starting_price: number
          title: string
          user_id: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          current_price?: number
          description?: string | null
          end_time?: string
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          reserve_price?: number | null
          starting_price?: number
          title?: string
          user_id?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string
          blocked_id: string
          blocker_id: string
          id: string
        }
        Insert: {
          blocked_at?: string
          blocked_id: string
          blocker_id: string
          id?: string
        }
        Update: {
          blocked_at?: string
          blocked_id?: string
          blocker_id?: string
          id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          current_progress: number | null
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          current_progress?: number | null
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          current_progress?: number | null
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fitness_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          id: string
          notes: string | null
          progress_value: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          notes?: string | null
          progress_value: number
          recorded_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          notes?: string | null
          progress_value?: number
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fitness_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      cleared_chats: {
        Row: {
          cleared_at: string
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cleared_at?: string
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cleared_at?: string
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      club_memberships: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          admin_user_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          member_count: number | null
          name: string
        }
        Insert: {
          admin_user_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name: string
        }
        Update: {
          admin_user_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          company_description: string | null
          company_name: string
          company_size: string | null
          created_at: string
          headquarters: string | null
          id: string
          industry: string | null
          logo_url: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_description?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string
          headquarters?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      deleted_chats: {
        Row: {
          conversation_id: string
          deleted_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          deleted_at?: string
          id?: string
          reason?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          deleted_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      fitness_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          creator_id: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          prize_description: string | null
          start_date: string
          target_unit: string
          target_value: number
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          creator_id: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          prize_description?: string | null
          start_date: string
          target_unit: string
          target_value: number
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          prize_description?: string | null
          start_date?: string
          target_unit?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      holiday_attendees: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "holiday_events"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_events: {
        Row: {
          created_at: string
          current_attendees: number | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          max_attendees: number | null
          organizer_id: string
          title: string
        }
        Insert: {
          created_at?: string
          current_attendees?: number | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id: string
          title: string
        }
        Update: {
          created_at?: string
          current_attendees?: number | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_attendees?: number | null
          organizer_id?: string
          title?: string
        }
        Relationships: []
      }
      item_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string
          id: string
          job_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          job_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          job_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_swipes: {
        Row: {
          id: string
          job_id: string
          student_id: string
          swipe_direction: string
          swiped_at: string
        }
        Insert: {
          id?: string
          job_id: string
          student_id: string
          swipe_direction: string
          swiped_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          student_id?: string
          swipe_direction?: string
          swiped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_swipes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_swipes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_deadline: string | null
          company_id: string
          created_at: string
          description: string | null
          experience_level: string | null
          id: string
          is_active: boolean | null
          job_type: string | null
          location: string | null
          requirements: string | null
          salary_range: string | null
          skills_required: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          skills_required?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      marketplace_items: {
        Row: {
          category_id: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[] | null
          is_sold: boolean | null
          location: string | null
          price: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean | null
          location?: string | null
          price: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[] | null
          is_sold?: boolean | null
          location?: string | null
          price?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
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
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_comment_id: string | null
          related_post_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_comment_id?: string | null
          related_post_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_comment_id?: string | null
          related_post_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_comment_id_fkey"
            columns: ["related_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_url: string | null
          likes_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          banner_height: number | null
          banner_position: number | null
          banner_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          email: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          major: string | null
          state: string | null
          university: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
          username: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          banner_height?: number | null
          banner_position?: number | null
          banner_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          major?: string | null
          state?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          banner_height?: number | null
          banner_position?: number | null
          banner_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          major?: string | null
          state?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
          username?: string
        }
        Relationships: []
      }
      recent_chats: {
        Row: {
          created_at: string
          id: string
          last_interacted_at: string
          other_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_interacted_at?: string
          other_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_interacted_at?: string
          other_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_chats_other_user_id_fkey"
            columns: ["other_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "recent_chats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scheduled_workouts: {
        Row: {
          created_at: string
          id: string
          scheduled_date: string
          scheduled_time: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          scheduled_date?: string
          scheduled_time: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          scheduled_date?: string
          scheduled_time?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          certificates: string[] | null
          created_at: string
          education: Json | null
          experience_level: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_job_types: string[] | null
          preferred_location: string | null
          resume_url: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          work_experience: Json | null
        }
        Insert: {
          certificates?: string[] | null
          created_at?: string
          education?: Json | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_location?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          work_experience?: Json | null
        }
        Update: {
          certificates?: string[] | null
          created_at?: string
          education?: Json | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_job_types?: string[] | null
          preferred_location?: string | null
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          work_experience?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          calories_burned: number | null
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          user_id: string
          workout_name: string
          workout_type: string | null
        }
        Insert: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          user_id: string
          workout_name: string
          workout_type?: string | null
        }
        Update: {
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          user_id?: string
          workout_name?: string
          workout_type?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories: string | null
          created_at: string
          difficulty: string
          duration: number
          equipment: string
          id: string
          title: string
          user_id: string
          workout_type: string | null
        }
        Insert: {
          calories?: string | null
          created_at?: string
          difficulty: string
          duration: number
          equipment: string
          id?: string
          title: string
          user_id: string
          workout_type?: string | null
        }
        Update: {
          calories?: string | null
          created_at?: string
          difficulty?: string
          duration?: number
          equipment?: string
          id?: string
          title?: string
          user_id?: string
          workout_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      trending_hashtags: {
        Row: {
          hashtag: string | null
          last_used: string | null
          post_count: number | null
          unique_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      company_can_access_student_contact: {
        Args: { company_user_id: string; student_user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          comment_id?: string
          notification_message: string
          notification_title: string
          notification_type: string
          post_id?: string
          sender_user_id?: string
          target_user_id: string
        }
        Returns: string
      }
      extract_hashtags: {
        Args: { content: string }
        Returns: string[]
      }
      get_challenge_participant_count: {
        Args: { challenge_uuid: string }
        Returns: number
      }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_public_student_info: {
        Args: { target_user_id: string }
        Returns: {
          experience_level: string
          preferred_job_types: string[]
          preferred_location: string
          skills: string[]
          user_id: string
        }[]
      }
      get_recent_chats: {
        Args: { target_user_id: string }
        Returns: {
          last_interacted_at: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          other_user_university: string
        }[]
      }
      get_unswiped_jobs_for_student: {
        Args: { student_user_id: string }
        Returns: {
          company_logo: string
          company_name: string
          description: string
          job_id: string
          job_type: string
          location: string
          salary_range: string
          skills_required: string[]
          title: string
        }[]
      }
      get_user_conversations: {
        Args: { target_user_id: string }
        Returns: {
          conversation_id: string
          last_message: string
          last_message_time: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          other_user_university: string
          unread_count: number
        }[]
      }
      upsert_recent_chat: {
        Args: { current_user_id: string; target_user_id: string }
        Returns: undefined
      }
      user_in_conversation: {
        Args: { check_user_id: string; conv_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_type: "student" | "company"
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
      user_type: ["student", "company"],
    },
  },
} as const
