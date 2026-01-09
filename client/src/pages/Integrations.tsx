import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link2, Zap, Database, CheckCircle2, AlertCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function Integrations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: integrations, isLoading } = useQuery<any[]>({
        queryKey: ["/api/integrations"],
    });

    const { data: logsData, isLoading: logsLoading } = useQuery<any[]>({
        queryKey: ["/api/integrations/logs"],
    });

    const updateMutation = useMutation({
        mutationFn: async ({ name, status, settings }: { name: string; status?: string; settings?: any }) => {
            const res = await apiRequest("POST", `/api/integrations/${name}`, { status, settings });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
            toast({ title: "Updated", description: "Integration settings saved successfully." });
        },
    });

    const handleToggle = (name: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "inactive" : "active";
        updateMutation.mutate({ name, status: newStatus });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "URL copied to clipboard" });
    };

    const zapier = integrations?.find(i => i.name === 'zapier') || { status: 'inactive', settings: {} };
    const quickbooks = integrations?.find(i => i.name === 'quickbooks') || { status: 'inactive', settings: {} };

    const webhookUrl = `${window.location.origin}/api/webhooks/quickbooks`;

    return (
        <div className="flex min-h-screen bg-muted/20">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8">
                <header className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-foreground">Integrations</h1>
                    <p className="text-muted-foreground mt-1">
                        Connect EduMeal with your favorite tools to automate your workflow.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quickbooks Card */}
                    <Card className="border-none shadow-lg overflow-hidden group">
                        <div className="h-2 bg-gradient-to-r from-[#2CA01C] to-[#2CA01C]/50" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#2CA01C]/10 text-[#2CA01C]">
                                    <Database className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">QuickBooks Online</CardTitle>
                                    <CardDescription>Sync student payments automatically</CardDescription>
                                </div>
                            </div>
                            <Switch
                                checked={quickbooks.status === 'active'}
                                onCheckedChange={() => handleToggle('quickbooks', quickbooks.status)}
                            />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${quickbooks.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} />
                                    <span className="text-sm font-medium">
                                        Status: <span className="capitalize">{quickbooks.status}</span>
                                    </span>
                                </div>
                                {quickbooks.lastSync && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        Last Sync: {format(new Date(quickbooks.lastSync), "MMM d, h:mm a")}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <Link2 className="w-4 h-4 text-primary" />
                                    Webhook Endpoint URL
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={webhookUrl}
                                        readOnly
                                        className="bg-muted/30 border-dashed font-mono text-xs"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                                {window.location.hostname === 'localhost' && (
                                    <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px]">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>Warning: Zapier cannot reach "localhost". Use your public ngrok URL for live integrations.</span>
                                    </div>
                                )}
                                <p className="text-[11px] text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10 italic">
                                    Tip: Use this URL in Zapier to notify EduMeal of new QuickBooks payments.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="outline" className="flex-1 gap-2" asChild>
                                    <a href="https://quickbooks.intuit.com/app/apps" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                        Dashboard
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Zapier Card */}
                    <Card className="border-none shadow-lg overflow-hidden group">
                        <div className="h-2 bg-gradient-to-r from-[#FF4F00] to-[#FF4F00]/50" />
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#FF4F00]/10 text-[#FF4F00]">
                                    <Zap className="w-8 h-8" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Zapier</CardTitle>
                                    <CardDescription>Connect with 5000+ other apps</CardDescription>
                                </div>
                            </div>
                            <Switch
                                checked={zapier.status === 'active'}
                                onCheckedChange={() => handleToggle('zapier', zapier.status)}
                            />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${zapier.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} />
                                    <span className="text-sm font-medium">
                                        Status: <span className="capitalize">{zapier.status}</span>
                                    </span>
                                </div>
                                {zapier.lastSync && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        Last Event: {format(new Date(zapier.lastSync), "MMM d, h:mm a")}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold tracking-tight">API Access Key</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            value="••••••••••••••••"
                                            readOnly
                                            className="bg-muted/30 font-mono text-xs"
                                        />
                                        <Button variant="outline" size="sm">Regenerate</Button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex gap-4">
                                    <div className="p-2 rounded-lg bg-orange-100/50 h-fit">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-orange-900">Setup Instructions</h4>
                                        <p className="text-xs text-orange-800/80 mt-1 leading-relaxed">
                                            1. Go to your Zapier Dashboard<br />
                                            2. Create a new Zap and select "Webhooks by Zapier"<br />
                                            3. Use the EduMeal Webhook URL to send data here.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button variant="outline" className="flex-1 gap-2" asChild>
                                    <a href="https://zapier.com/app/zaps" target="_blank" rel="noopener noreferrer">
                                        <Zap className="w-4 h-4 fill-current" />
                                        Open Zapier
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Integration Logs / History */}
                <Card className="mt-8 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Recent Integration Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {logsLoading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading logs...</div>
                        ) : logsData && logsData.length > 0 ? (
                            <div className="space-y-4">
                                {logsData.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${log.type === 'webhook_attempt' ? 'bg-blue-100 text-blue-600' :
                                                    log.details?.success ? 'bg-green-100 text-green-600' :
                                                        'bg-red-100 text-red-600'
                                                }`}>
                                                {log.type === 'webhook_attempt' ? <Clock className="w-4 h-4" /> :
                                                    log.details?.success ? <CheckCircle2 className="w-4 h-4" /> :
                                                        <AlertCircle className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {log.type === 'webhook_attempt' ? 'Incoming Sync Attempt' :
                                                        log.details?.success ? 'Successful Payment Sync' : 'Sync Error'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Student: {log.details?.studentId || 'N/A'} • {log.details?.mealsAdded ? `${log.details.mealsAdded} meals added` : (log.details?.productType || 'Processing...')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            {format(new Date(log.createdAt), "HH:mm:ss, MMM d")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No recent synchronization events recorded.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
