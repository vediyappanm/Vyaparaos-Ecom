import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, X } from "lucide-react";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  aspect?: "square" | "wide";
};

export const ImageUpload = ({ value, onChange, folder = "products", label = "Image", aspect = "square" }: Props) => {
  const { tenant } = useTenant();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    if (!tenant) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Image only"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${tenant.id}/${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const box = aspect === "square" ? "h-32 w-32" : "h-32 w-full";

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className={`${box} rounded-md border bg-muted flex items-center justify-center overflow-hidden relative`}>
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute top-1 right-1 rounded-full bg-background/90 p-1 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2 flex-1">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
          />
          <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</> : "Upload image"}
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
        </div>
      </div>
    </div>
  );
};
