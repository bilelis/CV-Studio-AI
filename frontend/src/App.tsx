import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { StepIndicator } from './components/StepIndicator';
import { StepProfile } from './components/StepProfile';
import { StepJob } from './components/StepJob';
import { StepMatch } from './components/StepMatch';
import { StepResult } from './components/StepResult';
import type { MasterProfile, JobAnalysis, GenerateResponse, HealthResponse, Lang } from './types';
import { api } from './services/api';

export function App() {
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

    // Check health periodically every 20 seconds to keep connection state live
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
    } catch (err: any) {
      setGlobalError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setJob(null);
    setResult(null);
    goToStep(2);
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/25 selection:text-amber-200">
      <Navbar 
        health={health} 
        loading={healthLoading} 
        currentStep={currentStep}
        onReset={handleReset}
      />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 sm:py-6 flex flex-col">
        <StepIndicator
          currentStep={currentStep}
          onSelectStep={(s) => goToStep(s)}
          maxReachedStep={maxReachedStep}
        />

        {globalError && (
          <div className="w-full mb-5 p-3.5 rounded-md bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between shadow-md">
            <span className="font-medium">{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="text-rose-400 hover:text-white font-bold ml-4 p-1 rounded-sm hover:bg-rose-900/40 transition-colors"
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

      <footer className="bg-[#111317] border-t border-[#1E222A] py-3 px-4 sm:px-8 text-xs text-zinc-400 mt-auto">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-xs bg-amber-500"></span>
            <span className="font-semibold text-zinc-200">CV Studio</span>
            <span className="text-zinc-600">•</span>
            <span>Talent Intelligence & High-Precision ATS Matching Suite</span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
            <span className="text-emerald-400 font-medium">✓ Zero-Hallucination Guard</span>
            <span className="text-zinc-600">•</span>
            <span>Local Ollama qwen2.5:7b + bge-m3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
