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
      roles: {
        Row: {
          role_id: string
          role_name: string
          description: string | null
          permissions: Json
          created_at: string
        }
        Insert: {
          role_id?: string
          role_name: string
          description?: string | null
          permissions?: Json
          created_at?: string
        }
        Update: {
          role_id?: string
          role_name?: string
          description?: string | null
          permissions?: Json
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          user_id: string
          role_id: string
          full_name: string
          mobile_number: string | null
          employee_code: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          role_id: string
          full_name: string
          mobile_number?: string | null
          employee_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          role_id?: string
          full_name?: string
          mobile_number?: string | null
          employee_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          vehicle_id: string
          vehicle_number: string
          vehicle_type: string
          ownership_type: string
          make: string
          model: string
          year_of_manufacture: number | null
          capacity_tons: number
          registration_number: string
          engine_number: string
          chassis_number: string
          odometer_current: number
          status: string
          fixed_cost_per_month: number
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          vehicle_id?: string
          vehicle_number: string
          vehicle_type?: string
          ownership_type?: string
          make?: string
          model?: string
          year_of_manufacture?: number | null
          capacity_tons?: number
          registration_number?: string
          engine_number?: string
          chassis_number?: string
          odometer_current?: number
          status?: string
          fixed_cost_per_month?: number
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      drivers: {
        Row: {
          driver_id: string
          driver_name: string
          mobile_number: string
          alternate_mobile: string
          address: string
          license_number: string
          license_valid_upto: string | null
          aadhar_number: string
          pan_number: string
          status: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          driver_id?: string
          driver_name: string
          mobile_number?: string
          alternate_mobile?: string
          address?: string
          license_number?: string
          license_valid_upto?: string | null
          aadhar_number?: string
          pan_number?: string
          status?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>
      }
      routes: {
        Row: {
          route_id: string
          route_code: string
          origin: string
          destination: string
          standard_distance_km: number
          standard_fuel_kmpl: number
          standard_transit_time_days: number
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          route_id?: string
          route_code?: string
          origin: string
          destination: string
          standard_distance_km?: number
          standard_fuel_kmpl?: number
          standard_transit_time_days?: number
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['routes']['Insert']>
      }
      customers: {
        Row: {
          customer_id: string
          customer_name: string
          gst_number: string
          billing_address: string
          contact_person: string
          contact_mobile: string
          email: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          customer_id?: string
          customer_name: string
          gst_number?: string
          billing_address?: string
          contact_person?: string
          contact_mobile?: string
          email?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      expense_heads: {
        Row: {
          expense_head_id: string
          expense_head_name: string
          category: string
          default_gl_code: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          expense_head_id?: string
          expense_head_name: string
          category?: string
          default_gl_code?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['expense_heads']['Insert']>
      }
      vendors: {
        Row: {
          vendor_id: string
          vendor_name: string
          vendor_type: string
          gst_number: string
          address: string
          contact_person: string
          contact_mobile: string
          email: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          vendor_id?: string
          vendor_name: string
          vendor_type?: string
          gst_number?: string
          address?: string
          contact_person?: string
          contact_mobile?: string
          email?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['vendors']['Insert']>
      }
      document_types: {
        Row: {
          document_type_id: string
          document_type_name: string
          description: string
          created_at: string
        }
        Insert: {
          document_type_id?: string
          document_type_name: string
          description?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_types']['Insert']>
      }
      vehicle_documents: {
        Row: {
          vehicle_document_id: string
          vehicle_id: string
          document_type_id: string
          document_number: string
          valid_from: string | null
          valid_to: string | null
          attachment_url: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          vehicle_document_id?: string
          vehicle_id: string
          document_type_id: string
          document_number?: string
          valid_from?: string | null
          valid_to?: string | null
          attachment_url?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['vehicle_documents']['Insert']>
      }
      trips: {
        Row: {
          trip_id: string
          trip_number: string
          vehicle_id: string
          driver_id: string
          helper_name: string
          route_id: string | null
          customer_id: string | null
          origin: string
          destination: string
          planned_start_datetime: string | null
          actual_start_datetime: string | null
          planned_end_datetime: string | null
          actual_end_datetime: string | null
          planned_distance_km: number
          actual_distance_km: number
          freight_revenue: number
          other_revenue: number
          advance_to_driver: number
          payment_mode_advance: string
          trip_status: string
          remarks: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          trip_id?: string
          trip_number?: string
          vehicle_id: string
          driver_id: string
          helper_name?: string
          route_id?: string | null
          customer_id?: string | null
          origin: string
          destination: string
          planned_start_datetime?: string | null
          actual_start_datetime?: string | null
          planned_end_datetime?: string | null
          actual_end_datetime?: string | null
          planned_distance_km?: number
          actual_distance_km?: number
          freight_revenue?: number
          other_revenue?: number
          advance_to_driver?: number
          payment_mode_advance?: string
          trip_status?: string
          remarks?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['trips']['Insert']>
      }
      trip_expenses: {
        Row: {
          trip_expense_id: string
          trip_id: string
          expense_date: string
          expense_head_id: string
          vendor_id: string | null
          description: string
          amount: number
          quantity: number
          unit: string
          bill_number: string
          attachment_url: string
          rate_per_litre: number
          odometer_reading: number
          toll_plaza_name: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          trip_expense_id?: string
          trip_id: string
          expense_date?: string
          expense_head_id: string
          vendor_id?: string | null
          description?: string
          amount: number
          quantity?: number
          unit?: string
          bill_number?: string
          attachment_url?: string
          rate_per_litre?: number
          odometer_reading?: number
          toll_plaza_name?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['trip_expenses']['Insert']>
      }
      fuel_transactions: {
        Row: {
          fuel_txn_id: string
          trip_id: string | null
          vehicle_id: string
          transaction_date: string
          odometer_reading: number
          fuel_litres: number
          rate_per_litre: number
          amount: number
          fuel_station_name: string
          vendor_id: string | null
          remarks: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          fuel_txn_id?: string
          trip_id?: string | null
          vehicle_id: string
          transaction_date?: string
          odometer_reading?: number
          fuel_litres: number
          rate_per_litre: number
          amount: number
          fuel_station_name?: string
          vendor_id?: string | null
          remarks?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['fuel_transactions']['Insert']>
      }
      maintenance_jobs: {
        Row: {
          maintenance_id: string
          vehicle_id: string
          job_card_number: string
          workshop_vendor_id: string | null
          job_date: string
          odometer_reading: number
          issue_description: string
          parts_cost: number
          labour_cost: number
          total_cost: number
          downtime_from: string | null
          downtime_to: string | null
          remarks: string
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          maintenance_id?: string
          vehicle_id: string
          job_card_number?: string
          workshop_vendor_id?: string | null
          job_date?: string
          odometer_reading?: number
          issue_description?: string
          parts_cost?: number
          labour_cost?: number
          total_cost?: number
          downtime_from?: string | null
          downtime_to?: string | null
          remarks?: string
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['maintenance_jobs']['Insert']>
      }
      tyres: {
        Row: {
          tyre_id: string
          tyre_number: string
          vehicle_id: string | null
          position: string
          fitted_date: string | null
          fitted_odometer: number
          removed_date: string | null
          removed_odometer: number
          cost: number
          status: string
          remarks: string
          created_at: string
          updated_at: string
        }
        Insert: {
          tyre_id?: string
          tyre_number: string
          vehicle_id?: string | null
          position?: string
          fitted_date?: string | null
          fitted_odometer?: number
          removed_date?: string | null
          removed_odometer?: number
          cost?: number
          status?: string
          remarks?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tyres']['Insert']>
      }
    }
    Views: {
      trip_profitability_view: {
        Row: {
          trip_id: string
          trip_number: string
          vehicle_id: string
          vehicle_number: string
          ownership_type: string
          driver_id: string
          driver_name: string
          customer_id: string | null
          customer_name: string | null
          origin: string
          destination: string
          actual_start_datetime: string | null
          actual_end_datetime: string | null
          trip_status: string
          actual_distance_km: number
          freight_revenue: number
          other_revenue: number
          total_revenue: number
          total_variable_cost: number
          allocated_fixed_cost: number
          trip_profit: number
          profit_per_km: number
          created_at: string
          updated_at: string
        }
      }
      vehicle_monthly_profitability_view: {
        Row: {
          vehicle_id: string
          vehicle_number: string
          vehicle_type: string
          ownership_type: string
          vehicle_status: string
          month: string
          total_trips: number
          total_km: number
          total_revenue: number
          total_variable_cost: number
          total_fixed_cost: number
          total_maintenance_cost: number
          net_profit: number
          profit_per_km: number
          profit_per_trip: number
        }
      }
      document_expiry_alerts_view: {
        Row: {
          vehicle_document_id: string
          vehicle_id: string
          vehicle_number: string
          document_type_id: string
          document_type_name: string
          document_number: string
          valid_from: string | null
          valid_to: string | null
          today: string
          days_until_expiry: number
          urgency_level: string
          remarks: string
        }
      }
      fuel_efficiency_view: {
        Row: {
          vehicle_id: string
          vehicle_number: string
          vehicle_type: string
          month: string | null
          total_km: number
          total_fuel_litres: number
          total_fuel_cost: number
          actual_kmpl: number
          cost_per_km: number
          standard_kmpl: number
          efficiency_percentage: number
        }
      }
      dashboard_kpis_view: {
        Row: {
          total_active_vehicles: number
          vehicles_under_maintenance: number
          vehicles_in_trip: number
          vehicles_idle: number
          total_trips: number
          total_km: number
          total_fuel_consumed: number
          average_kmpl: number
          total_revenue: number
          total_cost: number
          net_profit: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
