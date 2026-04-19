"use client";

import { useState, Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diagnosisFormSchema, type DiagnosisFormValues } from '@/lib/schemas';
import { generateDiagnosis, type DiagnosisResult as DiagnosisResultType } from '@/lib/diagnosis-logic';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DiagnosisResult } from '@/components/diagnosis-result';
import { calculateBMI, getObesityStage, calculateGFR, getCKDStageFromGFR } from '@/lib/diagnosis-logic';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

const steps = [
  { id: '01', title: 'Биометрия', fields: ['gender', 'age', 'height', 'weight', 'waist'] },
  { id: '02', title: 'Жизненные показатели и жалобы', fields: ['systolic', 'diastolic', 'heartRate', 'complaints'] },
  { id: '03', title: 'Факторы риска и анамнез', fields: ['onTherapy', 'maxSystolic', 'maxDiastolic', 'smoking', 'diabetes', 'dyslipidemia', 'totalCholesterol', 'triglycerides', 'ldlCholesterol', 'hdlCholesterol', 'familyHistory', 'miHistory', 'miYear'] },
  { id: '04', title: 'Осложнения и сопутствующие заболевания', fields: ['lvh', 'creatinine', 'ckdAlbuminuria', 'onDialysis', 'glucoseTolerance', 'ejectionFraction', 'chfStage', 'chfNYHA'] },
];

const complaintOptions = [
  { id: 'chestPain', label: 'Боль в груди' },
  { id: 'shortnessOfBreath', label: 'Одышка' },
  { id: 'palpitations', label: 'Сердцебиение' },
  { id: 'dizziness', label: 'Головокружение, головные боли' },
  { id: 'edema', label: 'Отеки лодыжек' },
  { id: 'noComplaints', label: 'Жалоб нет' },
];

const riskFactorOptions = [
  { id: 'smoking', label: 'Курение' },
  { id: 'diabetes', label: 'Сахарный диабет' },
  { id: 'dyslipidemia', label: 'Дислипидемия (известное повышение холестерина)' },
  { id: 'familyHistory', label: 'Семейный анамнез ССЗ' },
  { id: 'miHistory', label: 'Перенесенный инфаркт миокарда' },
];

const complicationOptions = [
    { id: 'lvh', label: 'ГЛЖ (гипертрофия левого желудочка)' },
    { id: 'glucoseTolerance', label: 'Нарушение толерантности к глюкозе' },
];

const ckdAlbuminuriaOptions = [
    { value: 'none', label: 'Нет' },
    { value: 'A1', label: 'A1 (<30 мг/г)' },
    { value: 'A2', label: 'A2 (30-300 мг/г)' },
    { value: 'A3', label: 'A3 (>300 мг/г)' },
];

const chfStageOptions = [
    { value: 'none', label: 'Нет' },
    { value: 'I', label: 'I стадия' },
    { value: 'II A', label: 'II А стадия' },
    { value: 'II B', label: 'II Б стадия' },
    { value: 'III', label: 'III стадия' },
];

const chfNyhaOptions = [
    { value: 'none', label: 'Нет' },
    { value: 'I', label: 'ФК I' },
    { value: 'II', label: 'ФК II' },
    { value: 'III', label: 'ФК III' },
    { value: 'IV', label: 'ФК IV' },
];


