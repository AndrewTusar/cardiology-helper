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

  onTherapy: z.boolean(),

  smoking: z.boolean(),
  diabetes: z.boolean(),
  dyslipidemia: z.boolean(),
  familyHistory: z.boolean(),
  miHistory: z.boolean(),
  miYear: z.number().optional(),

  totalCholesterol: z.number().min(1).max(20).optional(),
  triglycerides: z.number().min(0.1).max(25).optional(),
  ldlCholesterol: z.number().min(0.1).max(15).optional(),
  hdlCholesterol: z.number().min(0.1).max(4).optional(),

  lvh: z.boolean(), // Left Ventricular Hypertrophy
  creatinine: z.number().min(20).max(2000).default(80),
  ckdAlbuminuria: z.string().default('none'),
  onDialysis: z.boolean().default(false),
  glucoseTolerance: z.boolean(),
  
  ejectionFraction: z.number().min(10).max(80).optional(),
  chfStage: z.string().optional().default('none'),
  chfNYHA: z.string().optional().default('none'),
});

export type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>;
