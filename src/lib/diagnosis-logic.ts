import type { DiagnosisFormValues } from './schemas';

export interface DiagnosisResult {
  fullDiagnosis: string;
  baseDiagnosis: string;
  hypertensionStage: string;
  hypertensionGrade: string;
  risk: string;
  comorbidities: string[];
}

export const calculateBMI = (height: number, weight: number): number => {
    if (height === 0) return 0;
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
};

export const getObesityStage = (bmi: number): string => {
    if (bmi < 18.5) return 'Дефицит массы тела';
    if (bmi < 25) return 'Нормальная масса тела';
    if (bmi < 30) return 'Избыточная масса тела';
    if (bmi < 35) return 'Ожирение I степени';
    if (bmi < 40) return 'Ожирение II степени';
    return 'Ожирение III степени';
};

export const calculateGFR = (age: number, gender: 'male' | 'female', creatinineUmoll: number): number => {
    if (!creatinineUmoll || creatinineUmoll <= 0) return 999;

    // Convert creatinine from µmol/L to mg/dL for CKD-EPI 2021 formula
    const creatinineMgDl = creatinineUmoll / 88.4;

    const kappa = gender === 'female' ? 0.7 : 0.9;
    const alpha = gender === 'female' ? -0.241 : -0.302;
    const genderFactor = gender === 'female' ? 1.012 : 1.0;

    const gfr = 142 *
        Math.min(creatinineMgDl / kappa, 1) ** alpha *
        Math.max(creatinineMgDl / kappa, 1) ** -1.200 *
        0.9938 ** age *
        genderFactor;

    return Math.round(gfr);
};

export const getCKDStageFromGFR = (gfr: number): string => {
    if (gfr >= 90) return 'C1';
    if (gfr >= 60) return 'C2';
    if (gfr >= 45) return 'C3a';
    if (gfr >= 30) return 'C3b';
    if (gfr >= 15) return 'C4';
    return 'C5';
};

const getMetabolicPhenotype = (data: DiagnosisFormValues, bmi: number): string => {
    const isObese = bmi >= 30;
    if (!isObese) {
        return '';
    }

    const { systolic, diastolic, dyslipidemia, glucoseTolerance, diabetes } = data;

    const hasHypertension = systolic >= 140 || diastolic >= 90;
    const hasGlucoseIssues = glucoseTolerance || diabetes;

    if (hasHypertension || dyslipidemia || hasGlucoseIssues) {
        return 'Метаболически нездоровый фенотип ожирения';
    }

    return 'Метаболически здоровый фенотип ожирения';
};

const getHypertensionStageAndGrade = (data: DiagnosisFormValues, gfr: number): { stage: string, grade: string } => {
    const { systolic, diastolic, miHistory, diabetes, lvh, onTherapy, maxSystolic, maxDiastolic, height, weight } = data;
    
    const diagnosticSystolic = onTherapy && maxSystolic ? maxSystolic : systolic;
    const diagnosticDiastolic = onTherapy && maxDiastolic ? maxDiastolic : diastolic;

    let grade = 'Степень АГ 0';
    if (diagnosticSystolic >= 180 || diagnosticDiastolic >= 110) {
        grade = 'Степень АГ III';
    } else if (diagnosticSystolic >= 160 || diagnosticDiastolic >= 100) {
        grade = 'Степень АГ II';
    } else if (diagnosticSystolic >= 140 || diagnosticDiastolic >= 90) {
        grade = 'Степень АГ I';
    }
    
    const bmi = calculateBMI(height, weight);
    const isObesityStage3 = bmi >= 40;

    const hasEstablishedCVD = miHistory;
    const ckdIsSevere = gfr < 60;
    const hasSevereComorbidity = diabetes || ckdIsSevere;
    const hasTargetOrganDamage = lvh || isObesityStage3;

    let stage = 'I стадии';
    if (hasEstablishedCVD || hasSevereComorbidity) {
        stage = 'III стадии';
    } else if (hasTargetOrganDamage) {
        stage = 'II стадии';
    }

    if (grade === 'Степень АГ 0' && stage === 'I стадии') {
        return { stage: '0 стадии', grade: 'Степень АГ 0' };
    }

    return { stage, grade };
};

const calculateCardiovascularRisk = (data: DiagnosisFormValues, stage: string): string => {
    if (stage === 'III стадии') return 'Риск 4 (очень высокий)';

    let points = 0;
    const { age, gender, smoking, systolic, dyslipidemia, diabetes, height, weight } = data;
    
    const bmi = calculateBMI(height, weight);
    if (bmi >= 30) {
        points += 1;
    }

    if ((gender === 'male' && age >= 55) || (gender === 'female' && age >= 65)) {
        points += 1;
    }
    if (smoking) {
        points += 1;
    }
    if (dyslipidemia) {
        points += 1;
    }
    if (diabetes) {
        points += 1;
    }
    if (systolic >= 160) points += 1;
    if (stage === 'II стадии') {
        points += 1;
    }

    if (points >= 3) return 'Риск 3 (высокий)';
    if (points >= 1) return 'Риск 2 (средний)';
    return 'Риск 1 (низкий)';
};

const getEjectionFractionClassification = (ef: number): string => {
    if (ef >= 50) return 'с сохраненной фракцией выброса';
    if (ef >= 40) return 'с умеренно-сниженной фракцией выброса';
    return 'со сниженной фракцией выброса';
};

