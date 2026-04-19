"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { DiagnosisResult as DiagnosisResultType } from "@/lib/diagnosis-logic";

interface DiagnosisResultProps {
  diagnosis: DiagnosisResultType;
  onReset: () => void;
}

export function DiagnosisResult({ diagnosis, onReset }: DiagnosisResultProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Результат Диагностики</CardTitle>
        <CardDescription>Ниже представлен предварительный диагноз, основанный на введенных данных.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg border">
                <p className="text-sm font-medium">{diagnosis.fullDiagnosis}</p>
            </div>
            
            <Separator />

            <div>
                <h3 className="font-semibold mb-2">Компоненты диагноза:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Основной диагноз: {diagnosis.baseDiagnosis}</li>
                    <li>Стадия ГБ: {diagnosis.hypertensionStage}</li>
                    <li>Степень АГ: {diagnosis.hypertensionGrade}</li>
                    <li>Риск: {diagnosis.risk}</li>
                    {diagnosis.comorbidities.length > 0 && (
                        <li>Сопутствующие заболевания: {diagnosis.comorbidities.join(', ')}</li>
                    )}
                </ul>
            </div>
            
            <Separator />

            <div className="text-xs text-muted-foreground pt-2">
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
