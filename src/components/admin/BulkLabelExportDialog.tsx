import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { DbProduct } from "@/hooks/useProducts";
import { exportLabelSheetPdf, LABEL_TEMPLATES, type LabelSelection } from "@/lib/labelExport";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: DbProduct[];
};

export function BulkLabelExportDialog({ open, onOpenChange, products }: Props) {
  const [templateKey, setTemplateKey] = useState<keyof typeof LABEL_TEMPLATES>("a4_3up");
  const [copiesById, setCopiesById] = useState<Record<string, number>>({});
  const [exporting, setExporting] = useState(false);

  const selections = useMemo<LabelSelection[]>(
    () =>
      products.map((product) => ({
        product,
        copies: Math.max(1, Number(copiesById[product.id] ?? 1)),
      })),
    [copiesById, products]
  );

  const onExport = async () => {
    if (products.length === 0) return;
    try {
      setExporting(true);
      await exportLabelSheetPdf(selections, templateKey);
      toast.success("Label sheet exported");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to export labels");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Label Sheet</DialogTitle>
          <DialogDescription>{products.length} selected products</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template</Label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value as keyof typeof LABEL_TEMPLATES)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(LABEL_TEMPLATES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.name}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
            <div className="grid grid-cols-[1fr_96px] gap-3 p-3 border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <div>Product</div>
              <div>Copies</div>
            </div>
            {products.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_96px] gap-3 p-3 border-b border-border last:border-b-0">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.barcode || p.sku || "No barcode"}</div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={copiesById[p.id] ?? 1}
                  onChange={(e) =>
                    setCopiesById((prev) => ({
                      ...prev,
                      [p.id]: Math.max(1, Number(e.target.value || 1)),
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={onExport} disabled={exporting || products.length === 0} className="gradient-accent border-0 text-accent-foreground">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

