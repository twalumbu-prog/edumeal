import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar as CalendarIcon, Printer, Play } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: reportData, isLoading } = useQuery({
    queryKey: [api.reports.eligibility.path, { date: dateStr }],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.tickets.generate.path, { date: dateStr });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.reports.eligibility.path] });
      toast({
        title: "Success",
        description: data.message,
      });
    },
  });

  const handleExport = () => {
    window.open(`${api.reports.export.path}?date=${dateStr}`, '_blank');
  };

  const handlePrint = () => {
    setLocation(`/tickets/print?date=${dateStr}`);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eligibility & Tickets</h1>
          <p className="text-muted-foreground">
            Generate and manage daily meal verification.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Generate Tickets
          </Button>

          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print Tickets
          </Button>

          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Eligibility List - {format(date, "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p>Loading report data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade/Class</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Meals Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used Today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData?.map((item: any) => (
                  <TableRow key={item.studentId}>
                    <TableCell className="font-medium">{item.studentId}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.grade} - {item.class}</TableCell>
                    <TableCell className="capitalize">{item.planType}</TableCell>
                    <TableCell>{item.mealsRemaining}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={item.status === 'valid' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.usedToday ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Yes {item.usedAt && `(${format(new Date(item.usedAt), "HH:mm")})`}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          No
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!reportData || reportData.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No student data found for this date.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
