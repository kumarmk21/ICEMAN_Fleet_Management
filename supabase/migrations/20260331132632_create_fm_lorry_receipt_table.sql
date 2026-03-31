/*
  # Create fm_lorry_receipt Table

  ## Purpose
  Stores Lorry Receipt (LR) records for freight/transport management.
  A Lorry Receipt is the primary document for each consignment/shipment.

  ## New Table: fm_lorry_receipt

  ### Identity & Reference
  - `lr_id` - Auto-incrementing primary key
  - `lr_no` - Unique LR number (business key)
  - `lr_date` - Date of LR creation
  - `company_code`, `branch_code` - Organization identifiers
  - `financial_year` - Financial year for the LR

  ### Party Information
  - Customer (billed party), consignor (sender), consignee (receiver), billing party

  ### Trip/Vehicle Information
  - Trip number, vehicle, driver details linked to this LR

  ### Shipment Details
  - Commodity, packaging, weight, declared/invoice value, goods description

  ### Reference Documents
  - Invoice, PO, E-Way Bill, Delivery Challan, Docket references

  ### Charges & Financials
  - Freight, loading/unloading, detention, halting, ODA, fuel surcharge, misc
  - Discount, taxable amount, GST components, total

  ### Status Flags
  - lr_status: OPEN / CLOSED / CANCELLED
  - billing_status: PENDING / BILLED / CANCELLED
  - pod_status: PENDING / RECEIVED / WAIVED
  - trip_status, delivery_status, invoice_submission_status

  ### Dates & Audit
  - Dispatch, delivery, POD, billing dates
  - Created/modified by and on, soft-delete flags

  ## Notes
  1. Duplicate columns from original spec (invoice_no, po_no, ewaybill_no, etc.) deduplicated — kept once each.
  2. SQL Server types converted: IDENTITY → GENERATED ALWAYS AS IDENTITY, DATETIME → TIMESTAMPTZ, BIT → BOOLEAN.
  3. RLS enabled; authenticated users can perform all operations.
*/

