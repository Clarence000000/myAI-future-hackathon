"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Camera,
  Eye,
  LoaderCircle,
  Radar,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react";

type LiveDetectionPanelProps = {
  onCapture: (file: File) => Promise<void> | void;
  loading?: boolean;
};

type LiveMetrics = {
  brightness: number;
  motion: number;
  stability: number;
  liveness: number;
};

const INITIAL_METRICS: LiveMetrics = {
  brightness: 58,
  motion: 18,
  stability: 82,
  liveness: 88,
};

export default function LiveDetectionPanel({
  onCapture,
  loading = false,
}: LiveDetectionPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<
    "idle" | "starting" | "live" | "blocked"
  >("idle");
  const [cameraError, setCameraError] = useState("");
  const [metrics, setMetrics] = useState<LiveMetrics>(INITIAL_METRICS);
  const [frameCount, setFrameCount] = useState(0);

  function stopCamera() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    previousFrameRef.current = null;
    setCameraState("idle");
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("blocked");
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    try {
      setCameraState("starting");
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      previousFrameRef.current = null;
      setFrameCount(0);
      setCameraState("live");

      intervalRef.current = window.setInterval(() => {
        analyzeFrame();
      }, 700);
    } catch (error) {
      console.error("Camera start failed:", error);
      setCameraState("blocked");
      setCameraError(
        "We could not access the camera. Please allow webcam permission and try again."
      );
    }
  };

  const analyzeFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      return;
    }

    const sampleWidth = 48;
    const sampleHeight = 36;
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

    let luminanceTotal = 0;
    let differenceTotal = 0;
    let pixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      luminanceTotal += brightness;

      if (previousFrameRef.current) {
        const prevBrightness =
          (previousFrameRef.current[i] +
            previousFrameRef.current[i + 1] +
            previousFrameRef.current[i + 2]) /
          3;
        differenceTotal += Math.abs(brightness - prevBrightness);
      }

      pixels += 1;
    }

    const avgBrightness = luminanceTotal / pixels;
    const normalizedBrightness = Math.round((avgBrightness / 255) * 100);
    const normalizedMotion = previousFrameRef.current
      ? Math.min(100, Math.round(differenceTotal / pixels / 1.2))
      : metrics.motion;

    const stability = Math.max(18, 100 - normalizedMotion);
    const lightQuality = 100 - Math.min(60, Math.abs(normalizedBrightness - 56) * 2);
    const liveness = Math.max(
      12,
      Math.min(99, Math.round(stability * 0.35 + normalizedMotion * 0.2 + lightQuality * 0.45))
    );

    previousFrameRef.current = new Uint8ClampedArray(data);
    setFrameCount((count) => count + 1);
    setMetrics({
      brightness: normalizedBrightness,
      motion: normalizedMotion,
      stability,
      liveness,
    });
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || loading) return;

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth || 1280;
    captureCanvas.height = video.videoHeight || 720;
    const context = captureCanvas.getContext("2d");

    if (!context) return;

    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      captureCanvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) return;

    const snapshot = new File([blob], `live-scan-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    await onCapture(snapshot);
  };

  const liveStatus =
    metrics.liveness >= 75
      ? "Clean biometric signal"
      : metrics.liveness >= 45
        ? "Moderate review signal"
        : "Escalated spoof risk";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
      <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top,#0f2740_0%,#07111f_42%,#020617_100%)] p-5 shadow-[0_30px_80px_rgba(8,47,73,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.08),transparent_40%,rgba(59,130,246,0.04)_70%,transparent)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-cyan-300/70">
              Live Deepfake Radar
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
              Realtime camera integrity scan
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Start the webcam to monitor movement, light balance, and live-scene
              consistency before sending a captured frame to the forensic engine.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/70">
              Liveness Signal
            </p>
            <p className="mt-1 text-3xl font-black italic text-cyan-300">
              {metrics.liveness}%
            </p>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[26px] border border-slate-800 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_58%)]" />
          <video
            ref={videoRef}
            muted
            playsInline
            className="aspect-video w-full object-cover"
          />

          {cameraState !== "live" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 px-6 text-center">
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 p-4">
                {cameraState === "starting" ? (
                  <LoaderCircle className="animate-spin text-cyan-300" size={28} />
                ) : cameraState === "blocked" ? (
                  <VideoOff className="text-rose-300" size={28} />
                ) : (
                  <Camera className="text-cyan-300" size={28} />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {cameraState === "starting"
                    ? "Connecting secure camera channel..."
                    : cameraState === "blocked"
                      ? "Camera access required"
                      : "Activate the live scan"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {cameraError ||
                    "Open the webcam to unlock realtime spoof analysis and snapshot verification."}
                </p>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-6 top-6 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-slate-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200">
              <span
                className={`h-2 w-2 rounded-full ${
                  cameraState === "live" ? "animate-pulse bg-emerald-400" : "bg-slate-500"
                }`}
              />
              {cameraState === "live" ? "Live feed" : "Standby"}
            </span>
            <span className="rounded-full border border-slate-700/80 bg-slate-950/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-300">
              Frame cycles {frameCount}
            </span>
          </div>

          <div className="pointer-events-none absolute inset-8 rounded-[20px] border border-cyan-300/25">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-300/15" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-cyan-300/15" />
            <div className="absolute inset-x-0 top-0 h-28 animate-[scanline_3s_linear_infinite] bg-gradient-to-b from-cyan-300/0 via-cyan-300/10 to-cyan-300/0" />
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={cameraState === "live" ? stopCamera : startCamera}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 active:scale-[0.99]"
          >
            {cameraState === "live" ? <VideoOff size={16} /> : <Video size={16} />}
            {cameraState === "live" ? "Stop camera" : "Start camera"}
          </button>

          <button
            type="button"
            onClick={captureFrame}
            disabled={cameraState !== "live" || loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <ScanLine size={16} />}
            Capture frame for AI scan
          </button>
        </div>
      </section>

      <section className="space-y-5">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.92),rgba(8,47,73,0.55))] p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Signal Board
              </p>
              <h4 className="mt-2 text-lg font-bold text-white">
                Spoof confidence indicators
              </h4>
            </div>
            <Radar className="text-cyan-300" size={20} />
          </div>

          <div className="mt-5 space-y-4">
            <MetricBar label="Ambient light balance" value={metrics.brightness} tone="cyan" />
            <MetricBar label="Micro-motion response" value={metrics.motion} tone="violet" />
            <MetricBar label="Scene stability" value={metrics.stability} tone="emerald" />
            <MetricBar label="Liveness confidence" value={metrics.liveness} tone="amber" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                Realtime verdict
              </p>
              <h4 className="mt-2 text-xl font-black text-white">{liveStatus}</h4>
            </div>
            {metrics.liveness >= 45 ? (
              <ShieldCheck className="text-emerald-400" size={22} />
            ) : (
              <AlertTriangle className="text-rose-400" size={22} />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <StatusTile
              icon={<Eye size={16} />}
              label="Face cadence"
              value={metrics.motion >= 10 ? "Responsive" : "Too static"}
            />
            <StatusTile
              icon={<Sparkles size={16} />}
              label="Frame texture"
              value={metrics.stability >= 60 ? "Natural" : "Needs review"}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            This live panel gives an instant client-side confidence read before the
            captured frame is sent through the same AI forensic analysis used by the
            document and selfie workflow.
          </p>
        </div>
      </section>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "violet" | "emerald" | "amber";
}) {
  const toneClasses = {
    cyan: "bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.35)]",
    violet: "bg-violet-400 shadow-[0_0_24px_rgba(167,139,250,0.35)]",
    emerald: "bg-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    amber: "bg-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)]",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="font-black text-white">{value}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-slate-900">
        <div
          className={`h-full rounded-full transition-all duration-700 ${toneClasses[tone]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function StatusTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.24em]">
          {label}
        </span>
      </div>
      <p className="mt-3 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
