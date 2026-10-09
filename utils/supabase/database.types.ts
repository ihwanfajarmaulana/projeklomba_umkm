
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "booking_events": {
                  Row: {
                    "actor_id": string | null,"actor_role": Database["public"]['Enums']["actor_role"],"booking_id": number,"created_at": string,"from_status": Database["public"]['Enums']["booking_status"] | null,"id": number,"note": string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  Insert: {
                    "actor_id"?: string | null,"actor_role": Database["public"]['Enums']["actor_role"],"booking_id": number,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: never,"note"?: string | null,"to_status": Database["public"]['Enums']["booking_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["actor_role"],"booking_id"?: number,"created_at"?: string,"from_status"?: Database["public"]['Enums']["booking_status"] | null,"id"?: never,"note"?: string | null,"to_status"?: Database["public"]['Enums']["booking_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "booking_events_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "accepted_at": string | null,"amount": number,"brief": string,"brief_locked_at": string | null,"cancelled_at": string | null,"code": string,"completed_at": string | null,"created_at": string,"deadline_at": string | null,"estimated_days": number,"funded_at": string | null,"id": number,"influencer_id": number,"package_id": number,"package_includes": NonNullable<Json>,"package_name": string,"payment_due_at": string | null,"review_due_at": string | null,"review_extended": boolean,"revision_quota": number,"revisions_used": number,"status": Database["public"]['Enums']["booking_status"],"submitted_at": string | null,"umkm_id": number
                  }
                  Insert: {
                    "accepted_at"?: string | null,"amount": number,"brief": string,"brief_locked_at"?: string | null,"cancelled_at"?: string | null,"code": string,"completed_at"?: string | null,"created_at"?: string,"deadline_at"?: string | null,"estimated_days": number,"funded_at"?: string | null,"id"?: never,"influencer_id": number,"package_id": number,"package_includes"?: NonNullable<Json>,"package_name": string,"payment_due_at"?: string | null,"review_due_at"?: string | null,"review_extended"?: boolean,"revision_quota": number,"revisions_used"?: number,"status"?: Database["public"]['Enums']["booking_status"],"submitted_at"?: string | null,"umkm_id": number
                  }
                  Update: {
                    "accepted_at"?: string | null,"amount"?: number,"brief"?: string,"brief_locked_at"?: string | null,"cancelled_at"?: string | null,"code"?: string,"completed_at"?: string | null,"created_at"?: string,"deadline_at"?: string | null,"estimated_days"?: number,"funded_at"?: string | null,"id"?: never,"influencer_id"?: number,"package_id"?: number,"package_includes"?: NonNullable<Json>,"package_name"?: string,"payment_due_at"?: string | null,"review_due_at"?: string | null,"review_extended"?: boolean,"revision_quota"?: number,"revisions_used"?: number,"status"?: Database["public"]['Enums']["booking_status"],"submitted_at"?: string | null,"umkm_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_influencer_id_fkey"
      columns: ["influencer_id"]
isOneToOne: false
      referencedRelation: "influencers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_package_id_fkey"
      columns: ["package_id"]
isOneToOne: false
      referencedRelation: "packages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_umkm_id_fkey"
      columns: ["umkm_id"]
isOneToOne: false
      referencedRelation: "umkms"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "id": number,"name": string,"slug": string
                  }
                  Insert: {
                    "id"?: never,"name": string,"slug": string
                  }
                  Update: {
                    "id"?: never,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"conversations": {
                  Row: {
                    "booking_id": number,"created_at": string,"id": number
                  }
                  Insert: {
                    "booking_id": number,"created_at"?: string,"id"?: never
                  }
                  Update: {
                    "booking_id"?: number,"created_at"?: string,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"deliveries": {
                  Row: {
                    "booking_id": number,"content_url": string,"id": number,"note": string | null,"round": number,"submitted_at": string
                  }
                  Insert: {
                    "booking_id": number,"content_url": string,"id"?: never,"note"?: string | null,"round": number,"submitted_at"?: string
                  }
                  Update: {
                    "booking_id"?: number,"content_url"?: string,"id"?: never,"note"?: string | null,"round"?: number,"submitted_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deliveries_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"dispute_infos": {
                  Row: {
                    "answer": string | null,"answered_at": string | null,"answered_by": string | null,"asked_by": string,"created_at": string,"dispute_id": number,"id": number,"question": string,"target_role": Database["public"]['Enums']["party_role"]
                  }
                  Insert: {
                    "answer"?: string | null,"answered_at"?: string | null,"answered_by"?: string | null,"asked_by": string,"created_at"?: string,"dispute_id": number,"id"?: never,"question": string,"target_role": Database["public"]['Enums']["party_role"]
                  }
                  Update: {
                    "answer"?: string | null,"answered_at"?: string | null,"answered_by"?: string | null,"asked_by"?: string,"created_at"?: string,"dispute_id"?: number,"id"?: never,"question"?: string,"target_role"?: Database["public"]['Enums']["party_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "dispute_infos_dispute_id_fkey"
      columns: ["dispute_id"]
isOneToOne: false
      referencedRelation: "disputes"
      referencedColumns: ["id"]
    }
                  ]
                },"disputes": {
                  Row: {
                    "booking_id": number,"code": string,"created_at": string,"creator_share_percent": number | null,"decided_at": string | null,"decided_by": string | null,"decision": Database["public"]['Enums']["dispute_decision"] | null,"decision_note": string | null,"due_at": string,"id": number,"opened_by": Database["public"]['Enums']["party_role"],"paused_at": string | null,"reason": string,"status": Database["public"]['Enums']["dispute_status"]
                  }
                  Insert: {
                    "booking_id": number,"code": string,"created_at"?: string,"creator_share_percent"?: number | null,"decided_at"?: string | null,"decided_by"?: string | null,"decision"?: Database["public"]['Enums']["dispute_decision"] | null,"decision_note"?: string | null,"due_at": string,"id"?: never,"opened_by": Database["public"]['Enums']["party_role"],"paused_at"?: string | null,"reason": string,"status"?: Database["public"]['Enums']["dispute_status"]
                  }
                  Update: {
                    "booking_id"?: number,"code"?: string,"created_at"?: string,"creator_share_percent"?: number | null,"decided_at"?: string | null,"decided_by"?: string | null,"decision"?: Database["public"]['Enums']["dispute_decision"] | null,"decision_note"?: string | null,"due_at"?: string,"id"?: never,"opened_by"?: Database["public"]['Enums']["party_role"],"paused_at"?: string | null,"reason"?: string,"status"?: Database["public"]['Enums']["dispute_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "disputes_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"influencers": {
                  Row: {
                    "bio": string | null,"category_id": number,"city": string,"created_at": string,"engagement_rate": number,"followers": number,"handle": string,"id": number,"name": string,"rating": number,"review_count": number,"starting_price": number,"verified": boolean
                  }
                  Insert: {
                    "bio"?: string | null,"category_id": number,"city": string,"created_at"?: string,"engagement_rate"?: number,"followers"?: number,"handle": string,"id"?: never,"name": string,"rating"?: number,"review_count"?: number,"starting_price"?: number,"verified"?: boolean
                  }
                  Update: {
                    "bio"?: string | null,"category_id"?: number,"city"?: string,"created_at"?: string,"engagement_rate"?: number,"followers"?: number,"handle"?: string,"id"?: never,"name"?: string,"rating"?: number,"review_count"?: number,"starting_price"?: number,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "influencers_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"conversation_id": number,"id": number,"read_at": string | null,"sender_id": string,"sent_at": string
                  }
                  Insert: {
                    "body": string,"conversation_id": number,"id"?: never,"read_at"?: string | null,"sender_id": string,"sent_at"?: string
                  }
                  Update: {
                    "body"?: string,"conversation_id"?: number,"id"?: never,"read_at"?: string | null,"sender_id"?: string,"sent_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "booking_id": number | null,"created_at": string,"id": number,"link": string | null,"message": string,"read_at": string | null,"type": string,"user_id": string
                  }
                  Insert: {
                    "booking_id"?: number | null,"created_at"?: string,"id"?: never,"link"?: string | null,"message": string,"read_at"?: string | null,"type": string,"user_id": string
                  }
                  Update: {
                    "booking_id"?: number | null,"created_at"?: string,"id"?: never,"link"?: string | null,"message"?: string,"read_at"?: string | null,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"packages": {
                  Row: {
                    "created_at": string,"estimated_days": number,"id": number,"includes": NonNullable<Json>,"influencer_id": number,"is_active": boolean,"name": string,"price": number,"revision_quota": number,"summary": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"estimated_days": number,"id"?: never,"includes"?: NonNullable<Json>,"influencer_id": number,"is_active"?: boolean,"name": string,"price": number,"revision_quota": number,"summary"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"estimated_days"?: number,"id"?: never,"includes"?: NonNullable<Json>,"influencer_id"?: number,"is_active"?: boolean,"name"?: string,"price"?: number,"revision_quota"?: number,"summary"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "packages_influencer_id_fkey"
      columns: ["influencer_id"]
isOneToOne: false
      referencedRelation: "influencers"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "booking_id": number,"creator_amount": number,"gateway_ref": string | null,"held_at": string | null,"id": number,"settled_at": string | null,"status": Database["public"]['Enums']["payment_status"],"total_amount": number,"umkm_refund_amount": number
                  }
                  Insert: {
                    "booking_id": number,"creator_amount"?: number,"gateway_ref"?: string | null,"held_at"?: string | null,"id"?: never,"settled_at"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"total_amount": number,"umkm_refund_amount"?: number
                  }
                  Update: {
                    "booking_id"?: number,"creator_amount"?: number,"gateway_ref"?: string | null,"held_at"?: string | null,"id"?: never,"settled_at"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"total_amount"?: number,"umkm_refund_amount"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"influencer_id": number | null,"role": Database["public"]['Enums']["user_role"],"umkm_id": number | null,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"influencer_id"?: number | null,"role": Database["public"]['Enums']["user_role"],"umkm_id"?: number | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"influencer_id"?: number | null,"role"?: Database["public"]['Enums']["user_role"],"umkm_id"?: number | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_influencer_id_fkey"
      columns: ["influencer_id"]
isOneToOne: true
      referencedRelation: "influencers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_umkm_id_fkey"
      columns: ["umkm_id"]
isOneToOne: true
      referencedRelation: "umkms"
      referencedColumns: ["id"]
    }
                  ]
                },"resolution_offers": {
                  Row: {
                    "booking_id": number,"created_at": string,"escalated_at": string | null,"expires_at": string,"fee": number,"id": number,"note": string | null,"offered_by": Database["public"]['Enums']["party_role"],"responded_at": string | null,"status": Database["public"]['Enums']["offer_status"],"type": Database["public"]['Enums']["offer_type"],"value": number
                  }
                  Insert: {
                    "booking_id": number,"created_at"?: string,"escalated_at"?: string | null,"expires_at": string,"fee"?: number,"id"?: never,"note"?: string | null,"offered_by": Database["public"]['Enums']["party_role"],"responded_at"?: string | null,"status"?: Database["public"]['Enums']["offer_status"],"type": Database["public"]['Enums']["offer_type"],"value": number
                  }
                  Update: {
                    "booking_id"?: number,"created_at"?: string,"escalated_at"?: string | null,"expires_at"?: string,"fee"?: number,"id"?: never,"note"?: string | null,"offered_by"?: Database["public"]['Enums']["party_role"],"responded_at"?: string | null,"status"?: Database["public"]['Enums']["offer_status"],"type"?: Database["public"]['Enums']["offer_type"],"value"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "resolution_offers_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "booking_id": number,"comment": string | null,"created_at": string,"id": number,"rating": number,"reviewee_influencer_id": number | null,"reviewee_umkm_id": number | null,"reviewer_role": Database["public"]['Enums']["party_role"]
                  }
                  Insert: {
                    "booking_id": number,"comment"?: string | null,"created_at"?: string,"id"?: never,"rating": number,"reviewee_influencer_id"?: number | null,"reviewee_umkm_id"?: number | null,"reviewer_role": Database["public"]['Enums']["party_role"]
                  }
                  Update: {
                    "booking_id"?: number,"comment"?: string | null,"created_at"?: string,"id"?: never,"rating"?: number,"reviewee_influencer_id"?: number | null,"reviewee_umkm_id"?: number | null,"reviewer_role"?: Database["public"]['Enums']["party_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewee_influencer_id_fkey"
      columns: ["reviewee_influencer_id"]
isOneToOne: false
      referencedRelation: "influencers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewee_umkm_id_fkey"
      columns: ["reviewee_umkm_id"]
isOneToOne: false
      referencedRelation: "umkms"
      referencedColumns: ["id"]
    }
                  ]
                },"revision_requests": {
                  Row: {
                    "booking_id": number,"created_at": string,"delivery_id": number,"id": number,"note": string,"round": number,"section": string,"within_brief": boolean
                  }
                  Insert: {
                    "booking_id": number,"created_at"?: string,"delivery_id": number,"id"?: never,"note": string,"round": number,"section": string,"within_brief"?: boolean
                  }
                  Update: {
                    "booking_id"?: number,"created_at"?: string,"delivery_id"?: number,"id"?: never,"note"?: string,"round"?: number,"section"?: string,"within_brief"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "revision_requests_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "revision_requests_delivery_id_fkey"
      columns: ["delivery_id"]
isOneToOne: true
      referencedRelation: "deliveries"
      referencedColumns: ["id"]
    }
                  ]
                },"umkms": {
                  Row: {
                    "budget": number | null,"category_id": number,"city": string,"created_at": string,"id": number,"name": string,"owner": string
                  }
                  Insert: {
                    "budget"?: number | null,"category_id": number,"city": string,"created_at"?: string,"id"?: never,"name": string,"owner": string
                  }
                  Update: {
                    "budget"?: number | null,"category_id"?: number,"city"?: string,"created_at"?: string,"id"?: never,"name"?: string,"owner"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "umkms_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "influencer_reviews": {
                  Row: {
                    "author_category_slug": string | null,"author_city": string | null,"author_name": string | null,"author_owner": string | null,"author_umkm_id": number | null,"booking_id": number | null,"comment": string | null,"created_at": string | null,"influencer_id": number | null,"package_name": string | null,"rating": number | null,"review_id": number | null,"reviewee_umkm_id": number | null,"reviewer_role": Database["public"]['Enums']["party_role"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_umkm_id_fkey"
      columns: ["author_umkm_id"]
isOneToOne: false
      referencedRelation: "umkms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewee_influencer_id_fkey"
      columns: ["influencer_id"]
isOneToOne: false
      referencedRelation: "influencers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_reviewee_umkm_id_fkey"
      columns: ["reviewee_umkm_id"]
isOneToOne: false
      referencedRelation: "umkms"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "apply_booking_transition":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number,"p_to": Database["public"]['Enums']["booking_status"] }; Returns: {
              "accepted_at": string | null,
"amount": number,
"brief": string,
"brief_locked_at": string | null,
"cancelled_at": string | null,
"code": string,
"completed_at": string | null,
"created_at": string,
"deadline_at": string | null,
"estimated_days": number,
"funded_at": string | null,
"id": number,
"influencer_id": number,
"package_id": number,
"package_includes": NonNullable<Json>,
"package_name": string,
"payment_due_at": string | null,
"review_due_at": string | null,
"review_extended": boolean,
"revision_quota": number,
"revisions_used": number,
"status": Database["public"]['Enums']["booking_status"],
"submitted_at": string | null,
"umkm_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_offer":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number,"p_note"?: string,"p_type": Database["public"]['Enums']["offer_type"],"p_value": number }; Returns: {
              "booking_id": number,
"created_at": string,
"escalated_at": string | null,
"expires_at": string,
"fee": number,
"id": number,
"note": string | null,
"offered_by": Database["public"]['Enums']["party_role"],
"responded_at": string | null,
"status": Database["public"]['Enums']["offer_status"],
"type": Database["public"]['Enums']["offer_type"],
"value": number
            }
                          SetofOptions: {
        from: "*"
        to: "resolution_offers"
        isOneToOne: true
        isSetofReturn: false
      } },
"extend_review_window":
{ Args: { "p_booking_id": number }; Returns: {
              "accepted_at": string | null,
"amount": number,
"brief": string,
"brief_locked_at": string | null,
"cancelled_at": string | null,
"code": string,
"completed_at": string | null,
"created_at": string,
"deadline_at": string | null,
"estimated_days": number,
"funded_at": string | null,
"id": number,
"influencer_id": number,
"package_id": number,
"package_includes": NonNullable<Json>,
"package_name": string,
"payment_due_at": string | null,
"review_due_at": string | null,
"review_extended": boolean,
"revision_quota": number,
"revisions_used": number,
"status": Database["public"]['Enums']["booking_status"],
"submitted_at": string | null,
"umkm_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"open_dispute":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number,"p_reason": string }; Returns: {
              "accepted_at": string | null,
"amount": number,
"brief": string,
"brief_locked_at": string | null,
"cancelled_at": string | null,
"code": string,
"completed_at": string | null,
"created_at": string,
"deadline_at": string | null,
"estimated_days": number,
"funded_at": string | null,
"id": number,
"influencer_id": number,
"package_id": number,
"package_includes": NonNullable<Json>,
"package_name": string,
"payment_due_at": string | null,
"review_due_at": string | null,
"review_extended": boolean,
"revision_quota": number,
"revisions_used": number,
"status": Database["public"]['Enums']["booking_status"],
"submitted_at": string | null,
"umkm_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"request_revision":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number,"p_delivery_id": number,"p_note": string,"p_section": string,"p_within_brief"?: boolean }; Returns: {
              "accepted_at": string | null,
"amount": number,
"brief": string,
"brief_locked_at": string | null,
"cancelled_at": string | null,
"code": string,
"completed_at": string | null,
"created_at": string,
"deadline_at": string | null,
"estimated_days": number,
"funded_at": string | null,
"id": number,
"influencer_id": number,
"package_id": number,
"package_includes": NonNullable<Json>,
"package_name": string,
"payment_due_at": string | null,
"review_due_at": string | null,
"review_extended": boolean,
"revision_quota": number,
"revisions_used": number,
"status": Database["public"]['Enums']["booking_status"],
"submitted_at": string | null,
"umkm_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"respond_to_offer":
{ Args: { "p_accept": boolean,"p_actor_role": Database["public"]['Enums']["actor_role"],"p_offer_id": number }; Returns: {
              "booking_id": number,
"created_at": string,
"escalated_at": string | null,
"expires_at": string,
"fee": number,
"id": number,
"note": string | null,
"offered_by": Database["public"]['Enums']["party_role"],
"responded_at": string | null,
"status": Database["public"]['Enums']["offer_status"],
"type": Database["public"]['Enums']["offer_type"],
"value": number
            }
                          SetofOptions: {
        from: "*"
        to: "resolution_offers"
        isOneToOne: true
        isSetofReturn: false
      } },
"submit_delivery":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number,"p_content_url": string,"p_note"?: string }; Returns: {
              "accepted_at": string | null,
"amount": number,
"brief": string,
"brief_locked_at": string | null,
"cancelled_at": string | null,
"code": string,
"completed_at": string | null,
"created_at": string,
"deadline_at": string | null,
"estimated_days": number,
"funded_at": string | null,
"id": number,
"influencer_id": number,
"package_id": number,
"package_includes": NonNullable<Json>,
"package_name": string,
"payment_due_at": string | null,
"review_due_at": string | null,
"review_extended": boolean,
"revision_quota": number,
"revisions_used": number,
"status": Database["public"]['Enums']["booking_status"],
"submitted_at": string | null,
"umkm_id": number
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_conversation_read":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_booking_id": number }; Returns: number },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean },
"decide_dispute":
{ Args: { "p_creator_share_percent": number,"p_decided_by": string,"p_decision": Database["public"]['Enums']["dispute_decision"],"p_dispute_id": number,"p_note": string }; Returns: {
              "booking_id": number,
"code": string,
"created_at": string,
"creator_share_percent": number | null,
"decided_at": string | null,
"decided_by": string | null,
"decision": Database["public"]['Enums']["dispute_decision"] | null,
"decision_note": string | null,
"due_at": string,
"id": number,
"opened_by": Database["public"]['Enums']["party_role"],
"paused_at": string | null,
"reason": string,
"status": Database["public"]['Enums']["dispute_status"]
            }
                          SetofOptions: {
        from: "*"
        to: "disputes"
        isOneToOne: true
        isSetofReturn: false
      } },
"request_dispute_info":
{ Args: { "p_asked_by": string,"p_dispute_id": number,"p_question": string,"p_target_role": Database["public"]['Enums']["party_role"] }; Returns: {
              "answer": string | null,
"answered_at": string | null,
"answered_by": string | null,
"asked_by": string,
"created_at": string,
"dispute_id": number,
"id": number,
"question": string,
"target_role": Database["public"]['Enums']["party_role"]
            }
                          SetofOptions: {
        from: "*"
        to: "dispute_infos"
        isOneToOne: true
        isSetofReturn: false
      } },
"answer_dispute_info":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_answer": string,"p_answered_by": string,"p_info_id": number }; Returns: {
              "answer": string | null,
"answered_at": string | null,
"answered_by": string | null,
"asked_by": string,
"created_at": string,
"dispute_id": number,
"id": number,
"question": string,
"target_role": Database["public"]['Enums']["party_role"]
            }
                          SetofOptions: {
        from: "*"
        to: "dispute_infos"
        isOneToOne: true
        isSetofReturn: false
      } },
"send_message":
{ Args: { "p_actor_role": Database["public"]['Enums']["actor_role"],"p_body": string,"p_booking_id": number }; Returns: {
              "body": string,
"conversation_id": number,
"id": number,
"read_at": string | null,
"sender_id": string,
"sent_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "messages"
        isOneToOne: false
        isSetofReturn: false
      } }
          }
          Enums: {
            "actor_role": "umkm"|"influencer"|"admin"|"system","booking_status": "PENDING"|"ACCEPTED"|"FUNDED"|"SUBMITTED"|"REVISION"|"DISPUTED"|"COMPLETED"|"REJECTED"|"CANCELLED","dispute_decision": "RELEASE_FULL"|"REFUND_FULL"|"SPLIT","dispute_status": "OPEN"|"NEED_INFO"|"RESOLVED","offer_status": "PENDING"|"ACCEPTED"|"DECLINED"|"EXPIRED","offer_type": "EXTRA_REVISION"|"DISCOUNT"|"CANCELLATION","party_role": "umkm"|"influencer","payment_status": "UNPAID"|"HELD"|"RELEASED"|"REFUNDED"|"SPLIT","user_role": "umkm"|"influencer"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "actor_role": ["umkm", "influencer", "admin", "system"],"booking_status": ["PENDING", "ACCEPTED", "FUNDED", "SUBMITTED", "REVISION", "DISPUTED", "COMPLETED", "REJECTED", "CANCELLED"],"dispute_decision": ["RELEASE_FULL", "REFUND_FULL", "SPLIT"],"dispute_status": ["OPEN", "NEED_INFO", "RESOLVED"],"offer_status": ["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"],"offer_type": ["EXTRA_REVISION", "DISCOUNT", "CANCELLATION"],"party_role": ["umkm", "influencer"],"payment_status": ["UNPAID", "HELD", "RELEASED", "REFUNDED", "SPLIT"],"user_role": ["umkm", "influencer", "admin"]
          }
        }
} as const