CREATE TABLE IF NOT EXISTS fm_lorry_receipt (
  -- Identity
  lr_id                       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lr_no                       VARCHAR(30) NOT NULL UNIQUE,
  lr_date                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  company_code                VARCHAR(20) NOT NULL,
  branch_code                 VARCHAR(20) NOT NULL,
  financial_year              VARCHAR(10) NULL,

  -- Customer / Billing Party
  customer_code               VARCHAR(20) NOT NULL,
  customer_name               VARCHAR(150) NOT NULL,
  billing_party_code          VARCHAR(20) NULL,
  billing_party_name          VARCHAR(150) NULL,

  -- Consignor
  consignor_name              VARCHAR(150) NOT NULL,
  consignor_address           VARCHAR(300) NULL,
  consignor_gstin             VARCHAR(20) NULL,
  consignor_contact_no        VARCHAR(20) NULL,

  -- Consignee
  consignee_name              VARCHAR(150) NOT NULL,
  consignee_address           VARCHAR(300) NULL,
  consignee_gstin             VARCHAR(20) NULL,
  consignee_contact_no        VARCHAR(20) NULL,

  -- Route
  from_location_name          VARCHAR(100) NOT NULL,
  to_location_name            VARCHAR(100) NOT NULL,

  -- Trip / Vehicle
  trip_no                     VARCHAR(30) NULL,
  trip_date                   TIMESTAMPTZ NULL,
  vehicle_no                  VARCHAR(20) NULL,
  vehicle_type                VARCHAR(50) NULL,
  fleet_type                  VARCHAR(20) NULL,
  driver_name                 VARCHAR(100) NULL,
  driver_mobile               VARCHAR(20) NULL,

  -- Service Details
  movement_type               VARCHAR(30) NULL,
  service_type                VARCHAR(30) NULL,
  transport_mode              VARCHAR(20) NULL,
  payment_basis               VARCHAR(20) NULL,
  booking_type                VARCHAR(20) NULL,

  -- Commodity / Shipment
  commodity_code              VARCHAR(20) NULL,
  commodity_name              VARCHAR(100) NULL,
  package_type                VARCHAR(50) NULL,
  no_of_packages              INT NOT NULL DEFAULT 0,
  actual_weight_kg            DECIMAL(18,3) NOT NULL DEFAULT 0,
  charged_weight_kg           DECIMAL(18,3) NOT NULL DEFAULT 0,
  declared_value              DECIMAL(18,2) NOT NULL DEFAULT 0,
  invoice_value               DECIMAL(18,2) NOT NULL DEFAULT 0,
  description_of_goods        VARCHAR(300) NULL,

  -- Reference Documents
  invoice_no                  VARCHAR(50) NULL,
  invoice_date                DATE NULL,
  po_no                       VARCHAR(50) NULL,
  po_date                     DATE NULL,
  ewaybill_no                 VARCHAR(30) NULL,
  ewaybill_date               DATE NULL,
  ewaybill_valid_upto         TIMESTAMPTZ NULL,
  delivery_challan_no         VARCHAR(50) NULL,
  delivery_challan_date       DATE NULL,
  docket_ref_no               VARCHAR(50) NULL,

  -- Charges & Financials
  rate_type                   VARCHAR(30) NULL,       -- PER_KG / PER_TON / PER_TRIP / PER_CFT / FIXED
  freight_amount              DECIMAL(18,2) NOT NULL DEFAULT 0,
  loading_charges             DECIMAL(18,2) NOT NULL DEFAULT 0,
  unloading_charges           DECIMAL(18,2) NOT NULL DEFAULT 0,
  detention_charges           DECIMAL(18,2) NOT NULL DEFAULT 0,
  halting_charges             DECIMAL(18,2) NOT NULL DEFAULT 0,
  oda_charges                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  fuel_surcharge              DECIMAL(18,2) NOT NULL DEFAULT 0,
  misc_charges                DECIMAL(18,2) NOT NULL DEFAULT 0,
  discount_amount             DECIMAL(18,2) NOT NULL DEFAULT 0,
  taxable_amount              DECIMAL(18,2) NOT NULL DEFAULT 0,
  cgst_amount                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  sgst_amount                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  igst_amount                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_amount                DECIMAL(18,2) NOT NULL DEFAULT 0,

  -- Status
  lr_status                   VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  billing_status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  pod_status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  trip_status                 VARCHAR(20) NULL,
  delivery_status             VARCHAR(20) NULL,
  invoice_submission_status   VARCHAR(20) NULL,

  -- Flags
  is_shortage_damage_reported BOOLEAN NOT NULL DEFAULT FALSE,
  is_claim_raised             BOOLEAN NOT NULL DEFAULT FALSE,

  -- Operational Dates
  dispatch_date               TIMESTAMPTZ NULL,
  expected_delivery_date      TIMESTAMPTZ NULL,
  actual_delivery_date        TIMESTAMPTZ NULL,
  pod_received_date           TIMESTAMPTZ NULL,
  billing_ready_date          TIMESTAMPTZ NULL,
  billing_date                TIMESTAMPTZ NULL,

  -- Billing References
  customer_bill_no            VARCHAR(50) NULL,
  customer_bill_date          DATE NULL,
  vendor_bill_no              VARCHAR(50) NULL,
  vendor_bill_date            DATE NULL,

  -- Remarks
  remarks                     VARCHAR(500) NULL,
  delivery_remarks            VARCHAR(500) NULL,
  exception_reason            VARCHAR(300) NULL,

  -- Audit
  created_by                  VARCHAR(50) NOT NULL,
  created_on                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  modified_by                 VARCHAR(50) NULL,
  modified_on                 TIMESTAMPTZ NULL,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted                  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_fm_lr_lr_date ON fm_lorry_receipt (lr_date);
CREATE INDEX IF NOT EXISTS idx_fm_lr_customer_code ON fm_lorry_receipt (customer_code);
CREATE INDEX IF NOT EXISTS idx_fm_lr_trip_no ON fm_lorry_receipt (trip_no);
CREATE INDEX IF NOT EXISTS idx_fm_lr_vehicle_no ON fm_lorry_receipt (vehicle_no);
CREATE INDEX IF NOT EXISTS idx_fm_lr_lr_status ON fm_lorry_receipt (lr_status);
CREATE INDEX IF NOT EXISTS idx_fm_lr_billing_status ON fm_lorry_receipt (billing_status);
CREATE INDEX IF NOT EXISTS idx_fm_lr_ewaybill_no ON fm_lorry_receipt (ewaybill_no);
CREATE INDEX IF NOT EXISTS idx_fm_lr_is_deleted ON fm_lorry_receipt (is_deleted) WHERE is_deleted = FALSE;

-- Row Level Security
ALTER TABLE fm_lorry_receipt ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select lorry receipts"
  ON fm_lorry_receipt FOR SELECT
  TO authenticated
  USING (is_deleted = FALSE);

CREATE POLICY "Authenticated users can insert lorry receipts"
  ON fm_lorry_receipt FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can update lorry receipts"
  ON fm_lorry_receipt FOR UPDATE
  TO authenticated
  USING (is_deleted = FALSE)
  WITH CHECK (TRUE);

CREATE POLICY "Authenticated users can soft-delete lorry receipts"
  ON fm_lorry_receipt FOR DELETE
  TO authenticated
  USING (is_deleted = FALSE);
