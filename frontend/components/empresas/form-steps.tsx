import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  number: number
  title: string
  description: string
}

interface FormStepsProps {
  steps: Step[]
  currentStep: number
}

export function FormSteps({ steps, currentStep }: FormStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors",
                  currentStep > step.number
                    ? "bg-[#C3C840] text-[#222A59]"
                    : currentStep === step.number
                      ? "bg-[#3259B5] text-white"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground hidden md:block">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-4 transition-colors",
                  currentStep > step.number ? "bg-[#C3C840]" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
