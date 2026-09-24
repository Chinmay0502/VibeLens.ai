import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Sparkles,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  FileText,
  Layers,
  Send,
  Bot,
  User,
  Loader2,
  ChevronRight,
  Globe,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  CheckSquare,
  GraduationCap,
  Briefcase,
  Video,
  Database,
  Terminal,
  Compass,
  Flame,
  Activity,
  Download,
  Search,
  Volume2,
  Lock,
  XCircle,
} from "lucide-react";

/* =========================================================
   BACKEND CONFIGURATION
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:7860"
).replace(/\/$/, "");

/* =========================================================
   BACKEND PIPELINE STAGES
========================================================= */

const PIPELINE_STEPS = [
  {
    id: "downloading",
    title: "Getting Your Media",
    shortTitle: "Media",
    desc: "Downloading the source and preparing the audio stream.",
    icon: Video,
  },
  {
    id: "audio_processing",
    title: "Processing Audio",
    shortTitle: "Audio",
    desc: "Normalizing audio to mono 16 kHz and creating processing chunks.",
    icon: Volume2,
  },
  {
    id: "transcribing",
    title: "Transcribing Audio",
    shortTitle: "Transcript",
    desc: "Converting speech into text with Groq Whisper or Sarvam AI.",
    icon: FileText,
  },
  {
    id: "generating_title",
    title: "Understanding the Meeting",
    shortTitle: "Understanding",
    desc: "Generating a concise title from the transcript.",
    icon: Sparkles,
  },
  {
    id: "generating_summary",
    title: "Building Executive Summary",
    shortTitle: "Summary",
    desc: "Turning the transcript into clear, structured insights.",
    icon: Layers,
  },
  {
    id: "extracting_actions",
    title: "Finding Action Items",
    shortTitle: "Actions",
    desc: "Identifying tasks, owners, responsibilities, and deadlines.",
    icon: CheckSquare,
  },
  {
    id: "extracting_decisions",
    title: "Finding Key Decisions",
    shortTitle: "Decisions",
    desc: "Identifying decisions and agreements made during the meeting.",
    icon: ShieldCheck,
  },
  {
    id: "extracting_questions",
    title: "Finding Open Questions",
    shortTitle: "Questions",
    desc: "Finding unresolved topics and required follow-ups.",
    icon: HelpCircle,
  },
  {
    id: "building_rag",
    title: "Building Meeting Memory",
    shortTitle: "AI Memory",
    desc: "Indexing the transcript so you can chat with your meeting.",
    icon: Database,
  },
];

/* =========================================================
   MOCK RESULT
   Used only before the first real analysis.
========================================================= */

const MOCK_RESULT = {
  title: "Your meeting intelligence will appear here",
  sourceUrl: "",
  language: "English",
  duration: "—",
  summary: [
    "Run an analysis to generate an executive summary from your real transcript.",
    "The summary, action items, decisions, and questions will be populated by the backend.",
  ],
  action_items: [],
  key_decisions: [],
  open_questions: [],
  transcript: "Your real transcript will appear here after processing.",
};

/* =========================================================
   SUGGESTED QUESTIONS
========================================================= */

const SUGGESTED_QUESTIONS = [
  "What are the main takeaways?",
  "Summarize action items and deadlines",
  "What decisions were made?",
  "What questions remain unresolved?",
];

/* =========================================================
   PARTICLE BACKGROUND
========================================================= */

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);

            ctx.strokeStyle = `rgba(245, 158, 11, ${
              0.12 * (1 - dist / 130)
            })`;

            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
}

/* =========================================================
   FORMAT ELAPSED TIME
========================================================= */

function formatElapsed(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

/* =========================================================
   PARSE LIST RESPONSE
========================================================= */

function parseList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ""));
}

/* =========================================================
   PARSE ACTION ITEMS
========================================================= */

