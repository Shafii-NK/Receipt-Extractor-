import { SamplePreset } from "../types";

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: "premium-coffee",
    name: "Standard Coffee Roasters",
    label: "Standard Coffee Specialty Cafè",
    imageUrl: "Specialty, minimal coffee shop ticket with custom services.",
    data: {
      merchant: "Standard Coffee",
      merchantAddress: "108 Grand St, Brooklyn, NY 11249",
      taxId: "TX-902-110",
      date: "October 24, 2023",
      time: "09:14 AM",
      items: [
        { desc: "Pour Over (Eth)", qty: 1, price: 6.50, total: 6.50 },
        { desc: "Avocado Toast", qty: 2, price: 12.00, total: 24.00 },
        { desc: "Service Charge", qty: 1, price: 1.95, total: 1.95 }
      ],
      subtotal: 30.50,
      tax: 1.95,
      total: 32.45,
      currency: "USD",
      paymentMethod: "Apple Pay (Visa *4920)",
      confidence: 99.4,
      digitalTwinRegions: [
        { type: "merchant", label: "MERCHANT_NAME", x: 10, y: 4, w: 80, h: 12 },
        { type: "date", label: "ISSUE_DATE", x: 10, y: 18, w: 80, h: 10 },
        { type: "items", label: "LINE_ITEMS", x: 8, y: 32, w: 84, h: 36 },
        { type: "total", label: "TOTAL_AMOUNT", x: 10, y: 72, w: 80, h: 14 }
      ]
    }
  },
  {
    id: "metro-grocery",
    name: "Metro Grocery Mart",
    label: "Local Organic Food & Produce Market",
    imageUrl: "Traditional grocery ledger receipt with tax break downs.",
    data: {
      merchant: "Metro Grocery Mart",
      merchantAddress: "450 Parliament St, Toronto, ON M4X 1S2",
      taxId: "HST-821-3990-RT01",
      date: "June 08, 2026",
      time: "06:45 PM",
      items: [
        { desc: "Organic Whole Milk 1L", qty: 1, price: 4.89, total: 4.89 },
        { desc: "Sourdough Boule", qty: 1, price: 6.50, total: 6.50 },
        { desc: "Fresh Strawberries 1lb", qty: 2, price: 4.99, total: 9.98 },
        { desc: "Avocados (Bag of 5)", qty: 1, price: 7.99, total: 7.99 },
        { desc: "Organic Baby Spinach", qty: 2, price: 3.50, total: 7.00 },
        { desc: "Chicken Breast Family Pack", qty: 1, price: 28.50, total: 28.50 },
        { desc: "Eco Reusable Tote Bag", qty: 1, price: 2.25, total: 2.25 }
      ],
      subtotal: 67.11,
      tax: 7.01,
      total: 74.12,
      currency: "CAD",
      paymentMethod: "Debit Card (Interac *1120)",
      confidence: 98.1,
      digitalTwinRegions: [
        { type: "merchant", label: "MERCHANT_NAME", x: 8, y: 5, w: 84, h: 10 },
        { type: "date", label: "ISSUE_DATE", x: 12, y: 18, w: 76, h: 8 },
        { type: "items", label: "LINE_ITEMS", x: 6, y: 28, w: 88, h: 42 },
        { type: "total", label: "TOTAL_AMOUNT", x: 8, y: 73, w: 84, h: 12 }
      ]
    }
  },
  {
    id: "stellar-dining",
    name: "L'Étoile French Bistro",
    label: "Upscale Fine Dining and Wine Receipt",
    imageUrl: "Elegant, narrow double-line restaurant final bill ticket.",
    data: {
      merchant: "L'Étoile Bistro",
      merchantAddress: "14 Rue de la Paix, 75002 Paris",
      taxId: "FR-901-3820-22",
      date: "May 15, 2026",
      time: "09:30 PM",
      items: [
        { desc: "Chef's Tasting Menu Duo", qty: 2, price: 65.00, total: 130.00 },
        { desc: "Chablis Premier Cru 'Climat'", qty: 1, price: 42.00, total: 42.00 },
        { desc: "Faceted Mineral Water", qty: 2, price: 6.25, total: 12.50 }
      ],
      subtotal: 184.50,
      tax: 0.00,
      total: 184.50,
      currency: "EUR",
      paymentMethod: "Credit Card (Amex *8801)",
      confidence: 99.7,
      digitalTwinRegions: [
        { type: "merchant", label: "MERCHANT_NAME", x: 12, y: 6, w: 76, h: 14 },
        { type: "date", label: "ISSUE_DATE", x: 15, y: 22, w: 70, h: 8 },
        { type: "items", label: "LINE_ITEMS", x: 10, y: 34, w: 80, h: 32 },
        { type: "total", label: "TOTAL_AMOUNT", x: 12, y: 68, w: 76, h: 16 }
      ]
    }
  }
];
