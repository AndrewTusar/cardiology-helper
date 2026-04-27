import type { DiagnosisFormValues } from './schemas';

export interface DiagnosisResult {
  fullDiagnosis: string;
  baseDiagnosis: string;
  hypertensionStage: string;
  hypertensionGrade: string;
  risk: string;
  comorbidities: string[];
  targets?: TargetLevels;
  sections?: DiagnosisSections;
  copyText?: string;
}

export interface DiagnosisSections {
  primary: string[];
  background: string[];
  complications: string[];
  comorbidities: string[];
  targets: string[];
}

export interface TargetLevels {
  ldl: {
    target: string;
    note?: string;
  };
  bloodPressure: {
    target: string;
    diagnosis?: string;
    note?: string;
  };
  glucose: {
    target: string;
    diagnosis?: string;
    note?: string;
  };
  adjustedBy?: string[];
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
    const {
        systolic,
        diastolic,
        miHistory,
        strokeHistory,
        peripheralArteryDisease,
        diabetes,
        lvh,
        hypertensiveRetinopathy,
        onTherapy,
        maxSystolic,
        maxDiastolic,
        height,
        weight,
    } = data;
    
    const diagnosticSystolic = onTherapy && maxSystolic ? maxSystolic : systolic;
    const diagnosticDiastolic = onTherapy && maxDiastolic ? maxDiastolic : diastolic;

    // РФ рекомендации: степень АГ указывается при впервые диагностированной АГ.
    // Если пациент на терапии — отражаем контроль АД (контролируемая/неконтролируемая АГ).
    let grade = 'Степень АГ 0';
    if (onTherapy) {
        const isControlledNow = systolic < 140 && diastolic < 90;
        grade = isControlledNow ? 'Контролируемая АГ' : 'Неконтролируемая АГ';
    } else {
        if (diagnosticSystolic >= 180 || diagnosticDiastolic >= 110) {
            grade = 'Степень АГ 3';
        } else if (diagnosticSystolic >= 160 || diagnosticDiastolic >= 100) {
            grade = 'Степень АГ 2';
        } else if (diagnosticSystolic >= 140 || diagnosticDiastolic >= 90) {
            grade = 'Степень АГ 1';
        }
    }
    
    const bmi = calculateBMI(height, weight);
    const isObesityStage3 = bmi >= 40;