export function DiagnosticWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResultType | null>(null);

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    defaultValues: {
      gender: 'male',
      age: 40,
      height: 175,
      weight: 75,
      waist: 80,
      systolic: 120,
      diastolic: 80,
      heartRate: 70,
      maxSystolic: 140,
      maxDiastolic: 90,
      complaints: [],
      onTherapy: false,
      smoking: false,
      diabetes: false,
      dyslipidemia: false,
      totalCholesterol: 5.0,
      triglycerides: 1.7,
      ldlCholesterol: 3.0,
      hdlCholesterol: 1.2,
      familyHistory: false,
      miHistory: false,
      miYear: new Date().getFullYear(),
      lvh: false,
      creatinine: 80,
      ckdAlbuminuria: 'none',
      onDialysis: false,
      glucoseTolerance: false,
      ejectionFraction: 55,
      chfStage: 'none',
      chfNYHA: 'none',
    },
  });

  const { watch } = form;
  const height = watch('height');
  const weight = watch('weight');
  const onTherapy = watch('onTherapy');
  const miHistory = watch('miHistory');
  const dyslipidemia = watch('dyslipidemia');
  const complaints = watch('complaints');
  const showChfFields = complaints.includes('shortnessOfBreath');

  const age = watch('age');
  const gender = watch('gender');
  const creatinine = watch('creatinine');

  const bmi = calculateBMI(height, weight);
  const obesityStage = getObesityStage(bmi);
  const gfr = calculateGFR(age, gender, creatinine || 80);
  const ckdStage = getCKDStageFromGFR(gfr);

  async function processForm(data: DiagnosisFormValues) {
    const result = generateDiagnosis(data);
    setDiagnosis(result);
  }
  
  const next = async () => {
    const fields = steps[currentStep].fields;
    const output = await form.trigger(fields as any, { shouldFocus: true });
    if (!output) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    } else {
      await form.handleSubmit(processForm)();
    }
  };
  
  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const reset = () => {
    form.reset();
    setDiagnosis(null);
    setCurrentStep(0);
  }

  if (diagnosis) {
    return <DiagnosisResult diagnosis={diagnosis} onReset={reset} />;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-3xl font-bold text-slate-900">Диагностический Мастер</CardTitle>
        <CardDescription className="text-base font-semibold text-blue-500/80">
          Шаг {currentStep + 1} из {steps.length}: {steps[currentStep].title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processForm)} className="space-y-6">
            {currentStep === 0 && (
              <section className="space-y-6">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Пол</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="male" /></FormControl>
                            <FormLabel className="font-normal">Мужской</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="female" /></FormControl>
                            <FormLabel className="font-normal">Женский</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Возраст: {field.value} лет</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={18} max={100} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Рост: {field.value} см</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={140} max={220} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Вес: {field.value} кг</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={40} max={200} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Объем талии: {field.value} см</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={50} max={150} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <Separator />
                <div className="text-center">
                    <p className="font-semibold">ИМТ: {bmi.toFixed(1)} кг/м²</p>
                    <p className="text-muted-foreground">{obesityStage}</p>
                </div>

              </section>
            )}

            {currentStep === 1 && (
              <section className="space-y-6">
                <FormField
                  control={form.control}
                  name="systolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Систолическое АД (на момент осмотра): {field.value} мм.рт.ст.</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={50} max={250} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Диастолическое АД (на момент осмотра): {field.value} мм.рт.ст.</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={30} max={150} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-slate-900">Пульс: {field.value} уд/мин</FormLabel>
                      <FormControl>
                        <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value]} min={40} max={180} step={1} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                 <Separator />
                <FormField
                    control={form.control}
                    name="complaints"
                    render={({ field }) => (
                        <FormItem>
                            <div className="mb-4">
                                <FormLabel className="text-base">Жалобы</FormLabel>
                            </div>
                            {complaintOptions.map((item) => (
                                <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                                let newComplaints: string[];
                                                if (checked) {
                                                    if (item.id === 'noComplaints') {
                                                        newComplaints = ['noComplaints'];
                                                    } else {
                                                        newComplaints = [...(field.value?.filter(c => c !== 'noComplaints') || []), item.id];
                                                    }
                                                } else {
                                                    newComplaints = field.value?.filter(c => c !== item.id) || [];
                                                }
                                                field.onChange(newComplaints);
                                            }}
                                            disabled={item.id !== 'noComplaints' && field.value?.includes('noComplaints')}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {item.label}
                                    </FormLabel>
                                </FormItem>
                            ))}
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-4">
                 <div className="space-y-4">
                    <FormLabel className="text-base">Антигипертензивная терапия</FormLabel>
                    <FormField
                         key="onTherapy"
                         control={form.control}
                         name="onTherapy"
                         render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                 <FormControl>
                                     <Checkbox
                                         checked={field.value as boolean}
                                         onCheckedChange={field.onChange}
                                     />
                                 </FormControl>
                                 <FormLabel className="font-normal">Пациент на терапии</FormLabel>
                             </FormItem>
                         )}
                     />
                     {onTherapy && (
                        <div className="space-y-4 pt-4 pl-6">
                            <p className="text-sm font-medium">Максимальное зарегистрированное АД в анамнезе</p>
                            <FormField
                                control={form.control}
                                name="maxSystolic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Систолическое АД: {field.value} мм.рт.ст.</FormLabel>
                                        <FormControl>
                                            <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value || 140]} min={90} max={300} step={1} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxDiastolic"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Диастолическое АД: {field.value} мм.рт.ст.</FormLabel>
                                        <FormControl>
                                            <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value || 90]} min={60} max={200} step={1} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                     )}
                 </div>

                 <Separator/>
                 
                 <FormLabel className="text-base">Факторы риска</FormLabel>
                 {riskFactorOptions.map((item) => (
                     <Fragment key={item.id}>
                         <FormField
                             control={form.control}
                             name={item.id as keyof DiagnosisFormValues}
                             render={({ field }) => (
                                 <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                     <FormControl>
                                         <Checkbox
                                             checked={field.value as boolean}
                                             onCheckedChange={field.onChange}
                                         />
                                     </FormControl>
                                     <FormLabel className="font-normal">{item.label}</FormLabel>
                                 </FormItem>
                             )}
                         />
                         {item.id === 'dyslipidemia' && dyslipidemia && (
                            <div className="space-y-4 pt-4 pl-6 border-l-2 ml-3">
                                <p className="text-sm font-medium">Липидный профиль (ммоль/л)</p>
                                <FormField
                                    control={form.control}
                                    name="totalCholesterol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Общий холестерин: {field.value?.toFixed(1)}</FormLabel>
                                            <FormControl>
                                                <Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value || 5.0]} min={1} max={20} step={0.1} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="triglycerides"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Триглицериды: {field.value?.toFixed(1)}</FormLabel>
                                            <FormControl>
                                                <Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value || 1.7]} min={0.1} max={25} step={0.1} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="ldlCholesterol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ЛПНП: {field.value?.toFixed(1)}</FormLabel>
                                            <FormControl>
                                                <Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value || 3.0]} min={0.1} max={15} step={0.1} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="hdlCholesterol"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ЛПВП: {field.value?.toFixed(1)}</FormLabel>
                                            <FormControl>
                                                <Slider onValueChange={(v) => field.onChange(v[0])} value={[field.value || 1.2]} min={0.1} max={4} step={0.1} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                         )}
                         {item.id === 'miHistory' && miHistory && (
                             <FormField
                                control={form.control}
                                name="miYear"
                                render={({ field }) => (
                                    <FormItem className="pl-9 pr-3 pt-2">
                                        <FormLabel>Год инфаркта: {field.value}</FormLabel>
                                        <FormControl>
                                            <Slider
                                                onValueChange={(value) => field.onChange(value[0])}
                                                value={[field.value || new Date().getFullYear()]}
                                                min={1950}
                                                max={2030}
                                                step={1}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                         )}
                     </Fragment>
                 ))}
              </section>
            )}

            {currentStep === 3 && (
                 <section className="space-y-4">
                    <FormLabel className="text-base">Осложнения и сопутствующие заболевания</FormLabel>
                    {complicationOptions.map((item) => (
                        <FormField
                            key={item.id}
                            control={form.control}
                            name={item.id as keyof DiagnosisFormValues}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value as boolean}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                            )}
                        />
                    ))}
                    <Separator />
                    <FormField
                        control={form.control}
                        name="creatinine"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Креатинин сыворотки: {field.value} мкмоль/л</FormLabel>
                                <FormControl>
                                    <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value || 80]} min={20} max={1500} step={1} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                     <div className="text-sm p-3 bg-muted/50 rounded-lg space-y-1">
                        <p>Расчетная СКФ (CKD-EPI): <span className="font-semibold">{gfr} мл/мин/1.73м²</span></p>
                        <p>Стадия ХБП (по СКФ): <span className="font-semibold">{ckdStage}</span></p>
                    </div>
                    <FormField
                        control={form.control}
                        name="ckdAlbuminuria"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Уровень альбуминурии</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {ckdAlbuminuriaOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {ckdStage === 'C5' && (
                        <FormField
                            control={form.control}
                            name="onDialysis"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-2 pl-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        Пациент на заместительной почечной терапии (гемодиализ)
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    )}
                    <Separator />
                    {showChfFields && (
                        <div className="space-y-4 pt-2">
                             <FormLabel className="text-base">Хроническая сердечная недостаточность (ХСН)</FormLabel>
                             <FormField
                                control={form.control}
                                name="ejectionFraction"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Фракция выброса: {field.value}% (ФВ)</FormLabel>
                                        <FormControl>
                                            <Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value || 55]} min={10} max={80} step={1} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="chfStage"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormLabel>Стадия ХСН (по Василенко-Стражеско)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5">
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="space-y-2 text-sm">
                                                        <p><strong>I стадия:</strong> Начальная стадия. Симптомы (одышка, сердцебиение) появляются только при значительной физической нагрузке. В покое симптомов нет.</p>
                                                        <p><strong>II А стадия:</strong> Клинически выраженная стадия. Застойные явления в одном из кругов кровообращения (малом или большом). Одышка при умеренной нагрузке.</p>
                                                        <p><strong>II Б стадия:</strong> Тяжелая стадия. Застойные явления в обоих кругах кровообращения. Одышка в покое.</p>
                                                        <p><strong>III стадия:</strong> Конечная, дистрофическая стадия. Тяжелые нарушения гемодинамики, необратимые изменения в органах.</p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <Select 
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                const currentNyha = form.getValues('chfNYHA');
                                                if (value === 'I' && (currentNyha === 'III' || currentNyha === 'IV')) {
                                                    form.setValue('chfNYHA', 'II');
                                                } else if (value === 'II A' && (currentNyha === 'I' || currentNyha === 'IV')) {
                                                    form.setValue('chfNYHA', 'II');
                                                } else if (value === 'II B' && (currentNyha === 'I' || currentNyha === 'II')) {
                                                    form.setValue('chfNYHA', 'III');
                                                } else if (value === 'III' && currentNyha !== 'IV') {
                                                    form.setValue('chfNYHA', 'IV');
                                                }
                                            }} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {chfStageOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="chfNYHA"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <FormLabel>Функциональный класс (по NYHA)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5">
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80">
                                                    <div className="space-y-2 text-sm">
                                                        <p><strong>ФК I:</strong> Нет ограничений физической активности. Обычная нагрузка не вызывает симптомов.</p>
                                                        <p><strong>ФК II:</strong> Легкое ограничение активности. Комфортно в покое, но обычная активность вызывает одышку, сердцебиение.</p>
                                                        <p><strong>ФК III:</strong> Выраженное ограничение активности. Комфортно в покое, но малейшая активность вызывает симптомы.</p>
                                                        <p><strong>ФК IV:</strong> Неспособность выполнять любую нагрузку без дискомфорта. Симптомы присутствуют в покое.</p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <Select 
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                const currentStage = form.getValues('chfStage');
                                                if (value === 'I' && (currentStage === 'II A' || currentStage === 'II B' || currentStage === 'III')) {
                                                    form.setValue('chfStage', 'I');
                                                } else if (value === 'II' && (currentStage === 'II B' || currentStage === 'III')) {
                                                    form.setValue('chfStage', 'II A');
                                                } else if (value === 'III' && (currentStage === 'I' || currentStage === 'III')) {
                                                    form.setValue('chfStage', 'II B');
                                                } else if (value === 'IV' && currentStage !== 'III') {
                                                    form.setValue('chfStage', 'III');
                                                }
                                            }} 
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {chfNyhaOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                 </section>
            )}

          </form>
        </Form>
        <div className="mt-8 flex justify-between">
          <Button onClick={prev} disabled={currentStep === 0} variant="outline" className="bg-slate-100/50 text-slate-700 border-slate-200 px-8 hover:bg-slate-100">
            Назад
          </Button>
          <Button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            {currentStep === steps.length - 1 ? 'Сформулировать диагноз' : 'Далее'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