function parseActionItems(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return {
            task: item,
            owner: "Not specified",
            deadline: "Not specified",
          };
        }

        return {
          task:
            item?.task ||
            item?.action ||
            item?.description ||
            "Task",
          owner:
            item?.owner ||
            item?.assignee ||
            "Not specified",
          deadline:
            item?.deadline ||
            item?.due ||
            "Not specified",
        };
      })
      .filter((item) => item.task);
  }

  return parseList(value).map((item) => ({
    task: item,
    owner: "AI Assigned",
    deadline: "Not specified",
  }));
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  /* =======================================================
     GENERAL STATE
  ======================================================= */

  const [activeTab, setActiveTab] = useState("summary");
  const [sourceInput, setSourceInput] = useState("");
  const [language, setLanguage] = useState("english");

  /* =======================================================
     PIPELINE STATE
  ======================================================= */

  const [pipelineState, setPipelineState] = useState("idle");

  const [currentStepIndex, setCurrentStepIndex] =
    useState(0);

  const [currentBackendStage, setCurrentBackendStage] =
    useState("idle");

  const [processingMessage, setProcessingMessage] =
    useState("");

  const [processingPercent, setProcessingPercent] =
    useState(0);

  const [jobId, setJobId] = useState(null);

  const [processingStartedAt, setProcessingStartedAt] =
    useState(null);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [pipelineError, setPipelineError] =
    useState(null);

  /* =======================================================
     TERMINAL LOGS
  ======================================================= */

  const [terminalLogs, setTerminalLogs] = useState([
    "[SYSTEM] VibeLens AI Core initialized successfully.",
    "[READY] Awaiting YouTube URL or local audio source...",
  ]);

  /* =======================================================
     CHAT STATE
  ======================================================= */

  const [chatMessages, setChatMessages] = useState([
    {
      sender: "bot",
      text:
        "Hello! I'm your VibeLens AI Assistant. Once your video is processed, you can ask me anything about the transcript.",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  /* =======================================================
     RESULT/UI STATE
  ======================================================= */

  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [transcriptSearch, setTranscriptSearch] =
    useState("");

  const [resultData, setResultData] = useState(null);

  /* =======================================================
     REAL ELAPSED TIMER
  ======================================================= */

  useEffect(() => {
    if (
      pipelineState !== "processing" ||
      !processingStartedAt
    ) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(
        Math.floor(
          (Date.now() - processingStartedAt) / 1000
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [pipelineState, processingStartedAt]);

  /* =======================================================
     ADD TERMINAL LOG
  ======================================================= */

  const addLog = (message) => {
    setTerminalLogs((prev) => [
      ...prev.slice(-8),
      message,
    ]);
  };

  /* =======================================================
     UPDATE FRONTEND FROM BACKEND JOB
  ======================================================= */

  const updateFromJob = (job) => {
    if (!job) return;

    const nextStage =
      job.stage || "processing";

    const nextMessage =
      job.message || "Processing...";

    const nextPercent =
      typeof job.percent === "number"
        ? job.percent
        : 0;

    const nextStep =
      typeof job.step === "number"
        ? job.step
        : 0;

    setCurrentBackendStage(nextStage);
    setProcessingMessage(nextMessage);
    setProcessingPercent(nextPercent);
    setCurrentStepIndex(nextStep);

    const logMessage =
      `[${nextPercent}%] ${nextMessage}`;

    setTerminalLogs((prev) => {
      if (
        prev[prev.length - 1] === logMessage
      ) {
        return prev;
      }

      return [
        ...prev.slice(-8),
        logMessage,
      ];
    });
  };

  /* =======================================================
     POLL BACKEND JOB
  ======================================================= */

  const pollProcessingJob = async (
    id,
    startedAt,
    source,
    selectedLanguage
  ) => {
    let attempts = 0;

    while (true) {
      attempts += 1;

      /*
        7200 attempts × 1 second
        = approximately 2 hours maximum.
      */

      if (attempts > 7200) {
        throw new Error(
          "Processing timed out while waiting for the backend."
        );
      }

      let response;

      try {
        response = await fetch(
          `${API_BASE}/api/process/status/${id}`
        );
      } catch (error) {
        throw new Error(
          `Cannot connect to the FastAPI backend at ${API_BASE}. ` +
            "Make sure the backend is running."
        );
      }

      if (!response.ok) {
        let detail =
          "Unable to read backend processing status.";

        try {
          const errorData =
            await response.json();

          detail =
            errorData.detail || detail;
        } catch {
          // Keep default message.
        }

        throw new Error(detail);
      }

      const job = await response.json();

      updateFromJob(job);

      /* =================================================
         JOB COMPLETED
      ================================================= */

      if (job.status === "completed") {
        const data = job.result || {};

        /*
          Use startedAt directly instead of relying on
          React state having updated.
        */

        const durationSeconds = Math.floor(
          (Date.now() - startedAt) / 1000
        );

        const formattedResult = {
          title:
            data.title ||
            "Analyzed Meeting & Video",

          sourceUrl: source,

          language: selectedLanguage,

          duration:
            formatElapsed(durationSeconds),

          summary:
            parseList(data.summary),

          action_items:
            parseActionItems(
              data.action_items
            ),

          key_decisions:
            parseList(
              data.key_decisions
            ),

          open_questions:
            parseList(
              data.open_questions
            ),

          transcript:
            data.transcript ||
            "No transcript returned from the backend.",
        };

        setResultData(formattedResult);

        setElapsedSeconds(
          durationSeconds
        );

        setCurrentStepIndex(
          PIPELINE_STEPS.length
        );

        setProcessingPercent(100);

        setCurrentBackendStage(
          "completed"
        );

        setProcessingMessage(
          job.message ||
            "Analysis completed successfully."
        );

        setPipelineState("completed");

        setActiveTab("summary");

        setTerminalLogs((prev) => [
          ...prev.slice(-8),
          "[100%] Analysis completed successfully.",
        ]);

        return;
      }

      /* =================================================
         JOB FAILED
      ================================================= */

      if (job.status === "failed") {
        throw new Error(
          job.error ||
            job.message ||
            "Backend pipeline failed."
        );
      }

      /* =================================================
         WAIT 1 SECOND
      ================================================= */

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );
    }
  };

  /* =======================================================
     START PROCESSING
  ======================================================= */

  const handleStartProcessing = async (e) => {
    e.preventDefault();

    const source = sourceInput.trim();

    if (!source) {
      return;
    }

    /*
      IMPORTANT:
      Store this in a local variable so polling uses the
      exact start time instead of waiting for React state.
    */

    const startedAt = Date.now();

    setPipelineState("processing");

    setCurrentStepIndex(0);

    setCurrentBackendStage("queued");

    setProcessingPercent(0);

    setProcessingMessage(
      "Starting analysis..."
    );

    setPipelineError(null);

    setProcessingStartedAt(
      startedAt
    );

    setElapsedSeconds(0);

    setResultData(null);

    setJobId(null);

    setActiveTab("summary");

    setTranscriptSearch("");

    setChatInput("");

    setChatMessages([
      {
        sender: "bot",
        text:
          "Hello! I'm your VibeLens AI Assistant. Once your video is processed, you can ask me anything about the transcript.",
      },
    ]);

    setTerminalLogs([
      "[INIT] Starting VibeLens analysis",
      `[SOURCE] ${source}`,
      `[LANGUAGE] ${language.toUpperCase()}`,
      "[BACKEND] Connecting to FastAPI pipeline...",
    ]);

    const appSection =
      document.getElementById(
        "app-dashboard"
      );

    if (appSection) {
      appSection.scrollIntoView({
        behavior: "smooth",
      });
    }

    try {
      let response;

      /* ===============================================
         START BACKEND JOB
      =============================================== */

      try {
        response = await fetch(
          `${API_BASE}/api/process`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              source,
              language,
            }),
          }
        );
      } catch (error) {
        throw new Error(
          `Cannot connect to FastAPI backend at ${API_BASE}. ` +
            "Please make sure your backend is running."
        );
      }

      /* ===============================================
         CHECK START RESPONSE
      =============================================== */

      if (!response.ok) {
        let detail =
          "Failed to start analysis.";

        try {
          const errorData =
            await response.json();

          detail =
            errorData.detail ||
            detail;
        } catch {
          // Keep default message.
        }

        throw new Error(detail);
      }

      const data =
        await response.json();

      /* ===============================================
         CHECK JOB ID
      =============================================== */

      if (!data.job_id) {
        throw new Error(
          "Backend did not return a processing job ID."
        );
      }

      setJobId(data.job_id);

      setTerminalLogs((prev) => [
        ...prev.slice(-8),
        `[JOB] ${data.job_id}`,
        "[BACKEND] Job accepted successfully.",
      ]);

      /* ===============================================
         START POLLING
      =============================================== */

      await pollProcessingJob(
        data.job_id,
        startedAt,
        source,
        language
      );
    } catch (err) {
      console.error(
        "VibeLens processing error:",
        err
      );

      const errorMessage =
        err?.message ||
        "Unknown backend error.";

      setPipelineError(
        errorMessage
      );

      setPipelineState("error");

      setTerminalLogs((prev) => [
        ...prev.slice(-8),
        `[ERROR] ${errorMessage}`,
      ]);
    }
  };

  /* =======================================================
     RESET WORKSPACE
  ======================================================= */

  const resetWorkspace = () => {
    setPipelineState("idle");

    setCurrentStepIndex(0);

    setCurrentBackendStage("idle");

    setProcessingMessage("");

    setProcessingPercent(0);

    setJobId(null);

    setProcessingStartedAt(null);

    setElapsedSeconds(0);

    setPipelineError(null);

    setResultData(null);

    setActiveTab("summary");

    setTranscriptSearch("");

    setChatInput("");

    setCopied(false);

    setDownloaded(false);

    setIsChatLoading(false);

    setChatMessages([
      {
        sender: "bot",
        text:
          "Hello! I'm your VibeLens AI Assistant. Once your video is processed, you can ask me anything about the transcript.",
      },
    ]);

    setTerminalLogs([
      "[SYSTEM] VibeLens AI Core initialized successfully.",
      "[READY] Awaiting YouTube URL or local audio source...",
    ]);
  };

  /* =======================================================
     CHAT WITH BACKEND RAG
  ======================================================= */

  const handleSendMessage = async (
    textToSend
  ) => {
    const query = (
      textToSend || chatInput
    ).trim();

    if (
      !query ||
      isChatLoading
    ) {
      return;
    }

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: query,
      },
    ]);

    if (!textToSend) {
      setChatInput("");
    }

    setIsChatLoading(true);

    try {
      let response;

      /* ===============================================
         SEND QUESTION TO FASTAPI
      =============================================== */

      try {
        response = await fetch(
          `${API_BASE}/api/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              question: query,
            }),
          }
        );
      } catch (error) {
        throw new Error(
          `Cannot connect to FastAPI backend at ${API_BASE}.`
        );
      }

      /* ===============================================
         CHECK CHAT RESPONSE
      =============================================== */

      if (!response.ok) {
        let detail =
          "Failed to retrieve answer.";

        try {
          const errorData =
            await response.json();

          detail =
            errorData.detail ||
            detail;
        } catch {
          // Keep default message.
        }

        throw new Error(detail);
      }

      const data =
        await response.json();

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            data.answer ||
            "No answer returned by the backend.",
        },
      ]);
    } catch (err) {
      console.error(
        "Chat error:",
        err
      );

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            `Error: ${
              err?.message ||
              "Unable to retrieve an answer."
            }`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  /* =======================================================
     ACTIVE RESULT
  ======================================================= */

  const activeResult =
    resultData || MOCK_RESULT;

  /* =======================================================
     TRANSCRIPT SEARCH
  ======================================================= */

  const filteredTranscript =
    useMemo(() => {
      const transcript =
        activeResult.transcript || "";

      if (
        !transcriptSearch.trim()
      ) {
        return transcript;
      }

      const query =
        transcriptSearch.toLowerCase();

      return transcript
        .split("\n")
        .filter((line) =>
          line
            .toLowerCase()
            .includes(query)
        )
        .join("\n");
    }, [
      activeResult.transcript,
      transcriptSearch,
    ]);

  /* =======================================================
     COPY TRANSCRIPT
  ======================================================= */

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(
        activeResult.transcript || ""
      );
    } catch {
      const textarea =
        document.createElement(
          "textarea"
        );

      textarea.value =
        activeResult.transcript || "";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        "copy"
      );

      document.body.removeChild(
        textarea
      );
    }

    setCopied(true);

    setTimeout(
      () => setCopied(false),
      2000
    );
  };

  /* =======================================================
     DOWNLOAD REPORT
  ======================================================= */

  const downloadReport = () => {
    const reportText = `VibeLens AI Executive Report

TITLE:
${activeResult.title}

LANGUAGE:
${activeResult.language}

DURATION:
${activeResult.duration}

SUMMARY:
${activeResult.summary
  .map((item) => `- ${item}`)
  .join("\n")}

ACTION ITEMS:
${activeResult.action_items
  .map(
    (item) =>
      `- ${item.task} | Owner: ${item.owner} | Due: ${item.deadline}`
  )
  .join("\n")}

KEY DECISIONS:
${activeResult.key_decisions
  .map((item) => `- ${item}`)
  .join("\n")}

OPEN QUESTIONS:
${activeResult.open_questions
  .map((item) => `- ${item}`)
  .join("\n")}

TRANSCRIPT:
${activeResult.transcript}
`;

    const blob = new Blob(
      [reportText],
      {
        type: "text/plain;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      "VibeLens_AI_Meeting_Report.txt";

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);

    setDownloaded(true);

    setTimeout(
      () => setDownloaded(false),
      2000
    );
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#090A0F] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-hidden">
      <ParticleBackground />

      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }

        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-2deg); }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.25;
            transform: scale(1);
          }

          50% {
            opacity: 0.55;
            transform: scale(1.06);
          }
        }

        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: floatReverse 9s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulseGlow 5s ease-in-out infinite;
        }

        .glass-panel {
          background: rgba(18, 20, 28, 0.78);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .glass-panel-hover {
          transition: all 220ms ease;
        }

        .glass-panel-hover:hover {
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 12px 40px -10px rgba(245, 158, 11, 0.18);
          transform: translateY(-2px);
        }

        .glow-text {
          text-shadow: 0 0 30px rgba(245, 158, 11, 0.35);
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(113, 113, 122, 0.35);
          border-radius: 999px;
        }
      `}</style>

      <div className="absolute top-0 left-1/4 w-[750px] h-[750px] bg-amber-600/[0.05] rounded-full blur-[190px] pointer-events-none animate-pulse-glow z-0" />

      <div className="absolute top-[35%] right-5 w-[650px] h-[650px] bg-purple-600/[0.04] rounded-full blur-[190px] pointer-events-none animate-float-slow z-0" />

      <div className="absolute bottom-[20%] left-10 w-[600px] h-[600px] bg-emerald-600/[0.04] rounded-full blur-[190px] pointer-events-none animate-float-reverse z-0" />

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#090A0F]/85 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center shadow-2xl group-hover:border-amber-500/60 transition-all">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <span className="text-xl font-extrabold tracking-tight text-zinc-100 flex items-center space-x-2">
                <span>VibeLens</span>

                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-semibold">
                  AI
                </span>
              </span>

              <span className="block text-[11px] text-zinc-400 tracking-wide font-medium">
                Video & Audio Intelligence
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a
              href="#features"
              className="hover:text-amber-400 transition-colors"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="hover:text-amber-400 transition-colors"
            >
              How It Works
            </a>

            <a
              href="#architecture"
              className="hover:text-amber-400 transition-colors"
            >
              Architecture
            </a>

            <a
              href="#benefits"
              className="hover:text-amber-400 transition-colors"
            >
              Benefits
            </a>
          </div>

          <a
            href="#app-dashboard"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Launch App</span>
          </a>
        </div>
      </nav>

      {/* ===================================================
          HERO
      =================================================== */}

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium mb-6 shadow-inner">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />

              <span>
                Real-time FastAPI pipeline • Groq Whisper • Sarvam • Gemini • Qdrant
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 text-zinc-100 leading-[1.12]">
              Turn Hours of Video Into{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent glow-text">
                Instant Intelligence
              </span>
            </h1>

            <p className="text-lg text-zinc-400 mb-8 max-w-2xl leading-relaxed">
              Extract clean executive summaries, action items, key decisions,
              unresolved questions, and a searchable AI memory from your
              meeting or video.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#app-dashboard"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-base shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
              >
                <span>Start Analyzing</span>

                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold text-base transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Compass className="w-5 h-5 text-zinc-400" />

                <span>Explore Pipeline</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-6 mt-9 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Real backend progress
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                English + Hinglish
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                RAG Q&A
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-6 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-emerald-500/10 blur-3xl rounded-full" />

            <div className="relative glass-panel rounded-[2rem] p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-amber-400" />
                  </div>

                  <div>
                    <div className="text-sm font-bold text-zinc-100">
                      Live Pipeline
                    </div>

                    <div className="text-[11px] text-zinc-500">
                      Backend-controlled state
                    </div>
                  </div>
                </div>

                <span className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  READY
                </span>
              </div>

              <div className="py-5 space-y-3">
                {PIPELINE_STEPS.slice(
                  0,
                  5
                ).map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/70"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-zinc-200">
                          {step.title}
                        </div>

                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Backend reports every stage
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-700" />
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500">
                  NO FAKE TIMER
                </span>

                <span className="text-amber-400">
                  REAL JOB STATUS
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          FEATURES
      =================================================== */}

      <section
        id="features"
        className="py-24 relative z-10 border-t border-zinc-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">
              Intelligence Layer
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
              Everything important, extracted automatically
            </h2>

            <p className="text-zinc-400">
              VibeLens turns unstructured audio into a practical workspace
              instead of leaving you with a giant transcript.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Sparkles,
                title: "Executive Summary",
                desc: "Concise, professional meeting intelligence generated from the real transcript.",
              },
              {
                icon: CheckSquare,
                title: "Action Items",
                desc: "Tasks, owners, and deadlines extracted from the conversation.",
              },
              {
                icon: ShieldCheck,
                title: "Key Decisions",
                desc: "Important agreements and decisions surfaced separately.",
              },
              {
                icon: MessageSquare,
                title: "Ask Your Meeting",
                desc: "Search the processed meeting through the RAG-powered chatbot.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="glass-panel glass-panel-hover rounded-3xl p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>

                  <h3 className="font-bold text-lg mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================
          HOW IT WORKS
      =================================================== */}

      <section
        id="how-it-works"
        className="py-24 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">
              Processing Pipeline
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
              One source. Nine real backend stages.
            </h2>

            <p className="text-zinc-400">
              The workspace mirrors the Python pipeline instead of running an
              independent frontend animation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PIPELINE_STEPS.map(
              (step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.id}
                    className="glass-panel rounded-3xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 text-[72px] font-black text-zinc-900/70 leading-none">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
                        <Icon className="w-5 h-5 text-amber-400" />
                      </div>

                      <h3 className="font-bold text-lg mb-2">
                        {step.title}
                      </h3>

                      <p className="text-sm text-zinc-400 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          ARCHITECTURE
      =================================================== */}

      <section
        id="architecture"
        className="py-24 border-y border-zinc-900 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 font-mono text-xs tracking-widest uppercase">
              Architecture
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 mb-4">
              Built around your actual backend
            </h2>

            <p className="text-zinc-400">
              The UI labels match the engines and processing responsibilities
              currently used by the project.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                number: "01",
                color: "text-red-400",
                icon: Video,
                title: "Media Processing",
                desc: "yt-dlp and pydub prepare source audio for downstream transcription.",
              },
              {
                number: "02",
                color: "text-sky-400",
                icon: Volume2,
                title: "Speech-to-Text",
                desc: "Groq Whisper handles English while Sarvam handles Hinglish.",
              },
              {
                number: "03",
                color: "text-amber-400",
                icon: Sparkles,
                title: "LLM Intelligence",
                desc: "Gemini generates the title, summary, action items, decisions, and questions.",
              },
              {
                number: "04",
                color: "text-purple-400",
                icon: Database,
                title: "Meeting Memory",
                desc: "Qdrant stores meeting embeddings and enables transcript retrieval through RAG.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.number}
                  className="glass-panel glass-panel-hover rounded-3xl p-6"
                >
                  <div
                    className={`text-xs font-mono font-bold mb-4 ${item.color}`}
                  >
                    {item.number}
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                    <Icon
                      className={`w-5 h-5 ${item.color}`}
                    />
                  </div>

                  <h3 className="text-lg font-bold mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================
          BENEFITS
      =================================================== */}

      <section
        id="benefits"
        className="py-24 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                    For Teams
                  </div>

                  <h3 className="text-xl font-bold">
                    Turn conversation into follow-through
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Reduce the time spent manually reviewing long meetings.",
                  "Separate decisions and tasks from background discussion.",
                  "Keep a searchable transcript available for follow-up questions.",
                  "Export the resulting intelligence as a simple text report.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-sky-400" />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
                    For Learning
                  </div>

                  <h3 className="text-xl font-bold">
                    Make long-form content easier to revisit
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "Search a processed lecture or technical video conversationally.",
                  "Extract key ideas without manually scanning the entire transcript.",
                  "Surface unanswered questions for later research.",
                  "Use the transcript as a durable AI context layer.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />

                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          APP DASHBOARD
      =================================================== */}

      <section
        id="app-dashboard"
        className="py-24 border-t border-zinc-950 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-amber-400 font-mono text-xs tracking-widest uppercase mb-3 block">
              Live Workspace
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 mb-4">
              VibeLens Assistant Workspace
            </h2>

            <p className="text-red-400 text-sm font-bold mb-2">
              For this project, start with a short 5–8 minute audio/video source.
            </p>

            <p className="text-zinc-400 text-base">
              The progress interface below is driven by the real FastAPI job
              status.
            </p>
          </div>

          {/* =================================================
              IDLE STATE
          ================================================= */}

          {pipelineState === "idle" && (
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 glass-panel rounded-3xl p-8 shadow-2xl">
                <form
                  onSubmit={
                    handleStartProcessing
                  }
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      YouTube URL or Backend-Accessible Audio/Video Path
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                        <Video className="w-5 h-5 text-red-400" />
                      </div>

                      <input
                        type="text"
                        required
                        value={sourceInput}
                        onChange={(e) =>
                          setSourceInput(
                            e.target.value
                          )
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full pl-12 pr-4 py-4 bg-[#090A0F] border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500/50 text-zinc-100 placeholder-zinc-600 text-sm font-medium transition-colors"
                      />
                    </div>

                    <p className="text-[11px] text-zinc-600 mt-2">
                      For local files, the path must be accessible from the
                      FastAPI backend machine.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Transcription Engine & Language
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                        <Globe className="w-5 h-5 text-amber-400" />
                      </div>

                      <select
                        value={language}
                        onChange={(e) =>
                          setLanguage(
                            e.target.value
                          )
                        }
                        className="w-full pl-12 pr-4 py-4 bg-[#090A0F] border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500/50 text-zinc-100 text-sm appearance-none cursor-pointer"
                      >
                        <option value="english">
                          English — Groq Whisper
                        </option>

                        <option value="hinglish">
                          Hinglish — Sarvam AI
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-2">
                        Audio
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Volume2 className="w-4 h-4 text-sky-400" />
                        Mono / 16 kHz
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono mb-2">
                        Memory
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Database className="w-4 h-4 text-purple-400" />
                        Qdrant RAG
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                  >
                    <Play className="w-5 h-5" />

                    <span>
                      Run VibeLens Pipeline
                    </span>

                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>

              <div className="lg:col-span-5 bg-[#090A0F] border border-zinc-800 rounded-3xl p-6 font-mono text-xs flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                    <span className="text-zinc-400 flex items-center">
                      <Terminal className="w-4 h-4 mr-2 text-amber-400" />
                      system_terminal.log
                    </span>

                    <span className="flex items-center gap-2 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      READY
                    </span>
                  </div>

                  <div className="space-y-3 text-zinc-400">
                    {terminalLogs.map(
                      (log, index) => (
                        <p
                          key={`${log}-${index}`}
                        >
                          <span className="text-amber-400/70 mr-2">
                            $
                          </span>

                          {log}
                        </p>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 text-[11px] text-zinc-600">
                  FastAPI • Groq/Sarvam • Gemini • Qdrant
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              PROCESSING STATE
          ================================================= */}

          {pipelineState ===
            "processing" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="glass-panel rounded-[2rem] p-6 sm:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                      </div>

                      <span className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-400 border-4 border-[#12141c]" />
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-amber-400 font-mono">
                        Live Analysis
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
                        {processingMessage ||
                          "Analyzing your media..."}
                      </h3>

                      <p className="text-xs text-zinc-500 mt-1">
                        Backend job:{" "}
                        {jobId
                          ? `${jobId.slice(
                              0,
                              12
                            )}...`
                          : "starting"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Elapsed
                      </div>

                      <div className="font-mono text-sm text-zinc-200">
                        {formatElapsed(
                          elapsedSeconds
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Progress
                      </div>

                      <div className="font-mono text-sm text-amber-400">
                        {processingPercent}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            processingPercent
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between mt-2 text-[11px] text-zinc-500">
                    <span>
                      Backend pipeline started
                    </span>

                    <span>
                      {processingPercent}%
                      complete
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PIPELINE_STEPS.map(
                    (step, idx) => {
                      const Icon = step.icon;

                      const isDone =
                        idx <
                        currentStepIndex;

                      const isCurrent =
                        idx ===
                        currentStepIndex;

                      return (
                        <div
                          key={step.id}
                          className={`
                            relative flex items-center gap-4 p-4 rounded-2xl border
                            transition-all duration-500
                            ${
                              isCurrent
                                ? "bg-amber-500/[0.08] border-amber-500/30 shadow-lg shadow-amber-500/5"
                                : isDone
                                ? "bg-emerald-500/[0.04] border-emerald-500/10"
                                : "bg-zinc-950/30 border-zinc-800/60 opacity-45"
                            }
                          `}
                        >
                          <div
                            className={`
                              w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border
                              ${
                                isCurrent
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : isDone
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-600"
                              }
                            `}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div
                              className={`text-sm font-semibold ${
                                isCurrent
                                  ? "text-zinc-100"
                                  : isDone
                                  ? "text-zinc-300"
                                  : "text-zinc-600"
                              }`}
                            >
                              {step.title}
                            </div>

                            <div className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                              {isCurrent
                                ? processingMessage
                                : step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#090A0F] border border-zinc-800 rounded-3xl p-5 font-mono">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      live_pipeline.log
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      POLLING BACKEND
                    </div>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
                    {terminalLogs.map(
                      (log, index) => (
                        <div
                          key={`${log}-${index}`}
                          className="text-[11px] text-zinc-500"
                        >
                          <span className="text-amber-500/70 mr-2">
                            $
                          </span>

                          {log}
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="glass-panel rounded-3xl p-5">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-4">
                    Current backend state
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 mb-4">
                    <div className="text-[10px] uppercase text-zinc-600 font-mono mb-1">
                      Stage
                    </div>

                    <div className="text-sm font-bold text-amber-400">
                      {currentBackendStage}
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-zinc-400">
                    <div className="flex gap-3">
                      <span className="text-amber-400">
                        01
                      </span>

                      <span>
                        The frontend waits for the backend status.
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span className="text-amber-400">
                        02
                      </span>

                      <span>
                        No automatic step timer is running.
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span className="text-emerald-400">
                        03
                      </span>

                      <span>
                        Completion appears only after the backend returns its final result.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR STATE
          ================================================= */}

          {pipelineState ===
            "error" && (
            <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>

              <div className="text-xs uppercase tracking-widest text-red-400 font-mono mb-2">
                Backend Pipeline Error
              </div>

              <h3 className="text-xl font-bold text-zinc-100 mb-3">
                Analysis could not be completed
              </h3>

              <p className="text-sm text-zinc-400 mb-6 break-words">
                {pipelineError ||
                  "Something went wrong while processing your media."}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={
                    resetWorkspace
                  }
                  className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />

                  Start Over
                </button>

                <button
                  onClick={() => {
                    if (
                      sourceInput.trim()
                    ) {
                      handleStartProcessing(
                        {
                          preventDefault:
                            () => {},
                        }
                      );
                    }
                  }}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />

                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {/* =================================================
              COMPLETED STATE
          ================================================= */}

          {pipelineState ===
            "completed" && (
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />

                      <span>
                        Pipeline Completed
                      </span>
                    </span>

                    <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono uppercase">
                      {activeResult.language}
                    </span>

                    <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
                      ⏱{" "}
                      {
                        activeResult.duration
                      }
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-100">
                    {activeResult.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                  <button
                    onClick={
                      downloadReport
                    }
                    className="px-4 py-2.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 border border-zinc-800"
                  >
                    {downloaded ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4 text-amber-400" />
                    )}

                    <span>
                      {downloaded
                        ? "Downloaded!"
                        : "Export Report"}
                    </span>
                  </button>

                  <button
                    onClick={
                      resetWorkspace
                    }
                    className="px-4 py-2.5 text-sm font-medium bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 border border-zinc-800"
                  >
                    <RefreshCw className="w-4 h-4" />

                    <span>
                      Analyze Another
                    </span>
                  </button>
                </div>
              </div>

              {/* =============================================
                  TABS
              ============================================= */}

              <div className="flex overflow-x-auto space-x-2 border-b border-zinc-800 pb-2 scrollbar-thin">
                {[
                  {
                    id: "summary",
                    label: "Executive Summary",
                    icon: Sparkles,
                  },
                  {
                    id: "insights",
                    label: "Actions & Decisions",
                    icon: Layers,
                  },
                  {
                    id: "transcript",
                    label: "Raw Transcript",
                    icon: FileText,
                  },
                  {
                    id: "chat",
                    label: "RAG Q&A Chatbot",
                    icon: MessageSquare,
                  },
                ].map((tab) => {
                  const Icon =
                    tab.icon;

                  const isActive =
                    activeTab ===
                    tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() =>
                        setActiveTab(
                          tab.id
                        )
                      }
                      className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold shadow-lg shadow-amber-500/20"
                          : "glass-panel text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />

                      <span>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* =============================================
                  SUMMARY TAB
              ============================================= */}

              {activeTab ===
                "summary" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-xl font-bold text-zinc-100">
                          Executive Summary
                        </h4>

                        <p className="text-xs text-zinc-400">
                          Generated from the completed backend transcript
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-4">
                      {activeResult.summary
                        .length > 0 ? (
                        activeResult.summary.map(
                          (
                            point,
                            index
                          ) => (
                            <li
                              key={
                                index
                              }
                              className="flex items-start space-x-3 p-4 rounded-xl bg-[#090A0F] border border-zinc-800/80"
                            >
                              <span className="w-6 h-6 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 border border-zinc-800">
                                {index +
                                  1}
                              </span>

                              <span className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                                {
                                  point
                                }
                              </span>
                            </li>
                          )
                        )
                      ) : (
                        <li className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-500">
                          No summary points were returned.
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-panel rounded-3xl p-6 shadow-xl">
                      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 font-mono">
                        Pipeline Metadata
                      </h4>

                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">
                            Language
                          </span>

                          <span className="font-semibold text-zinc-200 capitalize">
                            {
                              activeResult.language
                            }
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">
                            Action Items
                          </span>

                          <span className="font-semibold text-amber-400">
                            {
                              activeResult
                                .action_items
                                .length
                            }{" "}
                            extracted
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">
                            Key Decisions
                          </span>

                          <span className="font-semibold text-emerald-400">
                            {
                              activeResult
                                .key_decisions
                                .length
                            }{" "}
                            recorded
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-zinc-800">
                          <span className="text-zinc-400">
                            Open Questions
                          </span>

                          <span className="font-semibold text-purple-400">
                            {
                              activeResult
                                .open_questions
                                .length
                            }{" "}
                            found
                          </span>
                        </div>

                        <div className="flex justify-between py-2">
                          <span className="text-zinc-400">
                            Vector Store
                          </span>

                          <span className="font-semibold text-sky-400">
                            Qdrant Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-3xl p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>

                        <div>
                          <div className="text-sm font-bold text-zinc-100">
                            AI memory is ready
                          </div>

                          <div className="text-xs text-zinc-500">
                            Ask questions in the chatbot tab.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================
                  INSIGHTS TAB
              ============================================= */}

              {activeTab ===
                "insights" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ACTION ITEMS */}

                  <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-zinc-100">
                          Action Items
                        </h4>

                        <p className="text-xs text-zinc-400">
                          Tasks & Owners
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 flex-grow">
                      {activeResult
                        .action_items
                        .length > 0 ? (
                        activeResult.action_items.map(
                          (
                            item,
                            idx
                          ) => (
                            <div
                              key={
                                idx
                              }
                              className="p-4 rounded-xl bg-[#090A0F] border border-zinc-800/80 space-y-2"
                            >
                              <p className="text-sm font-semibold text-zinc-100">
                                {
                                  item.task
                                }
                              </p>

                              <div className="flex flex-col gap-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                                <span className="text-amber-400 font-medium">
                                  👤{" "}
                                  {
                                    item.owner
                                  }
                                </span>

                                <span className="text-zinc-300 font-medium flex items-center font-mono">
                                  <Clock className="w-3 h-3 mr-1 text-zinc-500" />

                                  {
                                    item.deadline
                                  }
                                </span>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-zinc-500">
                          No action items returned.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* KEY DECISIONS */}

                  <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-zinc-100">
                          Key Decisions
                        </h4>

                        <p className="text-xs text-zinc-400">
                          Agreements
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 flex-grow">
                      {activeResult
                        .key_decisions
                        .length > 0 ? (
                        activeResult.key_decisions.map(
                          (
                            decision,
                            idx
                          ) => (
                            <div
                              key={
                                idx
                              }
                              className="p-4 rounded-xl bg-[#090A0F] border border-zinc-800/80 flex items-start space-x-3"
                            >
                              <span className="w-5 h-5 rounded-full bg-zinc-900 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 border border-zinc-800">
                                {idx +
                                  1}
                              </span>

                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {
                                  decision
                                }
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-zinc-500">
                          No key decisions returned.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* OPEN QUESTIONS */}

                  <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400">
                        <HelpCircle className="w-5 h-5" />
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-zinc-100">
                          Open Questions
                        </h4>

                        <p className="text-xs text-zinc-400">
                          Unresolved topics
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 flex-grow">
                      {activeResult
                        .open_questions
                        .length > 0 ? (
                        activeResult.open_questions.map(
                          (
                            question,
                            idx
                          ) => (
                            <div
                              key={
                                idx
                              }
                              className="p-4 rounded-xl bg-[#090A0F] border border-zinc-800/80 flex items-start space-x-3"
                            >
                              <span className="w-5 h-5 rounded-full bg-zinc-900 text-purple-400 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5 border border-zinc-800">
                                {idx +
                                  1}
                              </span>

                              <p className="text-sm text-zinc-200 leading-relaxed">
                                {
                                  question
                                }
                              </p>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-sm text-zinc-500">
                          No open questions returned.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* =============================================
                  TRANSCRIPT TAB
              ============================================= */}

              {activeTab ===
                "transcript" && (
                <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400">
                          <FileText className="w-5 h-5" />
                        </div>

                        <div>
                          <h4 className="text-xl font-bold text-zinc-100">
                            Raw Transcript
                          </h4>

                          <p className="text-xs text-zinc-400">
                            Returned by the real transcription pipeline
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />

                        <input
                          value={
                            transcriptSearch
                          }
                          onChange={(e) =>
                            setTranscriptSearch(
                              e.target
                                .value
                            )
                          }
                          placeholder="Search transcript"
                          className="w-48 sm:w-64 pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-amber-500/50"
                        />
                      </div>

                      <button
                        onClick={
                          copyTranscript
                        }
                        className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}

                        {copied
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </div>
                  </div>

                  <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap scrollbar-thin bg-[#090A0F] border border-zinc-800 rounded-2xl p-5 text-xs sm:text-sm leading-7 text-zinc-300 font-mono">
                    {filteredTranscript ||
                      "No transcript lines match your search."}
                  </pre>
                </div>
              )}

              {/* =============================================
                  CHAT TAB
              ============================================= */}

              {activeTab ===
                "chat" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 glass-panel rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-amber-400" />
                        </div>

                        <div>
                          <h4 className="font-bold text-zinc-100">
                            Meeting Assistant
                          </h4>

                          <p className="text-xs text-zinc-500">
                            Answers are grounded in the meeting context.
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        RAG READY
                      </span>
                    </div>

                    <div className="h-[420px] overflow-y-auto p-5 space-y-4 scrollbar-thin">
                      {chatMessages.map(
                        (
                          message,
                          index
                        ) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${
                              message.sender ===
                              "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            {message.sender ===
                              "bot" && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-amber-400" />
                              </div>
                            )}

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                message.sender ===
                                "user"
                                  ? "bg-amber-500 text-zinc-950 font-medium"
                                  : "bg-zinc-950 border border-zinc-800 text-zinc-300"
                              }`}
                            >
                              {
                                message.text
                              }
                            </div>

                            {message.sender ===
                              "user" && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-zinc-400" />
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {isChatLoading && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-amber-400" />
                          </div>

                          <div className="px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-zinc-800">
                      <div className="flex gap-2">
                        <input
                          value={
                            chatInput
                          }
                          onChange={(e) =>
                            setChatInput(
                              e.target
                                .value
                            )
                          }
                          onKeyDown={(e) => {
                            if (
                              e.key ===
                                "Enter" &&
                              !e.shiftKey
                            ) {
                              e.preventDefault();

                              handleSendMessage();
                            }
                          }}
                          placeholder="Ask something about the meeting..."
                          className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 outline-none focus:border-amber-500/50"
                        />

                        <button
                          onClick={() =>
                            handleSendMessage()
                          }
                          disabled={
                            isChatLoading ||
                            !chatInput.trim()
                          }
                          className="w-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SUGGESTED QUESTIONS */}

                  <div className="glass-panel rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <Compass className="w-5 h-5 text-amber-400" />
                      </div>

                      <div>
                        <h4 className="font-bold">
                          Try asking
                        </h4>

                        <p className="text-xs text-zinc-500">
                          Suggested questions
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map(
                        (question) => (
                          <button
                            key={
                              question
                            }
                            onClick={() =>
                              handleSendMessage(
                                question
                              )
                            }
                            disabled={
                              isChatLoading
                            }
                            className="w-full text-left p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-xs text-zinc-300 transition-colors disabled:opacity-40"
                          >
                            {
                              question
                            }
                          </button>
                        )
                      )}
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/10">
                      <div className="flex gap-3">
                        <Lock className="w-4 h-4 text-emerald-400 mt-0.5" />

                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          The assistant is instructed to answer from the
                          processed meeting context rather than inventing
                          unrelated information.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-zinc-900 py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" />

            <span className="text-sm font-semibold">
              VibeLens AI
            </span>

            <span className="text-xs text-zinc-600">
              Real-time video intelligence workspace
            </span>
          </div>

          <div className="text-xs text-zinc-600 font-mono">
            FastAPI • LangChain • Gemini • Groq • Sarvam • Qdrant
          </div>
        </div>
      </footer>
    </div>
  );
}