import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Search, Activity, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const actionColor: Record<string, string> = {
  created: "bg-success/10 text-success border-success/30",
  updated: "bg-primary/10 text-primary border-primary/30",
  deleted: "bg-destructive/10 text-destructive border-destructive/30",
  invited: "bg-accent/10 text-accent-foreground border-accent/30",
  removed: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function Audit() {
  const { data = [], isLoading } = useAuditLog();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => data.filter((e) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return e.summary?.toLowerCase().includes(t) || e.entity.toLowerCase().includes(t) ||
      e.action.toLowerCase().includes(t) || (e.user_name ?? "").toLowerCase().includes(t);
  }), [data, q]);

  return (
    <div className="px-4 lg:px-6 py-5 space-y-5 animate-fade-in">
      <PageHeader eyebrow="Security" title="Activity Log" description="Every important action across your business" />
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by user, action or entity…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground"><Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />No activity yet</div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <ul className="divide-y">
              {filtered.map((e) => (
                <li key={e.id} className="p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full gradient-royal text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {(e.user_name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{e.user_name ?? "System"}</span>
                        <Badge variant="outline" className={`text-[10px] capitalize ${actionColor[e.action] ?? ""}`}>{e.action}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">{e.entity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{e.summary}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