const getDyslipidemiaPhenotype = (data: DiagnosisFormValues): string => {
    const { dyslipidemia, ldlCholesterol, triglycerides } = data;
    
    if (!dyslipidemia) return '';

    const ldlIsProvided = typeof ldlCholesterol === 'number';
    const tgIsProvided = typeof triglycerides === 'number';
    
    if (!ldlIsProvided || !tgIsProvided) {
        return 'Дислипидемия (фенотип не уточнен)';
    }

    const ldlHigh = ldlCholesterol > 3.0;
    const tgHigh = triglycerides > 1.7;

    if (ldlHigh && tgHigh) {
        return 'Комбинированная гиперлипидемия (соответствует IIb типу по Фредриксону)';
    }
    if (ldlHigh) {
        return 'Изолированная гиперхолестеринемия (соответствует IIa типу по Фредриксону)';
    }
    if (tgHigh) {
        return 'Изолированная гипертриглицеридемия (соответствует IV типу по Фредриксону)';
    }

    return 'Дислипидемия (без текущего превышения пороговых уровней ЛПНП и ТГ)';
};


export const generateDiagnosis = (data: DiagnosisFormValues): DiagnosisResult => {
    const { complaints, miHistory, miYear, dyslipidemia, glucoseTolerance, creatinine, ckdAlbuminuria, onTherapy, ejectionFraction, chfStage, chfNYHA, onDialysis, lvh } = data;
    
    const bmi = calculateBMI(data.height, data.weight);
    const obesityStage = getObesityStage(bmi);
    const metabolicPhenotype = getMetabolicPhenotype(data, bmi);
    
    const gfr = calculateGFR(data.age, data.gender, creatinine || 80);
    const ckdStage = getCKDStageFromGFR(gfr);

    const isIBS = complaints.includes('chestPain') || miHistory;
    
    const { stage, grade } = getHypertensionStageAndGrade(data, gfr);
    const isHypertensive = stage !== '0 стадии';

    const risk = isHypertensive ? calculateCardiovascularRisk(data, stage) : 'Нет';

    const comorbidities: string[] = [];
    if (obesityStage.includes('Ожирение')) {
        const fullObesityString = metabolicPhenotype 
            ? `${obesityStage}, ${metabolicPhenotype}` 
            : obesityStage;
        comorbidities.push(fullObesityString);
    } else if (obesityStage === 'Избыточная масса тела') {
        comorbidities.push(obesityStage);
    }

    if (dyslipidemia) {
        comorbidities.push(getDyslipidemiaPhenotype(data));
    }
    
    if (data.diabetes) {
        comorbidities.push('Сахарный диабет 2-го типа');
    } else if (glucoseTolerance) {
        comorbidities.push('Нарушение толерантности к глюкозе');
    }

    const hasCKD = gfr < 60 || (ckdAlbuminuria && ckdAlbuminuria !== 'none');
    if (hasCKD) {
        let ckdString = `ХБП ${ckdStage}`;
        ckdString += ` (СКФ ${gfr} мл/мин/1.73м²)`;
        if (ckdAlbuminuria && ckdAlbuminuria !== 'none') {
            ckdString += ` ${ckdAlbuminuria}`;
        }
        comorbidities.push(ckdString);
        if (ckdStage === 'C5' && onDialysis) {
            comorbidities.push('ЗПТ (гемодиализ)');
        }
    }
    if (lvh) comorbidities.push('ГЛЖ');

    if (chfStage && chfStage !== 'none' && chfNYHA && chfNYHA !== 'none') {
        let chfString = `ХСН ${chfStage} стадии, ФК ${chfNYHA}`;
        if (ejectionFraction) {
            chfString += ` ${getEjectionFractionClassification(ejectionFraction)} (ФВ ${ejectionFraction}%)`;
        }
        comorbidities.push(chfString);
    }

    let diagnosisParts: string[] = [];
    if (isIBS) {
        diagnosisParts.push('ИБС.');
        if (complaints.includes('chestPain')) {
            diagnosisParts.push('Стенокардия напряжения.');
        }
        if (miHistory) {
            let miString = 'Перенесенный ИМ.';
            if (miYear) {
                miString = `Перенесенный ИМ (${miYear}).`;
            }
            diagnosisParts.push(miString);
        }
    }

    let baseDiagnosis = 'Нет';
    if (isHypertensive) {
        baseDiagnosis = 'Гипертоническая болезнь';
        diagnosisParts.push(`${baseDiagnosis} ${stage}.`);

        if (grade !== 'Степень АГ 0') {
            diagnosisParts.push(`${grade}.`);
        }
        
        diagnosisParts.push(`${risk}.`);
    }

    if (isIBS) {
        baseDiagnosis = 'ИБС';
    }
    
    let finalComorbidities = [...comorbidities];
    if (data.diabetes) {
        finalComorbidities = finalComorbidities.filter(c => c !== 'Нарушение толерантности к глюкозе');
    }

    if (finalComorbidities.length > 0) {
        diagnosisParts.push(...finalComorbidities.filter(c => c).map(c => `${c}.`));
    }

    if (diagnosisParts.length === 0) {
        diagnosisParts.push('Здоров(а).');
    }

    const fullDiagnosis = diagnosisParts.join(' ');
    const isTotallyHealthy = fullDiagnosis === 'Здоров(а).';
    
    return {
        fullDiagnosis,
        baseDiagnosis: isTotallyHealthy ? 'Нет' : baseDiagnosis,
        hypertensionStage: isHypertensive ? stage : 'Нет',
        hypertensionGrade: isHypertensive ? grade : 'Нет',
        risk: risk,
        comorbidities: finalComorbidities,
    };
};
