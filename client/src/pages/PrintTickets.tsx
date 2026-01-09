import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Printer, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function PrintTickets() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const dateStr = params.get("date") || format(new Date(), "yyyy-MM-dd");

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: [api.tickets.list.path, { date: dateStr }],
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: [api.students.list.path],
  });

  if (ticketsLoading || studentsLoading) return <div className="p-8">Loading data...</div>;

  // Group tickets by class
  const ticketsByClass: Record<string, any[]> = {};

  if (ticketsData && studentsData) {
    ticketsData.forEach((ticket: any) => {
      const student = studentsData.find((s: any) => s.id === ticket.studentId);
      if (student) {
        const className = student.class || "Unknown";
        if (!ticketsByClass[className]) ticketsByClass[className] = [];
        ticketsByClass[className].push({ ...ticket, student });
      }
    });
  }

  const hasTickets = Object.keys(ticketsByClass).length > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Controls - Hidden during print */}
      <div className="p-4 border-b flex items-center justify-between bg-slate-50 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/reports")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="font-bold">Print Tickets - {dateStr}</h1>
        </div>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print All
        </Button>
      </div>

      {/* A4 Print Layout */}
      <div className="max-w-[210mm] mx-auto p-[10mm] print:p-0">
        {hasTickets ? (
          Object.entries(ticketsByClass).map(([className, classTickets]) => (
            <div key={className} className="mb-8 break-after-page">
              <h2 className="text-2xl font-bold mb-4 border-b-2 pb-2">Class: {className}</h2>
              <div className="grid grid-cols-2 gap-4">
                {classTickets.map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-dashed border-slate-300 p-4 flex flex-col items-center text-center h-[120mm] justify-center space-y-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold uppercase">{item.student.firstName} {item.student.lastName}</h3>
                      <p className="text-lg font-medium">Class: {item.student.class}</p>
                      <p className="text-sm text-muted-foreground font-mono">{item.student.studentId}</p>
                    </div>

                    <div className="p-2 bg-white border-2 border-black rounded-lg">
                      <QRCodeSVG
                        value={item.ticketId}
                        size={140}
                        level="H"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-lg">{format(new Date(item.date), "EEEE, MMM do")}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">Valid for Lunch Only</p>
                    </div>

                    <div className="pt-2 border-t w-full text-[10px] text-muted-foreground italic">
                      Ticket ID: {item.ticketId.split('-')[0]}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Printer className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No tickets found for {dateStr}</p>
            <p className="text-sm mt-1">Generate tickets from the reports page first.</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white;
          }
          .break-after-page {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
