import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Lazy-initialize Gemini client to avoid crashing if API key is not present during startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Real OCR uploads will fail. You can set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_BUILD",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with elevated limits for receipt base64 images
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Analyze receipt using gemini-3.5-flash
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing required fields: 'image' and 'mimeType'." });
      }

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({
          error: "Gemini API key is not configured. Please supply a valid GEMINI_API_KEY under Settings > Secrets to analyze custom receipts.",
          isMissingKey: true
        });
      }

      const ai = getGeminiClient();

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      };

      const textPart = {
        text: `Analyze the uploaded receipt image.
Perform a high-accuracy OCR parsing to extract:
1. Merchant/business name, full address, and tax/VAT ID.
2. The transaction date (format into readable, e.g. Oct 24, 2023 or YYYY-MM-DD) and time.
3. Every single line item purchased with description, quantity, unit price, and item total (make sure item total mathematically aligns with qty * unit price).
4. Subtotal, tax, final total, currency code (e.g. USD, EUR, GBP), and payment method used (Cash, Card, etc.).
5. Provide a global confidence rating (0-100) based on readability.
6. Generate 3 to 6 logical coordinates in percentage (0-100) of items inside the receipt (e.g., MERCHANT_NAME at top, LINE_ITEMS in middle, TOTAL_AMOUNT at bottom) relative to the image size. This will be used to show a visual digital twin bounding highlight.`,
      };

      const receiptSchema = {
        type: Type.OBJECT,
        properties: {
          merchant: { type: Type.STRING, description: "Name of the merchant" },
          merchantAddress: { type: Type.STRING, description: "Address of the merchant" },
          taxId: { type: Type.STRING, description: "Tax / VAT ID if present" },
          date: { type: Type.STRING, description: "Date of invoice/receipt" },
          time: { type: Type.STRING, description: "Time of transaction" },
          items: {
            type: Type.ARRAY,
            description: "Detailed list of item transactions",
            items: {
              type: Type.OBJECT,
              properties: {
                desc: { type: Type.STRING, description: "Item description" },
                qty: { type: Type.NUMBER, description: "Quantity" },
                price: { type: Type.NUMBER, description: "Price per unit" },
                total: { type: Type.NUMBER, description: "Line item total amount" },
              },
              required: ["desc", "qty", "price"],
            },
          },
          subtotal: { type: Type.NUMBER, description: "Subtotal" },
          tax: { type: Type.NUMBER, description: "Tax amount" },
          total: { type: Type.NUMBER, description: "Calculated final total" },
          currency: { type: Type.STRING, description: "Currency (e.g., USD, EUR, GBP)" },
          paymentMethod: { type: Type.STRING, description: "Method of payment" },
          confidence: { type: Type.NUMBER, description: "Assessment level of certainty from 0 to 100" },
          digitalTwinRegions: {
            type: Type.ARRAY,
            description: "Representative bounding areas in percent (0-100) relative to top-left of image",
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "One of: 'merchant', 'items', 'total', 'date'" },
                label: { type: Type.STRING, description: "Tag label like MERCHANT_NAME, LINE_ITEMS, TOTAL_AMOUNT, ISSUE_DATE" },
                x: { type: Type.NUMBER, description: "X percentage from top-left (0-100)" },
                y: { type: Type.NUMBER, description: "Y percentage from top-left (0-100)" },
                w: { type: Type.NUMBER, description: "Width percentage (0-100)" },
                h: { type: Type.NUMBER, description: "Height percentage (0-100)" },
              },
              required: ["type", "label", "x", "y", "w", "h"],
            },
          },
        },
        required: ["merchant", "total", "items", "currency"],
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: "You are an expert OCR receipt parsing intelligence. Your goal is to parse receipts with absolute physical and mathematical accuracy, outputting structured JSON according to the required schema.",
          responseMimeType: "application/json",
          responseSchema: receiptSchema,
          temperature: 0.1,
        },
      });

      if (!response.text) {
        throw new Error("Empty response received from Gemini API.");
      }

      const parsedJSON = JSON.parse(response.text.trim());
      return res.json(parsedJSON);

    } catch (err: any) {
      console.error("Receipt analysis error:", err);
      return res.status(500).json({
        error: err.message || "An error occurred while parsing the receipt using Gemini AI.",
      });
    }
  });

  // Handle health check
  app.get("/api/health", (_req, res) => {
    const geminiConfigured = !!process.env.GEMINI_API_KEY;
    res.json({
      status: "ok",
      time: new Date().toISOString(),
      geminiConfigured,
    });
  });

  // Vite development middleware vs Static Production files
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RECEPTA backend server listening on http://localhost:${PORT}`);
  });
}

startServer();
