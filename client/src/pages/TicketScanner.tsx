import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Sidebar } from "@/components/Sidebar";
import { useScanTicket, useManualOverride } from "@/hooks/use-tickets";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type ScanResponse } from "@shared/schema";

export default function TicketScanner() {
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [manualId, setManualId] = useState("");
  const { toast } = useToast();
  const scanMutation = useScanTicket();
  const overrideMutation = useManualOverride();
  const [scannerKey, setScannerKey] = useState(0); // Force re-mount of scanner

  useEffect(() => {
    // Scanner initialization
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
        scanner.pause(true); // Pause after scan to show result
      },
      (error) => {
        // Handle scan error silently
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scannerKey]);

  const handleScan = async (ticketId: string) => {
    try {
      const result = await scanMutation.mutateAsync({ ticketId });
      setScanResult(result);
      
      if (result.valid) {
        // Auto-dismiss success after 3s and resume scanning
        setTimeout(() => {
          setScanResult(null);
          // Resume scanner logic would go here, simplified by remounting for now
          setScannerKey(prev => prev + 1); 
        }, 3000);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process ticket", variant: "destructive" });
      setScannerKey(prev => prev + 1); // Reset on error
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId) return;
    // For manual entry we treat it like a scan but could be an ID lookup
    handleScan(manualId); 
    setManualId("");
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannerKey(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-black/95 text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden absolute top-4 right-4 z-50">
           <Button variant="ghost" onClick={resetScanner} className="text-white hover:bg-white/10">
             <RefreshCw className="w-5 h-5" />
           </Button>
        </div>

        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold">Ticket Scanner</h1>
            <p className="text-gray-400">Align QR code within the frame</p>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden relative">
            <CardContent className="p-0 h-[400px] flex flex-col">
              {!scanResult ? (
                 <div id="reader" className="w-full h-full [&>div]:!shadow-none [&>div]:!border-none" />
              ) : (
                <div className={`h-full flex flex-col items-center justify-center p-8 text-center ${
                  scanResult.valid ? "bg-green-500/20" : "bg-red-500/20"
                }`}>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-6"
                  >
                    {scanResult.valid ? (
                      <CheckCircle2 className="w-24 h-24 text-green-500" />
                    ) : (
                      <XCircle className="w-24 h-24 text-red-500" />
                    )}
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold mb-2">
                    {scanResult.valid ? "Verified!" : "Access Denied"}
                  </h2>
                  <p className="text-xl text-white/80 mb-6">{scanResult.message}</p>
                  
                  {scanResult.student && (
                    <div className="bg-black/40 p-4 rounded-xl w-full text-left flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">
                        {scanResult.student.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{scanResult.student.name}</p>
                        <p className="text-sm opacity-70">
                          Meals Remaining: {scanResult.student.mealsRemaining}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 w-full">
                    <Button 
                      className="w-full h-12 text-lg font-semibold bg-white text-black hover:bg-white/90"
                      onClick={resetScanner}
                    >
                      Scan Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Entry Fallback */}
          <form onSubmit={handleManualSubmit} className="relative">
             <Input 
               placeholder="Enter Ticket ID manually..." 
               className="bg-zinc-900 border-zinc-800 h-12 pl-12 text-white placeholder:text-zinc-500"
               value={manualId}
               onChange={(e) => setManualId(e.target.value)}
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          </form>
        </div>
      </main>
    </div>
  );
}
