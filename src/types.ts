export interface LineItem {
  desc: string;
  qty: number;
  price: number;
  total?: number;
}

export interface DigitalTwinRegion {
  type: 'merchant' | 'items' | 'total' | 'date';
  label: string;
  x: number; // 0-100% relative X
  y: number; // 0-100% relative Y
  w: number; // 0-100% relative Width
  h: number; // 0-100% relative Height
}

export interface ReceiptData {
  merchant: string;
  merchantAddress?: string;
  taxId?: string;
  date?: string;
  time?: string;
  items: LineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;
  paymentMethod?: string;
  confidence?: number;
  digitalTwinRegions?: DigitalTwinRegion[];
}

export interface SamplePreset {
  id: string;
  name: string;
  label: string;
  imageUrl: string;
  data: ReceiptData;
}
