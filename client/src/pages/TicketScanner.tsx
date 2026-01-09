import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Sidebar } from "@/components/Sidebar";
import { useScanTicket, useManualOverride } from "@/hooks/use-tickets";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Search, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type ScanResponse } from "@shared/schema";

export default function TicketScanner() {
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [history, setHistory] = useState<ScanResponse[]>([]);
  const [manualId, setManualId] = useState("");
  const { toast } = useToast();
  const scanMutation = useScanTicket();
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 20, qrbox: { width: 280, height: 280 } },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
        scanner.pause(true);
      },
      (error) => { }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [scannerKey]);

  const handleScan = async (ticketId: string) => {
    try {
      const result = await scanMutation.mutateAsync({ ticketId });
      setScanResult(result);
      setHistory(prev => [result, ...prev].slice(0, 5));

      if (result.valid) {
        setTimeout(() => {
          setScanResult(null);
          setScannerKey(prev => prev + 1);
        }, 2500);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to process ticket";
      setScanResult({ valid: false, message: errorMsg });
      toast({ title: "Scan Failed", description: errorMsg, variant: "destructive" });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setScannerKey(prev => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 flex flex-col items-center relative overflow-y-auto text-slate-900">

        <div className="w-full max-w-lg space-y-8 pt-8 pb-12">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Ticket Scanner
            </h1>
            <p className="text-slate-500">Scan a student QR code to verify meals</p>
          </header>

          <div className="relative group">
            <Card className="bg-white border-slate-200 shadow-xl overflow-hidden rounded-3xl relative h-[420px]">
              <CardContent className="p-0 h-full relative">
                {!scanResult ? (
                  <>
                    <div id="reader" className="w-full h-full [&>div]:!shadow-none [&>div]:!border-none" />

                    {/* Viewfinder Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                      <div className="w-[280px] h-[280px] relative rounded-3xl border-2 border-white/20 shadow-[0_0_0_1000px_rgba(255,255,255,0.9)]">
                        {/* Scanning Line */}
                        <motion.div
                          className="absolute left-0 top-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute top-4 left-0 w-full text-center text-xs font-semibold text-blue-500 tracking-widest uppercase opacity-80">
                          Align QR Code
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center p-8 text-center bg-white"
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

                      <h2 className={`text-3xl font-bold mb-2 ${scanResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                        {scanResult.valid ? "Authorized" : "Denied"}
                      </h2>
                      <p className="text-slate-500 text-lg mb-8">{scanResult.message}</p>

                      {scanResult.student && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl w-full text-left flex items-center gap-4 shadow-sm mb-6">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-lg text-blue-700">
                            {scanResult.student.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">{scanResult.student.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                                {scanResult.student.mealsRemaining} Meals Left
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        size="lg"
                        className="w-full font-semibold rounded-xl"
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
            <Card className="border-none shadow-sm bg-white">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scanned Today</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{history.filter(h => h.valid).length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <form onSubmit={(e) => { e.preventDefault(); handleScan(manualId); setManualId(""); }} className="relative h-full">
              <Input
                placeholder="Enter ID manually..."
                className="bg-white border-slate-200 h-full min-h-[72px] rounded-xl pl-12 text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:ring-blue-500"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            </form>
          </div>

          {/* Scan History Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <span className="text-xs text-slate-400">verify scans</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {history.length > 0 ? history.map((h, i) => (
                  <motion.div
                    key={`${h.student?.name}-${i}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${h.valid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {h.valid ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[160px]">{h.student?.name || 'Manual Scan'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{h.message}</p>
                      </div>
                    </div>
                    {h.student && (
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          {h.student.mealsRemaining} left
                        </span>
                      </div>
                    )}
                  </motion.div>
                )) : (
                  <div className="text-center py-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-sm text-slate-400 font-medium">No scans in this session yet</p>
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
