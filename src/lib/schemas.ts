import { z } from 'zod';

export const diagnosisFormSchema = z.object({
  gender: z.enum(['male', 'female']),
  age: z.number().min(18).max(100),
  height: z.number().min(140).max(220),
  weight: z.number().min(40).max(200),
  waist: z.number().min(50).max(150),
  
  systolic: z.number().min(50).max(250),
  diastolic: z.number().min(30).max(150),
  heartRate: z.number().min(40).max(180),

  maxSystolic: z.number().min(90).max(300).optional(),
  maxDiastolic: z.number().min(60).max(200).optional(),
  
  complaints: z.array(z.string()),
  anginaClass: z.enum(['none', 'I', 'II', 'III', 'IV']).default('none'),

  onTherapy: z.boolean(),

  smoking: z.boolean(),
  diabetes: z.boolean(),
  diabetesType: z.enum(['unknown', '1', '2']).default('2'),
  dyslipidemia: z.boolean(),
  familyHistory: z.boolean(),
  miHistory: z.boolean(),
  miYear: z.number().optional(),

  totalCholesterol: z.number().min(1).max(20).optional(),
  triglycerides: z.number().min(0.1).max(25).optional(),
  ldlCholesterol: z.number().min(0.1).max(15).optional(),
  hdlCholesterol: z.number().min(0.1).max(4).optional(),

  // Лабораторные показатели (опционально, для более точной формулировки и контроля целей)
  fastingGlucose: z.number().min(1).max(40).optional(), // ммоль/л
  hba1c: z.number().min(3).max(20).optional(), // %

  lvh: z.boolean(), // Left Ventricular Hypertrophy
  creatinine: z.number().min(20).max(2000).default(80),
  ckdAlbuminuria: z.string().default('none'),
  onDialysis: z.boolean().default(false),
  glucoseTolerance: z.boolean(),

  // ССЗ и ПОМ (дополнительные уточняющие пункты)
  atrialFibrillation: z.boolean().default(false),
  strokeHistory: z.boolean().default(false),
  peripheralArteryDisease: z.boolean().default(false),
  hypertensiveRetinopathy: z.boolean().default(false),
  
  ejectionFraction: z.number().min(10).max(80).optional(),
  chfStage: z.string().optional().default('none'),
  chfNYHA: z.string().optional().default('none'),
});

export type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>;
