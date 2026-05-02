import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

type Props = { open: boolean; onOpenChange: (b: boolean) => void; product?: any };

export const QRCodeGenerator = ({ open, onOpenChange, product }: Props) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrPngDataUrl, setQrPngDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [qrContent, setQrContent] = useState("");

  useEffect(() => {
    if (open && product) {
      generateQRCode();
    }
  }, [open, product]);

  const generateQRCode = async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      // Create product data for QR code
      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        barcode: product.barcode || "",
        price: product.price,
        tenant: product.tenant_id
      };
      
      const qrContent = JSON.stringify(productData);
      setQrContent(qrContent);
      
      // Generate QR code with error handling
      const qrDataUrl = await QRCode.toDataURL(qrContent, {
        margin: 2,
        width: 512,
        color: { dark: "#000000", light: "#FFFFFF" },
        errorCorrectionLevel: 'M'
      });
      
      setQrDataUrl(qrDataUrl);
      setQrPngDataUrl(qrDataUrl);
      toast.success("QR code generated successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrPngDataUrl) return;
    
    try {
      const link = document.createElement("a");
      const fileName = `${product?.name || "product"}-qrcode.png`.replace(/[^a-zA-Z0-9.-]/g, '_');
      link.download = fileName;
      link.href = qrPngDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR code downloaded successfully");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Failed to download QR code");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Product QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {product && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                SKU: {product.sku || "N/A"} | Price: ₹{product.price}
              </p>
              {product.barcode && (
                <p className="text-sm text-muted-foreground">
                  Barcode: {product.barcode}
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : qrDataUrl ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <img 
                    src={qrDataUrl} 
                    alt="Product QR Code" 
                    className="border-2 border-border rounded-lg shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">QR Code Data:</p>
                <div className="text-xs text-muted-foreground break-all font-mono bg-background p-2 rounded border">
                  {qrContent}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={downloadQR} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download QR Code
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(qrContent)}
                  className="px-3"
                >
                  Copy Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No QR code generated</p>
              <p className="text-xs mt-1">Please try again</p>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)}>
          <X className="w-4 h-4 mr-2" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
