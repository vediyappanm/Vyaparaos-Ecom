import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { api } from "@/lib/db";

type Props = { open: boolean; onOpenChange: (b: boolean) => void; onDetected: (code: string) => void };

export const BarcodeScannerDialog = ({ open, onOpenChange, onDetected }: Props) => {
  const { tenant } = useTenant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const deviceLabel = devices.find((d) => d.deviceId === deviceId)?.label || null;

  const logTelemetry = async (payload: {
    code?: string | null;
    status: "success" | "failure";
    source?: "camera" | "manual";
    error_message?: string | null;
  }) => {
    if (!tenant?.id) return;
    try {
      await api.logScanEvent(tenant.id, {
        ...payload,
        device_id: deviceId || null,
        device_label: deviceLabel,
      });
    } catch {
      // non-blocking telemetry
    }
  };

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
        const supported: string[] = await Bd.getSupportedFormats();
        const preferred = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"];
        const formats = preferred.filter((f) => supported.includes(f));
        detector = new Bd({ formats: formats.length > 0 ? formats : supported });
        stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" }
        });
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
              void logTelemetry({ code, status: "success", source: "camera" });
              onDetected(code);
              try { navigator.vibrate?.(60); } catch { /* noop */ }
              onOpenChange(false);
              return;
            }
          } catch { /* ignore */ }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e: any) {
        setError(e.message ?? "Camera permission denied");
        void logTelemetry({ status: "failure", source: "camera", error_message: e?.message ?? "camera_error" });
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
  }, [open, onDetected, onOpenChange, deviceId]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (!deviceId && cams.length > 0) setDeviceId(cams[0].deviceId);
      } catch {
        setDevices([]);
      }
    })();
  }, [open, deviceId]);

  const submitManual = () => {
    const code = manualCode.trim();
    if (!code) return;
    void logTelemetry({ code, status: "success", source: "manual" });
    onDetected(code);
    onOpenChange(false);
    setManualCode("");
  };

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
        {devices.length > 1 && (
          <div className="space-y-1.5">
            <Label>Camera</Label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {devices.map((d, index) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Manual barcode entry</Label>
          <div className="flex gap-2">
            <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Type or paste barcode..." />
            <Button onClick={submitManual} disabled={!manualCode.trim()}>Use</Button>
          </div>
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}><X className="w-4 h-4 mr-2" />Close</Button>
      </DialogContent>
    </Dialog>
  );
};
