import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Printer, ChevronLeft, LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function PrintTickets() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const dateStr = params.get("date") || format(new Date(), "yyyy-MM-dd");

  const [ticketsPerPage, setTicketsPerPage] = useState(12);
  const [groupByClass, setGroupByClass] = useState(true);

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<any[]>({
    queryKey: [api.tickets.list.path, { date: dateStr }],
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: [api.students.list.path],
  });

  if (ticketsLoading || studentsLoading) return <div className="p-8">Loading data...</div>;

  // Prepare and chunk tickets
  let pages: { title: string; tickets: any[] }[] = [];

  if (ticketsData && studentsData) {
    const enrichedTickets = ticketsData.map(ticket => ({
      ...ticket,
      student: studentsData.find(s => s.id === ticket.studentId)
    })).filter(t => t.student);

    if (groupByClass) {
      const ticketsByClass: Record<string, any[]> = {};
      enrichedTickets.forEach(ticket => {
        const className = ticket.student.class || "Unknown";
        if (!ticketsByClass[className]) ticketsByClass[className] = [];
        ticketsByClass[className].push(ticket);
      });

      Object.entries(ticketsByClass).forEach(([className, classTickets]) => {
        for (let i = 0; i < classTickets.length; i += ticketsPerPage) {
          pages.push({
            title: `Class: ${className}${classTickets.length > ticketsPerPage ? ` (Part ${Math.floor(i / ticketsPerPage) + 1})` : ""}`,
            tickets: classTickets.slice(i, i + ticketsPerPage)
          });
        }
      });
    } else {
      for (let i = 0; i < enrichedTickets.length; i += ticketsPerPage) {
        pages.push({
          title: `Batch ${Math.floor(i / ticketsPerPage) + 1}`,
          tickets: enrichedTickets.slice(i, i + ticketsPerPage)
        });
      }
    }
  }

  const handlePrint = () => {
    window.print();
  };

  // Layout calculations
  const cols = ticketsPerPage <= 4 ? 2 : 3;
  const rows = Math.ceil(ticketsPerPage / cols);
  // A4 content height is approx 277mm (297 - 20mm margins)
  const ticketHeight = Math.floor(270 / rows);
  const qrSize = ticketsPerPage > 8 ? 80 : 120;
  const fontSize = ticketsPerPage > 8 ? 'text-sm' : 'text-base';
  const nameSize = ticketsPerPage > 8 ? 'text-base' : 'text-xl';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Controls - Hidden during print */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between bg-white sticky top-0 z-10 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation("/reports")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-bold hidden sm:block">Print Setup - {dateStr}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Density:</span>
            <select
              value={ticketsPerPage}
              onChange={(e) => setTicketsPerPage(Number(e.target.value))}
              className="bg-slate-100 border-none rounded-md px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-primary"
            >
              <option value={4}>4 per page (Large)</option>
              <option value={6}>6 per page</option>
              <option value={8}>8 per page</option>
              <option value={12}>12 per page (Optimal)</option>
              <option value={15}>15 per page (Compact)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Group by Class:</span>
            <Button
              variant={groupByClass ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByClass(!groupByClass)}
              className="h-8"
            >
              {groupByClass ? <LayoutGrid className="w-4 h-4 mr-1" /> : <List className="w-4 h-4 mr-1" />}
              {groupByClass ? "On" : "Off"}
            </Button>
          </div>

          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      {/* A4 Print Layout */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl my-8 print:my-0 print:shadow-none min-h-[297mm]">
        {pages.length > 0 ? (
          pages.map((page, pIdx) => (
            <div key={pIdx} className="p-[10mm] border-b border-dashed last:border-0 print:border-0 print:p-0 break-after-page min-h-[297mm]">
              <div className="print:hidden mb-4 bg-slate-100 p-2 rounded flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">{page.title}</span>
                <span className="text-xs text-slate-400">Page {pIdx + 1} of {pages.length}</span>
              </div>

              <div className={`grid grid-cols-${cols} gap-2`}>
                {page.tickets.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-200 flex flex-col items-center text-center justify-center p-2 overflow-hidden border-dashed"
                    style={{ height: `${ticketHeight}mm` }}
                  >
                    <div className="mb-2">
                      <h3 className={`${nameSize} font-bold uppercase truncate max-w-[180px]`}>
                        {item.student.firstName} {item.student.lastName}
                      </h3>
                      <p className={`${fontSize} font-medium`}>{item.student.class || "No Class"}</p>
                    </div>

                    <div className="p-1 bg-white border border-black rounded">
                      <QRCodeSVG
                        value={item.ticketId}
                        size={qrSize}
                        level="M"
                      />
                    </div>

                    <div className="mt-2">
                      <p className={`font-bold ${fontSize}`}>{format(new Date(item.date), "MMM do, yyyy")}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Valid: Lunch Only</p>
                    </div>

                    <div className="mt-auto pt-1 w-full text-[8px] text-muted-foreground border-t border-slate-100">
                      ID: {item.ticketId.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-40 text-slate-400">
            <Printer className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No tickets ready for printing.</p>
            <Button variant="link" onClick={() => setLocation("/reports")}>Go to Reports</Button>
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
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .break-after-page {
            page-break-after: always;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        /* Tailwind doesn't always generate dynamic grid classes if not explicitly present */
        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      `}</style>
    </div>
  );
}
