import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { StepIndicator } from './components/StepIndicator';
import { StepProfile } from './components/StepProfile';
import { StepJob } from './components/StepJob';
import { StepMatch } from './components/StepMatch';
import { StepResult } from './components/StepResult';
import type { MasterProfile, JobAnalysis, GenerateResponse, HealthResponse, Lang } from './types';
import { api } from './services/api';
import { ToastProvider } from './components/ui/toast';
import { useToast } from './components/ui/use-toast';

function AppContent() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<number>(1);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<MasterProfile | null>(null);
  const [job, setJob] = useState<JobAnalysis | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData(retries = 3, delay = 1200) {
      if (!isMounted) return;
      setHealthLoading(true);

      for (let i = 0; i < retries; i++) {
        try {
          const [h, p] = await Promise.all([
            api.getHealth(),
            api.getProfile().catch((e) => {
              console.warn('Profile fetch attempt warning:', e.message);
              return null;
            }),
          ]);

          if (isMounted) {
            setHealth(h);
            if (p) setProfile(p);
            setHealthLoading(false);
          }
          return;
        } catch (err: any) {
          console.warn(`Backend connection attempt ${i + 1}/${retries} failed:`, err.message);
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (isMounted) {
        setHealth({ ok: false, ollama: false, models_ready: { 'qwen2.5:7b': false, 'bge-m3': false } });
        setHealthLoading(false);
      }
    }

    loadData();

    // Check health periodically every 20 seconds
    const interval = setInterval(() => {
      api.getHealth()
        .then((h) => isMounted && setHealth(h))
        .catch(() => {});
    }, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobAnalyzed = (analyzedJob: JobAnalysis) => {
    setJob(analyzedJob);
    goToStep(3);
  };

  const handleGenerate = async (selectedProjectIds: string[], language: Lang) => {
    if (!job) return;
    setGenerating(true);
    setGlobalError(null);
    try {
      const genResult = await api.generate(job, selectedProjectIds, language);
      setResult(genResult);
      goToStep(4);
      toast('Dossier Generated', {
        description: 'CV and Cover Letter built successfully with PDF export links.',
        type: 'success',
      });
    } catch (err: any) {
      const msg = err.message || 'Generation failed';
      setGlobalError(msg);
      toast('Generation Failed', {
        description: msg,
        type: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setJob(null);
    setResult(null);
    goToStep(1);
    toast('Workflow Reset', {
      description: 'Ready to select new target requisition.',
      type: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-[#18181B] flex flex-col font-sans selection:bg-[#111111] selection:text-white">
      <Navbar 
        health={health} 
        loading={healthLoading} 
        currentStep={currentStep}
        onReset={handleReset}
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 flex flex-col">
        <StepIndicator
          currentStep={currentStep}
          onSelectStep={(s) => goToStep(s)}
          maxReachedStep={maxReachedStep}
        />

        {globalError && (
          <div className="w-full mb-5 p-4 rounded-[16px] bg-[#FFF5F5] border border-rose-300 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
            <span className="font-semibold">{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold ml-4 p-1 rounded-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 w-full">
          {/* Step 1: Profile & Project Bank */}
          {currentStep === 1 && (
            <StepProfile
              profile={profile}
              onProfileUpdated={(updated) => setProfile(updated)}
              onNext={() => goToStep(2)}
            />
          )}

          {/* Step 2: Target Job Offer */}
          {currentStep === 2 && (
            <StepJob
              job={job}
              onJobAnalyzed={handleJobAnalyzed}
              onBack={() => goToStep(1)}
              onNext={() => goToStep(3)}
            />
          )}

          {/* Step 3: Match & Project Selection */}
          {currentStep === 3 && profile && job && (
            <StepMatch
              profile={profile}
              job={job}
              onGenerate={handleGenerate}
              generating={generating}
              onBack={() => goToStep(2)}
            />
          )}

          {/* Step 4: Results, ATS Report & PDF Exports */}
          {currentStep === 4 && result && (
            <StepResult result={result} onReset={handleReset} />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-[rgba(0,0,0,0.06)] py-4 px-6 text-xs text-[var(--text-muted)] mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#111111]"></span>
            <span className="font-semibold text-[#18181B]">CV Matcher Studio</span>
            <span>•</span>
            <span>Bento ATS Matching Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-700 font-medium">✓ Zero-Hallucination Policy</span>
            <span>•</span>
            <span>Local Ollama qwen2.5:7b + bge-m3 Dense Retrieval</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
