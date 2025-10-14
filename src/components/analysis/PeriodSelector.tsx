import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  selectedPeriod: "current" | "last" | "90days";
  onPeriodChange: (period: "current" | "last" | "90days") => void;
}

const periods = [
  { id: "current" as const, label: "Este Mes" },
  { id: "last" as const, label: "Mes Pasado" },
  { id: "90days" as const, label: "Últimos 90 días" },
];

export const PeriodSelector = ({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {periods.map((period) => (
        <Button
          key={period.id}
          onClick={() => onPeriodChange(period.id)}
          variant={selectedPeriod === period.id ? "default" : "outline"}
          className={cn(
            "transition-smooth",
            selectedPeriod === period.id && "shadow-soft"
          )}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
};
