import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Sidebar } from "@/components/Sidebar";
import { useScanTicket, useManualOverride } from "@/hooks/use-tickets";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Search, Clock, ScanLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type ScanResponse } from "@shared/schema";

export default function TicketScanner() {
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [manualId, setManualId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const scanMutation = useScanTicket();
  const [scannerKey, setScannerKey] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    // Clear the reader div content
    const readerElement = document.getElementById('reader');
    if (readerElement) {
      readerElement.innerHTML = '';
    }
  }, []);

  const handleScan = useCallback(async (ticketId: string) => {
    try {
      const result = await scanMutation.mutateAsync({ ticketId });
      setScanResult(result);
      setHistory(prev => [result, ...prev].slice(0, 5));

      if (result.valid) {
        setTimeout(() => {
          setScanResult(null);
          setScannerKey(prev => prev + 1);
          setIsScanning(false);
        }, 2500);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to process ticket";
      setScanResult({ valid: false, message: errorMsg });
      toast({ title: "Scan Failed", description: errorMsg, variant: "destructive" });
    }
  }, [scanMutation, toast]);

  const startScanning = () => {
    setIsScanning(true);
    setScanResult(null);
  };

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      // Clear any existing content first
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.innerHTML = '';
      }

      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 20, 
          qrbox: { width: 280, height: 280 },
          showTorchButtonIfSupported: false,
          showZoomButtonIfSupported: false,
          defaultZoomValueIfSupported: 1,
          rememberLastUsedCamera: false,
        },
        false // verbose = false
      );

      scanner.render(
        (decodedText) => {
          handleScan(decodedText);
          stopScanning();
        },
        (error) => { }
      );

      scannerRef.current = scanner;

      // Hide all default UI elements that Html5QrcodeScanner adds
      const hideScannerUI = () => {
        const readerDiv = document.getElementById('reader');
        if (readerDiv) {
          // Hide all buttons, selects, labels
          readerDiv.querySelectorAll('button').forEach(btn => {
            (btn as HTMLElement).style.display = 'none';
          });
          readerDiv.querySelectorAll('select').forEach(sel => {
            (sel as HTMLElement).style.display = 'none';
          });
          readerDiv.querySelectorAll('label').forEach(lbl => {
            (lbl as HTMLElement).style.display = 'none';
          });
          
          // Hide spans with scanner UI text
          readerDiv.querySelectorAll('span').forEach(span => {
            const text = span.textContent || '';
            if (text.includes('Stop') || text.includes('Scanning') || text.includes('Camera') || text.includes('Select') || text.includes('File')) {
              (span as HTMLElement).style.display = 'none';
            }
          });
        }
      };

      // Hide UI immediately and on intervals
      hideScannerUI();
      const intervalId = setInterval(hideScannerUI, 100);
      
      // Store interval to clear later
      (scannerRef.current as any).__hideUIInterval = intervalId;
    }

    return () => {
      if (scannerRef.current) {
        // Clear interval if it exists
        if ((scannerRef.current as any).__hideUIInterval) {
          clearInterval((scannerRef.current as any).__hideUIInterval);
        }
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      // Clear reader content on unmount
      const readerElement = document.getElementById('reader');
      if (readerElement) {
        readerElement.innerHTML = '';
      }
    };
  }, [isScanning, scannerKey, handleScan, stopScanning]);

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(false);
    setScannerKey(prev => prev + 1);
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Glass morphism background effects - only on main content area */}
      <div className="absolute inset-0 md:left-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 flex flex-col items-center relative overflow-y-auto z-10">

        <div className="w-full max-w-lg space-y-8 pt-8 pb-12">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              Ticket Scanner
            </h1>
            <p className="text-slate-300">Scan a student QR code to verify meals</p>
          </header>

          <div className="relative group">
            {/* Glass morphism card */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden rounded-3xl relative h-[500px] backdrop-saturate-150">
              <CardContent className="p-6 h-full relative flex flex-col">
                {!scanResult ? (
                  <>
                    {/* Align QR Code text above camera */}
                    <div className="text-center mb-4 z-30 relative">
                      <p className="text-sm font-semibold text-white/90 tracking-widest uppercase drop-shadow-md">
                        Align QR Code
                      </p>
                    </div>

                    {/* Camera container */}
                    <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm border border-white/10">
                      {isScanning ? (
                        <>
                          <div 
                            id="reader" 
                            className="w-full h-full absolute inset-0 [&>div]:!shadow-none [&>div]:!border-none [&>div]:!bg-transparent"
                          />

                          {/* Viewfinder Overlay with scanning animation */}
                          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                            <div className="w-[280px] h-[280px] relative rounded-3xl border-2 border-white/30 shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                              {/* Scanning Line */}
                              <motion.div
                                className="absolute left-0 top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                              />
                              {/* Corner indicators */}
                              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center space-y-4 relative z-10">
                            <div className="mx-auto w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                              <ScanLine className="w-12 h-12 text-white/60" />
                            </div>
                            <p className="text-white/70 text-sm">Camera ready</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scan button below camera */}
                    <div className="mt-4 z-30 relative">
                      <Button
                        size="lg"
                        onClick={isScanning ? stopScanning : startScanning}
                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/50 backdrop-blur-sm border border-white/20"
                      >
                        {isScanning ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="mr-2"
                            >
                              <ScanLine className="w-5 h-5" />
                            </motion.div>
                            Scanning...
                          </>
                        ) : (
                          <>
                            <ScanLine className="w-5 h-5 mr-2" />
                            Start Scan
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center p-8 text-center backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20"
                    >
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className={`mb-6 h-24 w-24 rounded-full flex items-center justify-center ${scanResult.valid ? 'bg-green-100' : 'bg-red-100'
                          }`}
                      >
                        {scanResult.valid ? (
                          <CheckCircle2 className="w-12 h-12 text-green-600" />
                        ) : (
                          <XCircle className="w-12 h-12 text-red-600" />
                        )}
                      </motion.div>

                      <h2 className={`text-3xl font-bold mb-2 ${scanResult.valid ? 'text-green-300' : 'text-red-300'}`}>
                        {scanResult.valid ? "Authorized" : "Denied"}
                      </h2>
                      <p className="text-white/80 text-lg mb-8">{scanResult.message}</p>

                      {scanResult.student && (
                        <div className="backdrop-blur-md bg-white/10 border border-white/20 p-4 rounded-xl w-full text-left flex items-center gap-4 shadow-lg mb-6">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center font-bold text-lg text-blue-200">
                            {scanResult.student.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-white text-lg">{scanResult.student.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-400/30 backdrop-blur-sm">
                                {scanResult.student.mealsRemaining} Meals Left
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        size="lg"
                        className="w-full font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/50 backdrop-blur-sm border border-white/20"
                        onClick={resetScanner}
                      >
                        Scan Next Ticket
                      </Button>
                    </motion.div>
                  </AnimatePresence>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Scanned Today</p>
                  <p className="text-2xl font-bold text-white mt-1">{history.filter(h => h.valid).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center text-blue-200">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <form onSubmit={(e) => { e.preventDefault(); handleScan(manualId); setManualId(""); }} className="relative h-full">
              <Input
                placeholder="Enter ID manually..."
                className="backdrop-blur-xl bg-white/10 border-white/20 h-full min-h-[72px] rounded-xl pl-12 text-white placeholder:text-white/50 shadow-lg focus-visible:ring-blue-400 focus-visible:border-blue-400/50"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
            </form>
          </div>

          {/* Scan History Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <span className="text-xs text-white/60">verify scans</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {history.length > 0 ? history.map((h, i) => (
                  <motion.div
                    key={`${h.student?.name}-${i}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm border ${h.valid ? 'bg-green-500/20 text-green-200 border-green-400/30' : 'bg-red-500/20 text-red-200 border-red-400/30'}`}>
                        {h.valid ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white truncate max-w-[160px]">{h.student?.name || 'Manual Scan'}</p>
                        <p className="text-xs text-white/70 mt-0.5">{h.message}</p>
                      </div>
                    </div>
                    {h.student && (
                      <div className="text-right">
                        <span className="text-xs font-medium text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 px-2 py-1 rounded-md">
                          {h.student.mealsRemaining} left
                        </span>
                      </div>
                    )}
                  </motion.div>
                )) : (
                  <div className="text-center py-12 rounded-xl border-2 border-dashed border-white/20 backdrop-blur-xl bg-white/5">
                    <p className="text-sm text-white/60 font-medium">No scans in this session yet</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
