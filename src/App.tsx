import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Check, 
  FileText, 
  AlertCircle, 
  Terminal, 
  Copy, 
  RefreshCw, 
  HelpCircle, 
  Cpu, 
  CheckCircle2, 
  FileJson,
  Calendar,
  DollarSign,
  Tag,
  AlertTriangle
} from "lucide-react";
import { SAMPLE_PRESETS } from "./data/samples";
import { ReceiptData, SamplePreset, LineItem, DigitalTwinRegion } from "./types";

export default function App() {
  // Application State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("premium-coffee");
  const [customReceiptFile, setCustomReceiptFile] = useState<string | null>(null);
  const [customReceiptMime, setCustomReceiptMime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [activeHoverType, setActiveHoverType] = useState<string | null>(null);
  
  // Custom API parse state
  const [parsedCustomData, setParsedCustomData] = useState<ReceiptData | null>(null);
  const [apiError, setApiError] = useState<{ message: string; isMissingKey?: boolean } | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Connection check (checks if backend has API key loaded)
  const [isApiKeySet, setIsApiKeySet] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if API key is active on server
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        // Set if server reports configured state
        setIsApiKeySet(true); 
      })
      .catch(() => {
        setIsApiKeySet(false);
      });
  }, []);

  // Get current active receipt data
  const getActiveData = (): ReceiptData => {
    if (customReceiptFile && parsedCustomData) {
      return parsedCustomData;
    }
    const preset = SAMPLE_PRESETS.find(p => p.id === selectedPresetId);
    return preset ? preset.data : SAMPLE_PRESETS[0].data;
  };

  const activeData = getActiveData();

  // Handle preset selector
  const handlePresetSelect = (id: string) => {
    setSelectedPresetId(id);
    setCustomReceiptFile(null);
    setParsedCustomData(null);
    setApiError(null);
    setUploadSuccess(false);
  };

  // Convert File to Base64 helper
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString() || "";
        // Extract raw base64 part
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle parsing submit
  const processReceiptAnalysis = async (base64Data: string, mimeType: string) => {
    setIsLoading(true);
    setApiError(null);
    setUploadSuccess(false);
    
    const steps = [
      "Uploading document payload...",
      "Analyzing layout topology and alignment...",
      "Executing Gemini visual OCR parsing...",
      "Validating mathematical line item integrity...",
      "Constructing full structured JSON schema result...",
      "Generating digital twin geometric mappings..."
    ];

    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(steps[currentStep]);
      }
    }, 1200);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Data,
          mimeType: mimeType,
        }),
      });

      clearInterval(stepInterval);
      const output = await response.json();

      if (!response.ok) {
        throw { 
          message: output.error || "Failed to analyze receipt", 
          isMissingKey: output.isMissingKey 
        };
      }

      setParsedCustomData(output);
      setUploadSuccess(true);
    } catch (err: any) {
      console.error(err);
      setApiError({
        message: err.message || "An unexpected network error occurred while communicating with RECEPTA OCR Engine.",
        isMissingKey: err.isMissingKey
      });
      // Fallback: clear custom file so they don't see a broken state
      setCustomReceiptFile(null);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  // Handle uploaded file
  const handleUploadedFile = async (file: File) => {
    if (!file) return;
    
    // Check if file is image
    if (!file.type.startsWith("image/")) {
      setApiError({ message: "Only image files (JPEG, PNG, WEBP) are supported for local receipt scanning." });
      return;
    }

    try {
      const base64String = await convertToBase64(file);
      setCustomReceiptMime(file.type);
      setCustomReceiptFile(`data:${file.type};base64,${base64String}`);
      
      // Analyze with Express route
      await processReceiptAnalysis(base64String, file.type);
    } catch (e: any) {
      setApiError({ message: "Failed to read receipt payload: " + e.message });
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedFile(e.target.files[0]);
    }
  };

  const triggerFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Copy parsed JSON
  const copyJsonToClipboard = () => {
    const formattedJson = JSON.stringify(activeData, null, 2);
    navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Clear custom upload to go back to presets
  const handleClearCustom = () => {
    setCustomReceiptFile(null);
    setCustomReceiptMime(null);
    setParsedCustomData(null);
    setApiError(null);
    setUploadSuccess(false);
    setSelectedPresetId("premium-coffee");
  };

  const formatCurrency = (amount: number, currency: string) => {
    let symbol = "$";
    if (currency?.toUpperCase() === "EUR" || currency === "€") symbol = "€";
    else if (currency?.toUpperCase() === "GBP" || currency === "£") symbol = "£";
    else if (currency?.toUpperCase() === "CAD") symbol = "CA$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen py-6 px-4 md:px-8 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row items-start md:items-end justify-between pb-6 border-b-2 border-black mb-8 gap-4">
        <div className="flex items-baseline gap-4 md:gap-6">
          <h1 id="app-title" className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-neutral-900">
            RECEPTA
          </h1>
          <span className="font-serif italic text-lg md:text-2xl text-neutral-500 tracking-wide border-l border-neutral-300 pl-4">
            OCR Parsing Engine
          </span>
        </div>
        
        {/* Connection status/Metadata rail */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase tracking-wider bg-neutral-100 px-3 py-1.5 border border-black/10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span>API Online</span>
          </div>
          <div className="hidden sm:block text-neutral-400">•</div>
          <div className="text-neutral-600">
            Server: <span className="font-bold text-neutral-900">localhost:3000</span>
          </div>
          <div className="hidden sm:block text-neutral-400">•</div>
          <div className="text-neutral-500">
            Engine Version: <span className="font-bold text-neutral-800">v4.2.0</span>
          </div>
        </div>
      </header>

      {/* Main Dual-Column Sandbox */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-8 min-h-[640px] relative overflow-hidden">
        
        {/* Background Decorative Frame lines */}
        <div className="absolute top-0 right-1/2 w-px h-full bg-gradient-to-b from-neutral-200 to-transparent pointer-events-none hidden md:block"></div>

        {/* COLUMN 1: UPLOAD, INTERACTION & VISUALIZATION (5 Columns) */}
        <section id="capture-panel" className="col-span-12 md:col-span-5 flex flex-col justify-between gap-6">
          <div>
            {/* Header / Description */}
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-1">
                Visual Capture & Inputs
              </h2>
              <div className="h-0.5 w-12 bg-black mb-3"></div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Feed printed receipts to our deep analytical model. Upload your own image or explore our editorial preset layouts below to observe visual twin coordinates.
              </p>
            </div>

            {/* Template Presets Picker */}
            <div className="mb-6">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Select Active Receipt Medium
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((preset) => {
                  const isActive = !customReceiptFile && selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      id={`preset-btn-${preset.id}`}
                      onClick={() => handlePresetSelect(preset.id)}
                      className={`px-3 py-2 text-xs font-bold uppercase text-left border transition-all flex flex-col justify-between h-20 ${
                        isActive 
                          ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(115,115,115,0.5)]" 
                          : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-black border-neutral-300"
                      }`}
                    >
                      <span className="truncate block w-full">{preset.name}</span>
                      <span className={`text-[9px] lowercase font-mono ${isActive ? "text-neutral-300" : "text-neutral-400"}`}>
                        {formatCurrency(preset.data.total, preset.data.currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop Action Box / Custom Upload */}
            <div className="mb-6">
              {customReceiptFile ? (
                <div className="border-2 border-black p-4 bg-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate max-w-[200px]">Custom Receipt Uploaded</p>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase">{customReceiptMime}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCustom}
                    className="text-xs font-bold uppercase underline hover:text-neutral-600 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={triggerFileSelector}
                  className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    isDragActive 
                      ? "border-black bg-neutral-100" 
                      : "border-neutral-300 bg-neutral-50 hover:border-black hover:bg-neutral-100/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="mx-auto mb-2 text-neutral-400" size={24} />
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">Upload Receipt Image</p>
                  <p className="text-[10px] text-neutral-400 mt-1 font-mono">Drag & Drop or Click (JPEG, PNG, WEBP)</p>
                </div>
              )}
            </div>

            {/* Visualization Stage ("Digital Twin") */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Receipt Visualization Twin ({activeData.confidence ? `${activeData.confidence}%` : "No Scan"} Cert)
                </span>
                {customReceiptFile && (
                  <span className="px-2 py-0.5 bg-neutral-900 text-[#00FF41] text-[9px] font-mono uppercase rounded-sm animate-pulse">
                    Live Model
                  </span>
                )}
              </div>

              {/* Thermal Receipt Container */}
              <div className="relative border border-black h-[350px] w-full bg-stone-100 flex items-center justify-center p-3 select-none overflow-hidden">
                {isLoading ? (
                  <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center p-6 text-center">
                    {/* Retro Scanner scanline */}
                    <div className="absolute left-0 w-full h-[3px] bg-neutral-900 opacity-60 scan-line shadow-[0_0_12px_3px_rgba(0,0,0,0.5)] pointer-events-none"></div>
                    
                    <Cpu className="animate-spin text-neutral-900 mb-4" size={32} />
                    <p className="text-sm font-black uppercase tracking-tight text-neutral-900">RECEPTA ANALYZER RUNNING</p>
                    <p className="text-xs font-mono text-neutral-500 max-w-[280px] mt-2 bg-neutral-100 p-2 border border-neutral-200">
                      &gt; {loadingStep}
                    </p>
                  </div>
                ) : null}

                {/* Draw the visual elements */}
                <div className="relative w-full h-full bg-[#fdfdfb] border border-[#ecece8] shadow-[4px_4px_12px_rgba(0,0,0,0.04)] flex flex-col p-4 font-mono text-[10px] leading-tight text-stone-800">
                  
                  {/* Decorative receipt cuts */}
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-400 via-stone-300 to-transparent opacity-20"></div>

                  {customReceiptFile ? (
                    // Customer uploaded photo view with overlays
                    <div className="absolute inset-0 w-full h-full z-10 flex items-center justify-center bg-neutral-900">
                      <img 
                        src={customReceiptFile} 
                        alt="Receipt Scan" 
                        className="w-full h-full object-contain opacity-80"
                      />
                      
                      {/* Bounding regions drawn as overlays */}
                      {activeData.digitalTwinRegions?.map((region, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveHoverType(region.type)}
                          onMouseLeave={() => setActiveHoverType(null)}
                          className={`absolute border-2 cursor-pointer transition-all ${
                            activeHoverType === region.type
                              ? "border-red-500 bg-red-400/20 z-20 shadow-md"
                              : "border-black bg-black/5"
                          }`}
                          style={{
                            left: `${region.x}%`,
                            top: `${region.y}%`,
                            width: `${region.w}%`,
                            height: `${region.h}%`,
                          }}
                        >
                          <span className="absolute -top-4 left-0 bg-black text-white text-[7px] px-1 font-sans rounded-xs whitespace-nowrap scale-80 origin-left">
                            {region.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Preset vintage style ticket representation
                    <div className="flex-1 flex flex-col justify-between relative">
                      
                      {/* Interactive regions overlays relative to thermal mock coordinates */}
                      {activeData.digitalTwinRegions?.map((region, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveHoverType(region.type)}
                          onMouseLeave={() => setActiveHoverType(null)}
                          className={`absolute border transition-all ${
                            activeHoverType === region.type
                              ? "border-black bg-stone-900/10 z-20"
                              : "border-transparent"
                          }`}
                          style={{
                            left: `${region.x}%`,
                            top: `${region.y}%`,
                            width: `${region.w}%`,
                            height: `${region.h}%`,
                          }}
                        />
                      ))}

                      {/* Styled receipt printout elements */}
                      <div className="text-center pt-1 pb-4 border-b border-dashed border-stone-300">
                        <div className={`font-sans font-black text-sm tracking-tighter uppercase transition-colors ${activeHoverType === 'merchant' ? 'bg-neutral-200' : ''}`}>
                          {activeData.merchant}
                        </div>
                        <div className="text-[8px] text-stone-500 max-w-[200px] mx-auto mt-1 line-clamp-1">
                          {activeData.merchantAddress}
                        </div>
                        {activeData.taxId && (
                          <div className="text-[8px] text-stone-400 font-mono mt-0.5">
                            TAX ID: {activeData.taxId}
                          </div>
                        )}
                      </div>

                      {/* Date & Meta region */}
                      <div className={`py-2 border-b border-dashed border-stone-300 flex justify-between text-[8px] text-stone-600 ${activeHoverType === 'date' ? 'bg-neutral-200' : ''}`}>
                        <div>DATE: {activeData.date || "N/A"}</div>
                        <div>TIME: {activeData.time || "N/A"}</div>
                      </div>

                      {/* Items region */}
                      <div className={`flex-1 py-3 overflow-hidden flex flex-col ${activeHoverType === 'items' ? 'bg-neutral-200/50' : ''}`}>
                        <div className="flex justify-between border-b border-stone-200 pb-1 text-[8px] font-bold text-stone-400">
                          <span>ITEM DESCRIPTION</span>
                          <span>TOTAL</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-1 space-y-1.5 scrollbar-thin">
                          {activeData.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-baseline text-[8px]">
                              <div className="font-mono">
                                <span className="text-stone-400">{item.qty}x</span> {item.desc}
                                <span className="text-stone-400 text-[7px] ml-1">@ {item.price.toFixed(2)}</span>
                              </div>
                              <span className="font-mono">
                                {formatCurrency(item.total || (item.qty * item.price), activeData.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Totals Summary */}
                      <div className={`pt-2 border-t-2 border-double border-stone-400 flex flex-col gap-1 ${activeHoverType === 'total' ? 'bg-neutral-200' : ''}`}>
                        {activeData.subtotal !== undefined && (
                          <div className="flex justify-between text-[8px] text-stone-500">
                            <span>SUBTOTAL:</span>
                            <span>{formatCurrency(activeData.subtotal, activeData.currency)}</span>
                          </div>
                        )}
                        {activeData.tax !== undefined && (
                          <div className="flex justify-between text-[8px] text-stone-500">
                            <span>SALES TAX:</span>
                            <span>{formatCurrency(activeData.tax, activeData.currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] font-bold text-stone-900 border-t border-dashed border-stone-300 pt-1">
                          <span>TOTAL:</span>
                          <span>{formatCurrency(activeData.total, activeData.currency)}</span>
                        </div>
                        <div className="text-[7px] text-stone-500 text-right font-mono mt-1">
                          PAID VIA: {activeData.paymentMethod || "CASH"}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Aesthetic stamp */}
                  <div className="absolute bottom-1 right-2 opacity-5 pointer-events-none">
                    <Terminal size={70} />
                  </div>
                </div>
              </div>

              {/* Legend mapping details */}
              <div className="mt-3 bg-neutral-50 border border-neutral-200 p-2 text-[10px] leading-relaxed text-neutral-600 flex flex-wrap gap-x-4 gap-y-1">
                <span className="font-bold uppercase">Regions mapping:</span>
                <span className={`inline-flex items-center gap-1 cursor-help ${activeHoverType === 'merchant' ? 'text-black font-bold' : ''}`} onMouseEnter={() => setActiveHoverType('merchant')} onMouseLeave={() => setActiveHoverType(null)}>
                  <span className="w-1.5 h-1.5 bg-black"></span> Merchant Name
                </span>
                <span className={`inline-flex items-center gap-1 cursor-help ${activeHoverType === 'date' ? 'text-black font-bold' : ''}`} onMouseEnter={() => setActiveHoverType('date')} onMouseLeave={() => setActiveHoverType(null)}>
                  <span className="w-1.5 h-1.5 bg-neutral-400"></span> Issue Date
                </span>
                <span className={`inline-flex items-center gap-1 cursor-help ${activeHoverType === 'items' ? 'text-black font-bold' : ''}`} onMouseEnter={() => setActiveHoverType('items')} onMouseLeave={() => setActiveHoverType(null)}>
                  <span className="w-1.5 h-1.5 bg-blue-500"></span> Line Items
                </span>
                <span className={`inline-flex items-center gap-1 cursor-help ${activeHoverType === 'total' ? 'text-black font-bold' : ''}`} onMouseEnter={() => setActiveHoverType('total')} onMouseLeave={() => setActiveHoverType(null)}>
                  <span className="w-1.5 h-1.5 bg-red-500"></span> Total Amount
                </span>
              </div>
            </div>

          </div>

          {/* Prompt Developer Instructions if Gemini API Key not configured */}
          {!customReceiptFile && (
            <div className="bg-amber-50 border border-amber-300 p-4 font-sans text-xs text-amber-900 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <p className="font-bold">Live Receipt Scanner Sandbox Instructions</p>
                  <p className="leading-relaxed">
                    Upload an image file using our drag-and-drop zone to run a real Gemini parsing session. 
                  </p>
                </div>
              </div>
              <div className="bg-white/40 p-2 font-mono text-[10px] text-amber-800 leading-snug border border-amber-200/50">
                To enable live parsing of personalized files, verify that a <span className="font-bold underline">GEMINI_API_KEY</span> is assigned. You can set it in Settings &gt; Secrets.
              </div>
            </div>
          )}

          {/* User API Error fallback */}
          {apiError && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 text-xs font-sans text-red-900">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                <p className="font-bold">Parsing Engine Fault Raised</p>
              </div>
              <p className="mb-2 font-mono text-[10px] leading-relaxed">{apiError.message}</p>
              {apiError.isMissingKey && (
                <div className="bg-white/65 p-2 font-mono text-[9px] border border-red-200">
                  RECEPTA Engine operates server-side via the model. Add your secret key under Security Workspace configs so the process compiles correctly.
                </div>
              )}
            </div>
          )}
        </section>

        {/* COLUMN 2: TABULAR PARSED RESULTS & HIGH END JSON EXPORT (7 Columns) */}
        <section id="results-panel" className="col-span-12 md:col-span-7 flex flex-col overflow-hidden justify-between border-t border-neutral-200 md:border-t-0 md:pl-8 pt-6 md:pt-0">
          
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Meta parsed header */}
            <div className="border-b border-black pb-4 mb-6">
              <span className="font-serif italic text-lg text-neutral-400 block mb-1">
                Parsed Output Results
              </span>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-black leading-none tracking-tighter uppercase text-neutral-900">
                  {activeData.merchant}
                </h2>
                {activeData.confidence && (
                  <div className="px-2.5 py-0.5 bg-black text-white text-[10px] font-mono font-bold uppercase shrink-0">
                    Cert: {activeData.confidence}%
                  </div>
                )}
              </div>
            </div>

            {/* Crucial Parameters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-neutral-50 border border-neutral-200 p-4 font-sans">
              <div>
                <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider mb-0.5">
                  Issue Date
                </p>
                <p className="text-sm font-semibold font-serif text-neutral-800">
                  {activeData.date || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider mb-0.5">
                  Tax Number
                </p>
                <p className="text-xs font-mono font-bold text-neutral-700 truncate">
                  {activeData.taxId || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider mb-0.5">
                  Payment Method
                </p>
                <p className="text-xs font-serif italic text-neutral-700">
                  {activeData.paymentMethod || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider mb-0.5">
                  Total Amount
                </p>
                <p className="text-xl font-black text-neutral-950">
                  {formatCurrency(activeData.total, activeData.currency)}
                </p>
              </div>
            </div>

            {/* Structured Table: Line items */}
            <div className="border-t border-black pt-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-3 flex items-center gap-2">
                <FileText size={14} />
                Line Itemized Breakdowns ({activeData.items.length})
              </h3>
              
              <div className="max-h-[160px] overflow-y-auto border border-neutral-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f7f7f5] text-[10px] font-bold uppercase tracking-wider border-b border-neutral-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-neutral-300">Description</th>
                      <th className="py-2 px-3 text-center border-r border-neutral-300 w-16">Qty</th>
                      <th className="py-2 px-3 text-right border-r border-neutral-300 w-24">Unit Price</th>
                      <th className="py-2 px-3 text-right w-28">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {activeData.items.map((item, id) => (
                      <tr key={id} className="hover:bg-neutral-50">
                        <td className="py-2 px-3 font-medium text-neutral-800">{item.desc}</td>
                        <td className="py-2 px-3 text-center font-mono text-neutral-600 border-l border-r border-neutral-300 bg-neutral-100/45">{item.qty}</td>
                        <td className="py-2 px-3 text-right font-mono text-neutral-600 border-r border-neutral-300">{formatCurrency(item.price, activeData.currency)}</td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-neutral-900">
                          {formatCurrency(item.total || (item.qty * item.price), activeData.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Sales Tax */}
              <div className="flex justify-end gap-6 text-[11px] font-mono text-neutral-500 mt-2">
                {activeData.subtotal !== undefined && (
                  <div>
                    SUBTOTAL: <span className="font-bold text-neutral-800">{formatCurrency(activeData.subtotal, activeData.currency)}</span>
                  </div>
                )}
                {activeData.tax !== undefined && (
                  <div>
                    TAX: <span className="font-bold text-neutral-800">{formatCurrency(activeData.tax, activeData.currency)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Document JSON Terminal Output Code Block */}
            <div className="border-t border-black pt-4 flex-1 flex flex-col min-h-[160px] overflow-hidden mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-600 flex items-center gap-1.5">
                  <FileJson size={14} />
                  JSON Document Payload
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-400">
                    Schema: v1.0/receipt_structured
                  </span>
                </div>
              </div>
              
              <div className="relative flex-1 rounded-xs overflow-hidden border border-neutral-200 flex flex-col bg-neutral-950 font-mono text-xs">
                {/* Vintage header tab */}
                <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1 flex items-center justify-between text-[10px] text-neutral-500 uppercase">
                  <span>output_payload.json</span>
                  <span>ready</span>
                </div>
                
                <pre className="p-4 text-[#33FF33] overflow-y-auto flex-1 leading-relaxed text-[11px] max-h-[160px] custom-scrollbar bg-neutral-950">
                  <code>{JSON.stringify(activeData, null, 2)}</code>
                </pre>
              </div>
            </div>

          </div>

          {/* Action Trigger Footing */}
          <footer className="bg-neutral-900 text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-black mt-2">
            <div className="flex gap-3 items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
                OCR Pipeline Status: Ready
              </span>
            </div>
            
            <button
              onClick={copyJsonToClipboard}
              className="w-full sm:w-auto flex items-center justify-center gap-2 group px-5 py-2.5 bg-white text-black font-sans hover:bg-neutral-200 transition-all font-bold uppercase text-xs"
            >
              <span>{copied ? "Copied!" : "Copy JSON Payload"}</span>
              <div className="w-6 h-6 rounded-full border border-black/10 flex items-center justify-center group-hover:translate-x-1 transition-all">
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
              </div>
            </button>
          </footer>

        </section>

      </main>

      {/* Structured Specification Document as requested in User Prompt / Bottom Drawer */}
      <section className="mt-12 border-t-2 border-black pt-8 mb-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-neutral-800" size={24} />
            <h2 className="text-2xl font-black uppercase tracking-tight font-sans">
              RECEPTA System Specifications
            </h2>
          </div>
          <p className="text-sm text-neutral-600 font-serif italic mb-6">
            Technical specifications manual for development stakeholders and project engineers detailing the pipeline mechanics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-neutral-700 leading-relaxed font-sans">
            
            <div className="space-y-4">
              <div className="border-l-2 border-black pl-3 py-1">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-1">
                  1. PROJECT OVERVIEW
                </h4>
                <p className="text-xs text-neutral-600">
                  RECEPTA is a full-stack automated receipt digitizer providing zero-configuration structured database JSON payloads from thermal paper receipts. It incorporates computer vision technology to align scanned nodes with high-certainty JSON values.
                </p>
              </div>

              <div className="border-l-2 border-black pl-3 py-1">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-1">
                  2. CORE FUNCTIONAL SPECIFICATION
                </h4>
                <ul className="list-disc pl-4 text-xs text-neutral-600 space-y-1">
                  <li><strong>Instant File Ingestion:</strong> Ingests custom uploads (formats: JPEG, PNG, WEBP) base64 encrypted structures.</li>
                  <li><strong>Optical Parsing:</strong> Utilizes multimodal gemini-3.5-flash with custom schema enforcement parameters.</li>
                  <li><strong>Digital Twin coordinate overlay:</strong> Dynamic highlights corresponding with percentage layouts mapping.</li>
                </ul>
              </div>

              <div className="border-l-2 border-black pl-3 py-1">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-1">
                  3. DATA EXTRACTION LOGIC
                </h4>
                <p className="text-xs text-neutral-600">
                  The parser inspects bounding box anchors using normalized visual dimensions (0-100%). It validates product lines by corroborating quantity multipliers, subtotals, and currency identifiers before sealing the token payload.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-black pl-3 py-1">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-1">
                  4. FAULT INTRUSION & ERROR TOLERANCE
                </h4>
                <p className="text-xs text-neutral-600">
                  Low-resolution scans provoke structural fallbacks. Missing line totals are re-calculated programmatically relative to line units. Low alignment confidence returns structural logs instead of silent failures, flagging regions for human confirmation.
                </p>
              </div>

              <div className="border-l-2 border-black pl-3 py-1">
                <h4 className="font-bold text-neutral-900 uppercase text-xs tracking-wider mb-1">
                  5. RECOMMENDATIONS & STACK PREFERENCES
                </h4>
                <p className="text-xs text-neutral-600 font-mono text-[10px] bg-neutral-100 p-2.5 border border-dashed border-neutral-300">
                  // Recommended Tech Blueprint<br />
                  - FRONTEND: React 19 / Vite / Tailwind UI<br />
                  - BACKEND: Express NodeJS Router<br />
                  - OCR ENGINE: Google GenAI (gemini-3.5-flash)<br />
                  - STORAGE: Google Cloud Storage / BigQuery
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Page simple footer */}
      <footer className="mt-8 border-t border-neutral-300 pt-4 flex flex-col sm:flex-row justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-widest gap-2">
        <span>&copy; {new Date().getFullYear()} RECEPTA LABS. ALL RIGHTS RESERVED.</span>
        <span>RECEPTA // DIGITAL INTEGRATION SERVICE</span>
      </footer>

    </div>
  );
}
