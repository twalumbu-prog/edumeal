import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [date, setDate] = useState<Date>(new Date());
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: reportData, isLoading } = useQuery({
    queryKey: [api.reports.eligibility.path, { date: dateStr }],
  });

  const handleExport = () => {
    window.open(`${api.reports.export.path}?date=${dateStr}`, '_blank');
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eligibility Report</h1>
          <p className="text-muted-foreground">
            View and export student eligibility and ticket usage.
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
