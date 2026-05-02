import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { analyzeBarcode, normalizeBarcode, recommendSmartCodes } from "@/lib/barcodeIntelligence";

type Props = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  product: any;
  allProducts: any[];
  onApplyBarcode?: (barcode: string, sku?: string) => void;
};

const formats = [
  { label: "EAN-13", value: "ean13" },
  { label: "Code 128", value: "code128" },
  { label: "Code 39", value: "code39" },
];

export const BarcodeGeneratorDialog = ({ open, onOpenChange, product, allProducts, onApplyBarcode }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState("");
  const [sku, setSku] = useState("");
  const [format, setFormat] = useState("ean13");
  const [busy, setBusy] = useState(false);
  const [renderReady, setRenderReady] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    const smart = recommendSmartCodes(product, allProducts);
    setCode(normalizeBarcode(product.barcode || smart.barcode));
    setSku(product.sku || smart.sku);
  }, [open, product, allProducts]);

  const analysis = useMemo(() => analyzeBarcode(code || ""), [code]);

  useEffect(() => {
    if (!open || !code || !canvasRef.current) return;
    setBusy(true);
    setRenderReady(false);
    import("bwip-js")
      .then((module) =>
        module.default.toCanvas(canvasRef.current!, {
          bcid: format,
          text: code,
          scale: 3,
          height: 12,
          includetext: true,
          textxalign: "center",
          backgroundcolor: "FFFFFF",
        })
      )
      .then(() => setRenderReady(true))
      .catch((error: Error) => {
        setRenderReady(false);
        toast.error(error.message || "Unable to generate barcode");
      })
      .finally(() => setBusy(false));
  }, [open, code, format]);

  const regenerate = () => {
    const smart = recommendSmartCodes(
      { ...product, sku, barcode: code },
      allProducts.filter((item) => item.id !== product?.id)
    );
    setCode(smart.barcode);
    if (!product?.sku) setSku(smart.sku);
  };

  const download = () => {
    if (!canvasRef.current || !code || !renderReady) {
      toast.error("Barcode is still rendering. Please try again in a moment.");
      return;
    }
    const source = canvasRef.current;
    const outCanvas = document.createElement("canvas");
    const pad = 24;
    outCanvas.width = source.width + pad * 2;
    outCanvas.height = source.height + pad * 2;
    const ctx = outCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    ctx.drawImage(source, pad, pad);

    const anchor = document.createElement("a");
    anchor.href = outCanvas.toDataURL("image/png");
    anchor.download = `${(product?.name || "product").replace(/[^a-z0-9]/gi, "_")}-barcode.png`;
    anchor.click();
    toast.success("Barcode downloaded");
  };

  const apply = () => {
    if (!code) {
      toast.error("Barcode value is required");
      return;
    }
    onApplyBarcode?.(normalizeBarcode(code), sku.trim() || undefined);
    toast.success("Barcode applied to product form");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Barcode Label Studio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Barcode value</Label>
              <Input value={code} onChange={(e) => setCode(normalizeBarcode(e.target.value))} placeholder="Enter barcode..." />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} placeholder="Internal SKU" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Barcode type</Label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {formats.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" onClick={regenerate}>
                <RefreshCcw className="w-4 h-4 mr-1.5" />
                AI Regenerate
              </Button>
              <Button type="button" onClick={download} disabled={!code || busy || !renderReady}>
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 bg-card">
            <div className="min-h-[132px] flex items-center justify-center bg-white rounded border border-dashed border-border">
              {busy ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <canvas ref={canvasRef} />}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={analysis.valid ? "default" : "destructive"}>{analysis.valid ? "Valid" : "Needs Attention"}</Badge>
              <Badge variant="outline">{analysis.format}</Badge>
            </div>
            {analysis.warnings.map((warning) => (
              <p key={warning} className="text-xs text-destructive">{warning}</p>
            ))}
            {analysis.suggestions.map((suggestion) => (
              <p key={suggestion} className="text-xs text-muted-foreground">{suggestion}</p>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={apply} disabled={!code}>Apply to Product</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
