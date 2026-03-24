export interface Service {
  id: string
  name: string
  type: string | null
  phone_number: string | null
}

export interface Contact {
  id: string
  name: string | null
  internal_name: string | null
  alternative_name: string | null
  phone_number: string | null
  service_id: string | null
  service_name: string | null
  is_group: number
  is_broadcast: number
  last_message_at: string | null
}

export interface Message {
  id: string
  contact_id: string | null
  service_id: string | null
  user_id: string | null
  user_name: string | null
  ticket_id: string | null
  ticket_department_id: string | null
  department_name: string | null
  from_id: string | null
  text: string | null
  type: string | null
  origin: string | null
  is_from_me: number
  is_comment: number
  is_from_bot: number
  quoted_message_id: string | null
  timestamp: string | null
  created_at: string | null
  raw_json: string | null
}

export interface Stats {
  total_contacts: number
  total_messages: number
  total_services: number
  oldest_message: string | null
  newest_message: string | null
}
