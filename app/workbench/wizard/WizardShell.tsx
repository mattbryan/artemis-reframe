"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWizardStore } from "@/store/wizardStore";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Step1CollateralType } from "./steps/Step1CollateralType";
import { Step2ProjectInfo } from "./steps/Step2ProjectInfo";
import { Step3Images } from "./steps/Step3Images";
import { Step4DesignBriefs } from "./steps/Step4DesignBriefs";
import { Step5Review } from "./steps/Step5Review";

const STEPS = [
  { num: 1, label: "Collateral Type" },
  { num: 2, label: "Project Info" },
  { num: 3, label: "Images" },
  { num: 4, label: "Design Briefs" },
  { num: 5, label: "Review" },
];

interface WizardShellProps {
  isStepValid: boolean;
  onStepValidChange: (valid: boolean) => void;
  onSaveDraft: () => Promise<void>;
  onGenerate: () => Promise<void>;
  onCancel: () => void;
}

export function WizardShell({
  isStepValid,
  onStepValidChange,
  onSaveDraft,
  onGenerate,
  onCancel,
}: WizardShellProps) {
  const currentStep = useWizardStore((s) => s.currentStep);
  const setStep = useWizardStore((s) => s.setStep);
  const hasData = useWizardStore((s) => {
    return (
      s.currentStep > 1 ||
      s.projectName !== "" ||
      s.selectedCollateralType !== null ||
      Object.keys(s.formData).length > 0 ||
      Object.keys(s.sectionData).length > 0 ||
      s.images.length > 0 ||
      Object.keys(s.outputTargetAssignments).length > 0
    );
  });

  useEffect(() => {
    if (!hasData) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasData]);

  const handleNext = () => {
    if (currentStep < 5) {
      setStep(currentStep + 1);
    } else {
      onGenerate();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-4">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          return (
            <div
              key={step.num}
              className={cn(
                "flex items-center gap-2",
                idx < STEPS.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isCompleted &&
                    !isCurrent &&
                    "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  isCurrent && "text-foreground",
                  isCompleted && "text-muted-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground/70"
                )}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "hidden flex-1 border-t border-dashed sm:block",
                    isCompleted ? "border-primary/50" : "border-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active step content */}
      <div className="min-h-[320px]">
        {currentStep === 1 && (
          <Step1CollateralType onStepValidChange={onStepValidChange} />
        )}
        {currentStep === 2 && (
          <Step2ProjectInfo onStepValidChange={onStepValidChange} />
        )}
        {currentStep === 3 && (
          <Step3Images onStepValidChange={onStepValidChange} />
        )}
        {currentStep === 4 && (
          <Step4DesignBriefs onStepValidChange={onStepValidChange} />
        )}
        {currentStep === 5 && (
          <Step5Review
            onStepValidChange={onStepValidChange}
            onGenerate={onGenerate}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
        <div>
          <Button variant="secondary" onClick={onSaveDraft}>
            Save Draft
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(currentStep - 1)}
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isStepValid}
          >
            {currentStep === 5 ? "Generate" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
