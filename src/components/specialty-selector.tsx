"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Wind, Activity, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

interface Specialty {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  available: boolean;
}

const specialties: Specialty[] = [
  {
    id: "cardiology",
    title: "Кардиология",
    description: "Мастер формулировки диагноза и подбора терапии ГБ, ИБС, ФП.",
    icon: <Heart className="w-8 h-8" />,
    color: "bg-red-50 text-red-600 border-red-100 hover:border-red-200",
    available: true,
  },
  {
    id: "pulmonology",
    title: "Пульмонология",
    description: "Диагностика ХОБЛ, астмы и расчет шкал тяжести (BODE, GOLD).",
    icon: <Wind className="w-8 h-8" />,
    color: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",
    available: false,
  },
  {
    id: "gastroenterology",
    title: "Гастроэнтерология",
    description: "Разбор гастроэнтеритов, ГЭРБ и функциональных расстройств.",
    icon: <Activity className="w-8 h-8" />,
    color: "bg-green-50 text-green-600 border-green-100 hover:border-green-200",
    available: false,
  },
  {
    id: "neurology",
    title: "ДДЗП / Неврология",
    description: "Оценка болевых синдромов и дегенеративных изменений позвоночника.",
    icon: <Stethoscope className="w-8 h-8" />,
    color: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-200",
    available: false,
  },
];

interface SpecialtySelectorProps {
  onSelect: (id: string) => void;
}

export function SpecialtySelector({ onSelect }: SpecialtySelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {specialties.map((spec) => (
        <Card 
          key={spec.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md border-2",
            spec.color,
            !spec.available && "opacity-60 cursor-not-allowed grayscale"
          )}
          onClick={() => spec.available && onSelect(spec.id)}
        >
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <div className="p-2 rounded-lg bg-white/80 shadow-sm">
              {spec.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{spec.title}</CardTitle>
              {!spec.available && <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Скоро появится</span>}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-slate-600">
              {spec.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
