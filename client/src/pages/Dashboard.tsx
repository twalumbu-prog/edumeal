import { Sidebar } from "@/components/Sidebar";
import { StatsCards } from "@/components/StatsCards";
import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { data: stats, isLoading, isFetching, refetch, dataUpdatedAt } = useStats();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdate(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening today, {format(new Date(), "MMMM do")}.
              {lastUpdate && !isFetching && (
                <span className="ml-2 text-xs">
                  • Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </header>

        <StatsCards stats={stats} loading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2">
            <Card className="h-full border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Activity
                  </div>
                  {isFetching && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {stats?.recentLogs?.map((log) => (
                        <div key={log.id} className="flex gap-4 items-start group">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center shrink-0 border
                            ${log.type === 'scan' ? 'bg-green-50 border-green-100 text-green-600' :
                              log.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' :
                                'bg-blue-50 border-blue-100 text-blue-600'}
                          `}>
                            {log.type === 'scan' ? <Activity className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {log.type === 'scan' ? 'Meal Ticket Scanned' : 'System Event'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(log.details)}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider font-semibold">
                              {log.createdAt ? format(new Date(log.createdAt), "h:mm a") : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                      {!stats?.recentLogs?.length && (
                        <div className="text-center py-10 text-muted-foreground">
                          No recent activity recorded today.
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions / System Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-md bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium opacity-90">QuickBooks Sync</span>
                    <span className={`px-2 py-1 rounded bg-white/20 text-xs font-semibold ${!isLoading && stats?.recentLogs?.some(l => l.type === 'webhook') ? 'text-white' : 'text-white/60'}`}>
                      {isLoading ? 'Checking...' : stats?.recentLogs?.some(l => l.type === 'webhook') ? 'Active' : 'Standby'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium opacity-90">Scanner API</span>
                    <span className="px-2 py-1 rounded bg-white/20 text-xs font-semibold">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium opacity-90">Database</span>
                    <span className={`px-2 py-1 rounded bg-white/20 text-xs font-semibold ${!isLoading ? 'text-white' : 'text-white/60'}`}>
                      {isLoading ? 'Connecting...' : 'Connected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
