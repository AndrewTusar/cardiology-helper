"use client";

import { useState } from 'react';
import { DiagnosticWizard as CardiologyWizard } from '@/modules/cardiology/components/diagnostic-wizard';
import { SpecialtySelector } from '@/components/specialty-selector';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-12 bg-slate-50/50">
      <div className="w-full max-w-2xl space-y-6">
        {!activeModule ? (
          <>
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Медицинский Помощник
              </h1>
              <p className="text-slate-500 text-lg">
                Выберите направление для работы с пациентом
              </p>
            </div>
            <SpecialtySelector onSelect={setActiveModule} />
          </>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setActiveModule(null)}
              className="group text-slate-500 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Вернуться в меню
            </Button>
            
            {activeModule === 'cardiology' && <CardiologyWizard />}
            {activeModule === 'pulmonology' && (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                Модуль пульмонологии находится в разработке
              </div>
            )}
          </div>
        )}
        
        <footer className="text-center space-y-3 pt-8">
          <p className="text-sm text-muted-foreground font-medium">
            Разработано для врачей-терапевтов и профильных специалистов
          </p>
          <div className="flex flex-col items-center gap-2">
            <a 
              href="https://t.me/+SnNIuiZBnDE4ZTdi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#229ED9]/10 text-[#229ED9] rounded-full hover:bg-[#229ED9]/20 transition-colors text-sm font-semibold border border-[#229ED9]/20"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.91-1.27 4.85-2.11 5.81-2.51 2.76-1.14 3.33-1.34 3.7-.134.08.03.18.07.26.15z"/>
              </svg>
              Обсудить и предложить идею
            </a>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Medical Helper • Community
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
