"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DiagnosisResult as DiagnosisResultType } from "@/lib/diagnosis-logic";

interface DiagnosisResultProps {
  diagnosis: DiagnosisResultType;
  onReset: () => void;
}

export function DiagnosisResult({ diagnosis, onReset }: DiagnosisResultProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const copyText = useMemo(() => diagnosis.fullDiagnosis, [diagnosis.fullDiagnosis]);

  const sections = diagnosis.sections;

  async function copyDiagnosis() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Результат Диагностики</CardTitle>
        <CardDescription>Ниже представлен предварительный диагноз, основанный на введенных данных.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">Структура диагноза</h3>
                <Button onClick={copyDiagnosis} variant="outline" className="shrink-0">
                  {copyState === "copied" ? "Скопировано" : copyState === "error" ? "Ошибка" : "Скопировать диагноз"}
                </Button>
              </div>

              {sections && (
                <div className="space-y-3 text-sm">
                  {sections.primary.length > 0 && (
                    <div>
                      <div className="font-medium text-foreground">Основное заболевание</div>
                      <div className="text-muted-foreground">{sections.primary.join(" ")}</div>
                    </div>
                  )}
                  {sections.background.length > 0 && (
                    <div>
                      <div className="font-medium text-foreground">Фоновое заболевание</div>
                      <div className="text-muted-foreground">{sections.background.join(" ")}</div>
                    </div>
                  )}
                  {sections.complications.length > 0 && (
                    <div>
                      <div className="font-medium text-foreground">Осложнения</div>
                      <div className="text-muted-foreground">{sections.complications.join(" ")}</div>
                    </div>
                  )}
                  {sections.comorbidities.length > 0 && (
                    <div>
                      <div className="font-medium text-foreground">Сопутствующие</div>
                      <div className="text-muted-foreground">{sections.comorbidities.join(" ")}</div>
                    </div>
                  )}
                  {sections.targets.length > 0 && (
                    <div>
                      <div className="font-medium text-foreground">Цели</div>
                      <div className="text-muted-foreground">{sections.targets.join(" ")}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground pt-2">
                {diagnosis.targets?.adjustedBy && diagnosis.targets.adjustedBy.length > 0 && (
                  <p className="mb-2">
                    <strong>Пояснение по целевым уровням:</strong> цели усилены из-за:{' '}
                    <span className="font-medium">{diagnosis.targets.adjustedBy.join(', ')}</span>.
                  </p>
                )}
                <p><strong>Отказ от ответственности:</strong> Этот инструмент предназначен для помощи медицинским работникам и не заменяет клиническое суждение. Все диагнозы должны быть подтверждены квалифицированным врачом.</p>
            </div>

            <Button onClick={onReset} className="w-full mt-4">
             Начать заново
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