    const hasEstablishedCVD = miHistory || strokeHistory || peripheralArteryDisease;
    const ckdIsSevere = gfr < 60;
    const hasSevereComorbidity = diabetes || ckdIsSevere;
    const hasTargetOrganDamage = lvh || hypertensiveRetinopathy || isObesityStage3;

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
    const { age, gender, smoking, systolic, dyslipidemia, diabetes, familyHistory, height, weight } = data;
    
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
    if (familyHistory) {
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

const parseRiskLevel = (risk: string): 1 | 2 | 3 | 4 | null => {
    const match = risk.match(/Риск\s+([1-4])/);
    if (!match) return null;
    const level = Number(match[1]);
    if (level === 1 || level === 2 || level === 3 || level === 4) return level;
    return null;
};

const getTargetsForPatient = (data: DiagnosisFormValues, risk: string): TargetLevels => {
    const declaredLevel = parseRiskLevel(risk);

    // Усиление строгости целей для “особых групп”, даже если скоринг риска дал ниже.
    // Это не меняет рассчитанный risk, только подбирает более уместные цели.
    const { miHistory, strokeHistory, peripheralArteryDisease, diabetes, creatinine, ckdAlbuminuria, onDialysis, chfStage, chfNYHA } = data;

    const gfr = calculateGFR(data.age, data.gender, creatinine || 80);
    const hasCKD = gfr < 60 || (ckdAlbuminuria && ckdAlbuminuria !== 'none') || !!onDialysis;
    const ckdSevere = onDialysis || gfr < 30 || ckdAlbuminuria === 'A3';

    const hasCHF =
        (chfStage && chfStage !== 'none') ||
        (chfNYHA && chfNYHA !== 'none');
    const chfSevere = chfNYHA === 'III' || chfNYHA === 'IV' || chfStage === 'III';

    let elevatedLevel: 1 | 2 | 3 | 4 | null = declaredLevel;
    const adjustedBy: string[] = [];
    const bumpTo = (lvl: 3 | 4) => {
        if (elevatedLevel === null) {
            elevatedLevel = lvl;
            return;
        }
        elevatedLevel = (Math.max(elevatedLevel, lvl) as 1 | 2 | 3 | 4);
    };

    if (miHistory) {
        bumpTo(4);
        adjustedBy.push('перенесённый ИМ');
    }
    if (strokeHistory) {
        bumpTo(4);
        adjustedBy.push('инсульт/ТИА в анамнезе');
    }
    if (peripheralArteryDisease) {
        bumpTo(4);
        adjustedBy.push('заболевание периферических артерий');
    }
    if (ckdSevere) {
        bumpTo(4);
        adjustedBy.push('тяжёлая ХБП (СКФ < 30 / A3 / диализ)');
    }
    if (chfSevere) {
        bumpTo(4);
        adjustedBy.push('тяжёлая ХСН (NYHA III–IV / стадия III)');
    }

    if (diabetes) {
        bumpTo(3);
        adjustedBy.push('сахарный диабет');
    }
    if (hasCKD && !ckdSevere) {
        bumpTo(3);
        adjustedBy.push('ХБП');
    }
    if (hasCHF && !chfSevere) {
        bumpTo(3);
        adjustedBy.push('ХСН');
    }

    const level = elevatedLevel;

    // Липиды (ЛПНП, ммоль/л): ориентиры, используемые в клинической практике РФ для стратификации риска.
    const ldl =
        level === 4
            ? { target: '< 1.4 ммоль/л', note: 'и снижение ≥50% от исходного (если возможно)' }
            : level === 3
              ? { target: '< 1.8 ммоль/л', note: 'и снижение ≥50% от исходного (если возможно)' }
              : level === 2
                ? { target: '< 2.6 ммоль/л' }
                : { target: '< 3.0 ммоль/л' };

    // Артериальное давление: базовая цель <140/90; при высоком/очень высоком риске — более строгая цель при переносимости.
    const bloodPressure =
        level === 4
            ? {
                  target: '130–139/<80 мм рт. ст.',
                  diagnosis: '130–139/<80 мм рт. ст.',
                  note: 'если переносится; иначе <140/<90',
              }
            : level === 3
              ? {
                    target: '< 130/80 мм рт. ст.',
                    diagnosis: '<130/<80 мм рт. ст.',
                    note: 'если переносится; иначе <140/<90',
                }
              : {
                    target: '< 140/90 мм рт. ст.',
                    diagnosis: '<140/<90 мм рт. ст.',
                };

    // Глюкоза: приложение не собирает лабораторные значения, поэтому выводим клинические ориентиры.
    // Для РФ более привычные пороги: HbA1c ~ <6.0% как "норма", глюкоза натощак <6.1 ммоль/л.
    const glucose = data.diabetes
        ? {
              target: 'HbA1c ≤ 7.5%',
              diagnosis: 'целевой уровень гликированного гемоглобина ≤7,5%',
              note: 'индивидуализировать; глюкоза натощак 4.4–7.2 ммоль/л',
          }
        : data.glucoseTolerance
          ? { target: 'HbA1c < 6.0%', note: 'глюкоза натощак < 6.1 ммоль/л (если достижимо)' }
          : { target: 'HbA1c < 6.0%', note: 'глюкоза натощак < 6.1 ммоль/л' };

    return { ldl, bloodPressure, glucose, adjustedBy: adjustedBy.length > 0 ? adjustedBy : undefined };
};

const formatTargetsForDiagnosis = (targets: TargetLevels): string => {
    // Форматируем как отдельный элемент диагноза, чтобы врач мог копировать целиком.
    const bp = targets.bloodPressure.diagnosis || targets.bloodPressure.target;
    return `Целевое АД ${bp}.`;
};

const sentence = (text: string): string => {
    const t = text.trim();
    if (!t) return '';
    if (/[.!?]$/.test(t)) return t;
    return `${t}.`;
};

const buildCopyText = (sections: DiagnosisSections): string => {
    const lines: string[] = [];
    if (sections.primary.length > 0) lines.push(`Основное заболевание: ${sections.primary.join(' ')}`);
    if (sections.background.length > 0) lines.push(`Фоновое заболевание: ${sections.background.join(' ')}`);
    if (sections.complications.length > 0) lines.push(`Осложнения: ${sections.complications.join(' ')}`);
    if (sections.comorbidities.length > 0) lines.push(`Сопутствующие: ${sections.comorbidities.join(' ')}`);
    if (sections.targets.length > 0) lines.push(`Цели: ${sections.targets.join(' ')}`);
    return lines.join('\n');
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
    const {
        complaints,
        anginaClass,
        miHistory,
        miYear,
        dyslipidemia,
        glucoseTolerance,
        creatinine,
        ckdAlbuminuria,
        onTherapy,
        ejectionFraction,
        chfStage,
        chfNYHA,
        onDialysis,
        lvh,
        atrialFibrillation,
        strokeHistory,
        peripheralArteryDisease,
        hypertensiveRetinopathy,
        fastingGlucose,
        hba1c,
    } = data;
    
    const bmi = calculateBMI(data.height, data.weight);
    const obesityStage = getObesityStage(bmi);
    const metabolicPhenotype = getMetabolicPhenotype(data, bmi);
    
    const gfr = calculateGFR(data.age, data.gender, creatinine || 80);
    const ckdStage = getCKDStageFromGFR(gfr);

    const isIBS = complaints.includes('chestPain') || miHistory;
    
    const { stage, grade } = getHypertensionStageAndGrade(data, gfr);
    const isHypertensive = stage !== '0 стадии';

    const risk = isHypertensive ? calculateCardiovascularRisk(data, stage) : 'Нет';
    const targets = isHypertensive ? getTargetsForPatient(data, risk) : undefined;

    const sections: DiagnosisSections = {
        primary: [],
        background: [],
        complications: [],
        comorbidities: [],
        targets: [],
    };

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
        const diabetesLabel =
            data.diabetesType === '1'
                ? 'Сахарный диабет 1-го типа'
                : data.diabetesType === 'unknown'
                  ? 'Сахарный диабет (тип не уточнен)'
                  : 'Сахарный диабет 2-го типа';

        if (targets?.glucose?.diagnosis) {
            comorbidities.push(`${diabetesLabel}, ${targets.glucose.diagnosis}`);
        } else {
            comorbidities.push(diabetesLabel);
        }
        if (typeof hba1c === 'number') {
            comorbidities.push(`HbA1c ${hba1c.toFixed(1)}%`);
        }
        if (typeof fastingGlucose === 'number') {
            comorbidities.push(`Глюкоза натощак ${fastingGlucose.toFixed(1)} ммоль/л`);
        }
    } else if (glucoseTolerance) {
        comorbidities.push('Нарушение толерантности к глюкозе');
        if (typeof hba1c === 'number') {
            comorbidities.push(`HbA1c ${hba1c.toFixed(1)}%`);
        }
        if (typeof fastingGlucose === 'number') {
            comorbidities.push(`Глюкоза натощак ${fastingGlucose.toFixed(1)} ммоль/л`);
        }
    } else {
        if (typeof hba1c === 'number') {
            comorbidities.push(`HbA1c ${hba1c.toFixed(1)}%`);
        }
        if (typeof fastingGlucose === 'number') {
            comorbidities.push(`Глюкоза натощак ${fastingGlucose.toFixed(1)} ммоль/л`);
        }
    }

    const hasCKD = gfr < 60 || (ckdAlbuminuria && ckdAlbuminuria !== 'none');
    if (hasCKD) {
        let ckdString = `ХБП ${ckdStage}`;
        ckdString += ` (СКФ ${gfr} мл/мин/1.73м²)`;
        if (ckdAlbuminuria && ckdAlbuminuria !== 'none') {
            ckdString += ` ${ckdAlbuminuria}`;
        }
        sections.complications.push(sentence(ckdString));
        if (ckdStage === 'C5' && onDialysis) {
            sections.complications.push(sentence('ЗПТ (гемодиализ)'));
        }
    }
    if (lvh) sections.complications.push(sentence('ГЛЖ'));
    if (hypertensiveRetinopathy) sections.complications.push(sentence('Гипертоническая ретинопатия'));
    if (atrialFibrillation) sections.complications.push(sentence('Фибрилляция предсердий'));
    if (strokeHistory) sections.complications.push(sentence('Инсульт/ТИА в анамнезе'));
    if (peripheralArteryDisease) sections.complications.push(sentence('Заболевание периферических артерий (ЗПА)'));

    if (chfStage && chfStage !== 'none' && chfNYHA && chfNYHA !== 'none') {
        let chfString = `ХСН ${chfStage} стадии, ФК ${chfNYHA}`;
        if (ejectionFraction) {
            chfString += ` ${getEjectionFractionClassification(ejectionFraction)} (ФВ ${ejectionFraction}%)`;
        }
        sections.complications.push(sentence(chfString));
    }

    let baseDiagnosis = 'Нет';
    const hypertensionPhraseParts: string[] = [];
    if (isHypertensive) {
        hypertensionPhraseParts.push(sentence(`ГБ ${stage}`));
        if (grade !== 'Степень АГ 0') hypertensionPhraseParts.push(sentence(grade));
        hypertensionPhraseParts.push(sentence(risk));
        if (targets) sections.targets.push(sentence(formatTargetsForDiagnosis(targets)));
    }

    if (isIBS) {
        baseDiagnosis = 'ИБС';
        sections.primary.push(sentence('ИБС'));
        if (complaints.includes('chestPain')) {
            const klass = anginaClass && anginaClass !== 'none' ? ` ${anginaClass} ФК` : '';
            sections.primary.push(sentence(`Стенокардия напряжения${klass}`));
        }
        if (miHistory) {
            const miString = miYear ? `Постинфарктный кардиосклероз (${miYear}г)` : 'Постинфарктный кардиосклероз';
            sections.primary.push(sentence(miString));
        }
        if (hypertensionPhraseParts.length > 0) sections.background.push(...hypertensionPhraseParts);
    } else if (isHypertensive) {
        baseDiagnosis = 'ГБ';
        sections.primary.push(...hypertensionPhraseParts);
    } else {
        baseDiagnosis = 'Нет';
        sections.primary.push(sentence('Здоров(а)'));
    }
    
    let finalComorbidities = [...comorbidities];
    if (data.diabetes) {
        finalComorbidities = finalComorbidities.filter(c => c !== 'Нарушение толерантности к глюкозе');
    }

    if (finalComorbidities.length > 0) {
        sections.comorbidities.push(...finalComorbidities.filter(c => c).map(c => sentence(c)));
    }

    const flatParts = [
        ...sections.primary,
        ...sections.background,
        ...sections.complications,
        ...sections.comorbidities,
        ...sections.targets,
    ].filter(Boolean);

    const fullDiagnosis = flatParts.join(' ');
    const isTotallyHealthy = sections.primary.join(' ').includes('Здоров(а)');
    
    return {
        fullDiagnosis,
        baseDiagnosis: isTotallyHealthy ? 'Нет' : baseDiagnosis,
        hypertensionStage: isHypertensive ? stage : 'Нет',
        hypertensionGrade: isHypertensive ? grade : 'Нет',
        risk: risk,
        comorbidities: finalComorbidities,
        targets,
        sections,
        copyText: buildCopyText(sections),
    };
};
