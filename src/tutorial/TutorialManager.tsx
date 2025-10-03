import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { tutorials, TutorialStep } from "./TutorialSteps";
interface TutorialContextType {
  start: () => void;
  next: () => void;
  back: () => void;
  currentStep: TutorialStep | null;
  isActive: boolean;
  complete: () => void;
  triggerCustomAdvance: (event: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tutorialKey, setTutorialKey] =
    useState<keyof typeof tutorials>("gettingStarted");
  const [stepIdx, setStepIdx] = useState<number>(-1);
  const [isActive, setIsActive] = useState(false);

  const [customEvent, setCustomEvent] = useState<string | null>(null);

  const start = useCallback(
    (key: keyof typeof tutorials = "gettingStarted") => {
      setTutorialKey(key);
      setStepIdx(0);
      setIsActive(true);
    },
    []
  );

  const steps = tutorials[tutorialKey];
  const currentStep = isActive && stepIdx >= 0 ? steps[stepIdx] : null;

  const next = useCallback(() => {
    console.log("Next step");
    if (stepIdx < steps.length - 1) {
      setStepIdx((idx) => idx + 1);
    } else {
      setIsActive(false);
      setStepIdx(-1);
      localStorage.setItem("tutorialComplete", "1");
    }
  }, [stepIdx]);
  const back = useCallback(() => {
    if (stepIdx > 0) {
      setStepIdx((idx) => idx - 1);
    }
  }, [stepIdx]);

  const complete = useCallback(() => {
    setIsActive(false);
    setStepIdx(-1);
    localStorage.setItem("tutorialComplete", "1");
  }, []);

  // Custom event trigger
  const triggerCustomAdvance = (event: string) => setCustomEvent(event);

  useEffect(() => {
    if (!currentStep || !isActive) return;
    if (currentStep.action === "none") return;
    if (currentStep.action === "click" && currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const handler = () => next();
        el.addEventListener("click", handler, { once: true });
        return () => el.removeEventListener("click", handler);
      }
    }
    if (currentStep.action === "valueChange" && currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const handler = () => next();
        el.addEventListener("change", handler, { once: true });
        return () => el.removeEventListener("change", handler);
      }
    }
    if (currentStep.action === "custom" && currentStep.advanceOn) {
      if (customEvent === currentStep.advanceOn) {
        setCustomEvent(null);
        next();
      }
    }
    // For scroll or other actions, add similarly...
  }, [currentStep, isActive, next, customEvent]);

  return (
    <TutorialContext.Provider
      value={{
        start,
        next,
        back,
        currentStep,
        isActive,
        complete,
        triggerCustomAdvance,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};
