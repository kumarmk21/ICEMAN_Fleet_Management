export interface DriverSettlement {
  id: string;
  trip_id: string;
  trip_date: string;
  driver_id: string;
  driver_name: string;
  vehicle_number?: string;
  route?: string;
  advance_amount: number;
  trip_expenses_total: number;
  difference_amount: number;
  settlement_type: 'Payable' | 'Recoverable' | 'Settled';
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
  payment_reference?: string;
  payment_date?: string;
  notes?: string;
  custom_field_1_label?: string;
  custom_field_1_value?: string;
  custom_field_2_label?: string;
  custom_field_2_value?: string;
  custom_field_3_label?: string;
  custom_field_3_value?: string;
  generated_by?: string;
  generated_at: string;
  approved_by?: string;
  approved_at?: string;
  updated_at: string;
  created_at: string;
}

export interface SettlementFormData {
  trip_id: string;
  trip_date: string;
  driver_id: string;
  driver_name: string;
  vehicle_number: string;
  route: string;
  advance_amount: number | '';
  trip_expenses_total: number | '';
  notes: string;
  payment_reference: string;
  custom_field_1_label: string;
  custom_field_1_value: string;
  custom_field_2_label: string;
  custom_field_2_value: string;
  custom_field_3_label: string;
  custom_field_3_value: string;
}

export interface SummaryStats {
  totalSettlements: number;
  totalPayable: number;
  totalRecoverable: number;
  pendingApprovals: number;
}
