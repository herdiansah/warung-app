import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import { X, ScanLine, Camera } from "lucide-react";

type ScannerStatus = {
  kind: "found" | "notfound";
  message: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<ScannerStatus>;
};

const SCAN_COOLDOWN_MS = 1200;

export default function CameraScanner({ open, onClose, onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<IScannerControls | null>(null);
  const [started, setStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [status, setStatus] = useState<ScannerStatus | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const stopScanner = () => {
    const controls = scannerRef.current;
    scannerRef.current = null;
    setStarted(false);
    try {
      if (controls) controls.stop();
    } catch {
      /* stream already released */
    }
    // Explicitly stop any tracks so the camera light turns off immediately
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (!open) return;
    setCameraError(null);
    setStatus(null);
    setManualCode("");

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader(
      new Map([[DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
        BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
      ]]])
    );

    const onDecode = (code: string) => {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.code === code && now - last.at < SCAN_COOLDOWN_MS) return;
      lastScanRef.current = { code, at: now };
      onScan(code).then((s) => {
        if (cancelled) return;
        setStatus(s);
        setFlashKey((k) => k + 1);
      });
    };

    reader
      .decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: "environment" } } },
        video,
        (result) => {
          if (result) onDecode(result.getText());
        }
      )
      .then((controls) => {
        if (cancelled) {
          try { controls.stop(); } catch { /* noop */ }
          return;
        }
        scannerRef.current = controls;
        setStarted(true);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg = (err && err.name) || "";
        if (msg === "NotAllowedError") {
          setCameraError("Akses kamera ditolak. Izinkan akses kamera di browser lalu coba lagi.");
        } else if (msg === "NotFoundError") {
          setCameraError("Tidak ada kamera terdeteksi di perangkat ini.");
        } else if (msg === "NotReadableError") {
          setCameraError("Kamera sedang dipakai aplikasi lain. Tutup aplikasi lain lalu coba lagi.");
        } else if (msg === "SecurityError") {
          setCameraError("Kamera butuh koneksi aman (HTTPS atau localhost) untuk diakses.");
        } else {
          setCameraError("Gagal mengakses kamera: " + (err?.message || "kesalahan tidak diketahui"));
        }
        stopScanner();
      });

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open]);

  const handleManualScan = async () => {
    const code = manualCode.trim();
    if (!code || manualBusy) return;
    setManualBusy(true);
    const s = await onScan(code);
    setStatus(s);
    setFlashKey((k) => k + 1);
    setManualCode("");
    setManualBusy(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="camera-modal">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Scan Barcode Kamera</h2>
          </div>
          <button
            type="button"
            data-testid="camera-close"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera feed */}
        <div className="p-4 space-y-3">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-square max-h-[320px] mx-auto w-full">
            <video ref={videoRef} muted playsInline className="w-full h-full object-contain" data-testid="camera-video" />
            {!started && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                <span className="animate-pulse">Menyalakan kamera...</span>
              </div>
            )}
            {/* Corner guides */}
            <div className="absolute inset-6 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
            </div>
            {status && (
              <div
                key={flashKey}
                className={`absolute inset-x-0 bottom-0 text-center py-2 text-sm font-bold animate-fade-in ${
                  status.kind === "found" ? "bg-emerald-600/90 text-white" : "bg-red-500/90 text-white"
                }`}
              >
                {status.message}
              </div>
            )}
          </div>

          {cameraError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm font-semibold">{cameraError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 text-red-600 text-xs font-semibold underline"
              >
                Muat ulang halaman
              </button>
            </div>
          )}

          {started && !cameraError && (
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <ScanLine className="w-3.5 h-3.5" />
              Arahkan barcode ke kamera
            </p>
          )}

          {/* Manual fallback */}
          <div className="flex gap-2 pt-1">
            <input
              data-testid="camera-manual"
              type="text"
              placeholder="Atau ketik kode barcode lalu Enter"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleManualScan(); } }}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-sm"
            />
            <button
              type="button"
              data-testid="camera-manual-submit"
              onClick={handleManualScan}
              disabled={manualBusy || !manualCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Cari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
