"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DiagnosisResult as DiagnosisResultType } from "../lib/logic";

interface DiagnosisResultProps {
  diagnosis: DiagnosisResultType;
  onReset: () => void;
}

export function DiagnosisResult({ diagnosis, onReset }: DiagnosisResultProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const copyText = useMemo(() => diagnosis.copyText || diagnosis.fullDiagnosis, [diagnosis.copyText, diagnosis.fullDiagnosis]);

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
            
            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">💊</span> Рекомендуемая терапия (группы препаратов)
                    </h3>
                    <ul className="space-y-1.5 text-sm text-blue-800 list-disc pl-5">
                        {diagnosis.recommendations.map((rec, index) => {
                            // Simple parser for markdown bold in UI
                            const parts = rec.split('**');
                            return (
                                <li key={index}>
                                    {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
                                </li>
                            );
                        })}
                    </ul>
                    <p className="text-[10px] text-blue-600 mt-2 italic">
                        * Группы препаратов подобраны автоматически на основе КР РФ. Требуется очная консультация врача для подбора дозировок.
                    </p>
                </div>
            )}

            {diagnosis.examinations && diagnosis.examinations.length > 0 && (
                <div className="p-4 bg-green-50/50 border border-green-100 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">🔍</span> Рекомендуемый план обследования
                    </h3>
                    <ul className="space-y-1.5 text-sm text-green-800 list-disc pl-5">
                        {diagnosis.examinations.map((exam, index) => (
                            <li key={index}>{exam}</li>
                        ))}
                    </ul>
                    <p className="text-[10px] text-green-600 mt-2 italic">
                        * Перечень исследований является справочным и соответствует диагностическому минимуму согласно КР РФ.
                    </p>
                </div>
            )}

            <Separator />

            <div className="text-xs text-muted-foreground pt-2">
                {diagnosis.targets?.adjustedBy && diagnosis.targets.adjustedBy.length > 0 && (
                  <p className="mb-2">
                    <strong>Пояснение по целевым уровням:</strong> цели усилены из-за:{' '}
                    <span className="font-medium">{diagnosis.targets.adjustedBy.join(', ')}</span>.
                  </p>
                )}
                <p><strong>Отказ от ответственности:</strong> Этот инструмент предназначен для помощи медицинским работникам и не заменяет клиническое суждение. Все диагнозы должны быть подтверждены квалифицированным врачом.</p>
                
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                  <p className="text-[11px] leading-relaxed">
                    Есть идеи по улучшению или нашли неточность? <br />
                    Поделитесь в нашем сообществе врачей.
                  </p>
                  <a 
                    href="https://t.me/+SnNIuiZBnDE4ZTdi" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1.5 bg-[#229ED9] text-white rounded-md hover:bg-[#1c84b5] transition-colors text-[10px] font-bold flex items-center gap-1.5"
                  >
                    В ТЕЛЕГРАМ
                  </a>
                </div>
            </div>

            <Button onClick={onReset} className="w-full mt-4">
             Начать заново
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
