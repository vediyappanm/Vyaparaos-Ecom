import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, X } from "lucide-react";
import { toast } from "sonner";

type Props = { open: boolean; onOpenChange: (b: boolean) => void; onDetected: (code: string) => void };

export const BarcodeScannerDialog = ({ open, onOpenChange, onDetected }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let detector: any = null;
    let raf = 0;
    let cancelled = false;

    (async () => {
      setStarting(true); setError(null);
      try {
        if (!("BarcodeDetector" in window)) {
          throw new Error("Your browser doesn't support barcode scanning. Use a modern Chrome/Edge browser.");
        }
        const Bd: any = (window as any).BarcodeDetector;
        const formats = await Bd.getSupportedFormats();
        detector = new Bd({ formats });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0) {
              const code = codes[0].rawValue as string;
              onDetected(code);
              onOpenChange(false);
              return;
            }
          } catch { /* ignore */ }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e: any) {
        setError(e.message ?? "Camera permission denied");
        toast.error(e.message ?? "Camera failed");
      } finally {
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanLine className="w-4 h-4" /> Scan barcode</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-1 bg-accent shadow-glow animate-pulse" />
          {(starting || error) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-center p-4">
              {starting ? <Loader2 className="w-6 h-6 animate-spin" /> : <p className="text-sm">{error}</p>}
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}><X className="w-4 h-4 mr-2" />Close</Button>
      </DialogContent>
    </Dialog>
  );
};
