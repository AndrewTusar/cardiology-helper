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
  recommendations: string[];
  examinations: string[];
}

export interface DiagnosisSections {
  primary: string[];
  background: string[];
  complications: string[];
  comorbidities: string[];
  targets: string[];
  examinations?: string[];
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

const hasAbdominalObesity = (data: DiagnosisFormValues): boolean => {
    const threshold = data.gender === 'male' ? 94 : 80;
    return data.waist >= threshold;
};

const getMetabolicPhenotype = (data: DiagnosisFormValues, bmi: number): string => {
    const isObese = bmi >= 30;
    const isAbdominalObese = hasAbdominalObesity(data);
    
    if (!isObese && !isAbdominalObese) return '';

    const { systolic, diastolic, dyslipidemia, glucoseTolerance, diabetes } = data;
    const hasHypertension = systolic >= 140 || diastolic >= 90;
    const hasGlucoseIssues = glucoseTolerance || diabetes;

    if (hasHypertension || dyslipidemia || hasGlucoseIssues) {
        return 'Метаболически нездоровый фенотип ожирения';
    }
    return 'Метаболически здоровый фенотип ожирения';
};

const getHypertensionStageAndGrade = (data: DiagnosisFormValues, gfr: number): { stage: string, grade: string } => {
    const { systolic, diastolic, maxSystolic, maxDiastolic, onTherapy, miHistory, strokeHistory, peripheralArteryDisease, diabetes, lvh, creatinine, ckdAlbuminuria } = data;
    
    const isActuallyHypertensive = 
        systolic >= 140 || 
        diastolic >= 90 || 
        (maxSystolic && maxSystolic >= 140) || 
        (maxDiastolic && maxDiastolic >= 90) || 
        onTherapy;

    if (!isActuallyHypertensive) {
        return { stage: '0 стадия', grade: 'Степень АГ 0' };
    }

    let stage = 'I стадия';
    if (miHistory || strokeHistory || peripheralArteryDisease || (creatinine && gfr < 60) || (ckdAlbuminuria && ckdAlbuminuria !== 'none')) {
        stage = 'III стадия';
    } else if (lvh || (diabetes && (data.waist > 0 || systolic >= 140))) {
        stage = 'II стадия';
    }

    let grade = 'Степень АГ 0';
    if (systolic >= 180 || diastolic >= 110) grade = 'Степень АГ 3';
    else if (systolic >= 160 || diastolic >= 100) grade = 'Степень АГ 2';
    else if (systolic >= 140 || diastolic >= 90) grade = 'Степень АГ 1';
    else if (systolic >= 130 || diastolic >= 85) grade = 'Высокое нормальное АД';

    return { stage, grade };
};

const calculateCardiovascularRisk = (data: DiagnosisFormValues, stage: string): string => {
    if (stage === 'III стадия') return 'Риск 4 (очень высокий)';
    let points = 0;
    const { age, gender, smoking, systolic, dyslipidemia, diabetes, familyHistory, height, weight } = data;
    const bmi = calculateBMI(height, weight);
    if (bmi >= 30) points += 1;
    if ((gender === 'male' && age >= 55) || (gender === 'female' && age >= 65)) points += 1;
    if (smoking) points += 1;
    if (dyslipidemia) points += 1;
    if (diabetes) points += 1;
    if (familyHistory) points += 1;
    if (systolic >= 160) points += 1;
    if (stage === 'II стадия') points += 1;

    if (points >= 3) return 'Риск 3 (высокий)';
    if (points >= 1) return 'Риск 2 (средний)';
    return 'Риск 1 (низкий)';
};

const parseRiskLevel = (risk: string): 1 | 2 | 3 | 4 | null => {
    const match = risk.match(/Риск\s+([1-4])/);
    if (!match) return null;
    return Number(match[1]) as 1 | 2 | 3 | 4;
};

const getTargetsForPatient = (data: DiagnosisFormValues, risk: string): TargetLevels => {
    const declaredLevel = parseRiskLevel(risk);
    const { miHistory, strokeHistory, peripheralArteryDisease, diabetes, creatinine, ckdAlbuminuria, onDialysis, chfNYHA, chfStage } = data;
    const gfr = calculateGFR(data.age, data.gender, creatinine || 80);
    const hasCKD = gfr < 60 || (ckdAlbuminuria && ckdAlbuminuria !== 'none') || !!onDialysis;
    const ckdSevere = onDialysis || gfr < 30 || ckdAlbuminuria === 'A3';
    const chfSevere = chfNYHA === 'III' || chfNYHA === 'IV' || chfStage === 'III';

    let elevatedLevel: 1 | 2 | 3 | 4 | null = declaredLevel;
    const adjustedBy: string[] = [];
    const bumpTo = (lvl: 3 | 4, reason: string) => {
        const current = elevatedLevel || 1;
        if (lvl > current) {
            elevatedLevel = lvl;
            adjustedBy.push(reason);
        }
    };

    if (miHistory) bumpTo(4, 'ИБС/Инфаркт');
    if (strokeHistory) bumpTo(4, 'ОНМК');
    if (peripheralArteryDisease) bumpTo(4, 'ЗПА');
    if (ckdSevere) bumpTo(4, 'ХБП тяж.');
    if (chfSevere) bumpTo(4, 'ХСН тяж.');
    if (diabetes) bumpTo(3, 'СД');
    if (hasCKD && !ckdSevere) bumpTo(3, 'ХБП');

    const level = elevatedLevel || 1;
    const ldl = level === 4 ? { target: '< 1.4 ммоль/л', note: 'и снижение ≥50% от исходного' } :
                level === 3 ? { target: '< 1.8 ммоль/л', note: 'и снижение ≥50% от исходного' } :
                level === 2 ? { target: '< 2.6 ммоль/л' } : { target: '< 3.0 ммоль/л' };

    const bloodPressure = level >= 3 ? { target: '< 130/80 мм рт. ст.', diagnosis: '<130/<80 мм рт. ст.', note: 'при хорошей переносимости' } :
                                     { target: '< 140/90 мм рт. ст.', diagnosis: '<140/<90 мм рт. ст.' };

    const glucose = data.diabetes ? { target: 'HbA1c ≤ 7.0%', diagnosis: 'целевой уровень HbA1c ≤7.0%', note: 'индивидуализировать' } :
                    data.glucoseTolerance ? { target: 'HbA1c < 6.0%', note: 'глюкоза натощак < 6.1 ммоль/л' } :
                    { target: 'HbA1c < 6.0%', note: 'норма' };

    return { ldl, bloodPressure, glucose, adjustedBy: adjustedBy.length > 0 ? adjustedBy : undefined };
};

const sentence = (text: string): string => {
    const t = text.trim();
    if (!t) return '';
    return /[.!?]$/.test(t) ? t : `${t}.`;
};

const formatTargetsForDiagnosis = (targets: TargetLevels): string => {
    const bp = targets.bloodPressure.diagnosis || targets.bloodPressure.target;
    return `ЦАД ${bp}.`;
};

const buildCopyText = (sections: DiagnosisSections, recommendations: string[]): string => {
    const lines: string[] = [];
    if (sections.primary.length > 0) lines.push(`ОСНОВНОЙ: ${sections.primary.join(' ')}`);
    if (sections.background.length > 0) lines.push(`ФОНОВЫЙ: ${sections.background.join(' ')}`);
    if (sections.complications.length > 0) lines.push(`ОСЛОЖНЕНИЯ: ${sections.complications.join(' ')}`);
    if (sections.comorbidities.length > 0) lines.push(`СОПУТСТВУЮЩИЕ: ${sections.comorbidities.join(' ')}`);
    if (sections.targets.length > 0) lines.push(`ЦЕЛИ: ${sections.targets.join(' ')}`);
    if (recommendations.length > 0) {
        lines.push('\nРЕКОМЕНДУЕМАЯ ТЕРАПИЯ:');
        recommendations.forEach(r => lines.push(`- ${r}`));
    }
    if (sections.examinations && sections.examinations.length > 0) {
        lines.push('\nПЛАН ОБСЛЕДОВАНИЯ:');
        sections.examinations.forEach(e => lines.push(`- ${e}`));
    }
    return lines.join('\n');
};

const getEjectionFractionClassification = (ef: number): string => {
    if (ef >= 50) return 'с сохраненной ФВ';
    if (ef >= 40) return 'с умеренно-сниженной ФВ';
    return 'со сниженной ФВ';
};

const getDyslipidemiaPhenotype = (data: DiagnosisFormValues): string => {
    const { ldlCholesterol, triglycerides } = data;
    if (ldlCholesterol === undefined || triglycerides === undefined) return 'Дислипидемия';
    if (ldlCholesterol > 3.0 && triglycerides > 1.7) return 'Комбинированная гиперлипидемия';
    if (ldlCholesterol > 3.0) return 'Гиперхолестеринемия';
    if (triglycerides > 1.7) return 'Гипертриглицеридемия';
    return 'Дислипидемия';
};

function calculateCha2ds2Vasc(data: DiagnosisFormValues): number {
    let score = 0;
    if (data.chfStage && data.chfStage !== 'none') score += 1;
    if (data.systolic >= 140 || data.diastolic >= 90 || data.onTherapy) score += 1;
    if (data.age >= 75) score += 2; else if (data.age >= 65) score += 1;
    if (data.diabetes) score += 1;
    if (data.strokeHistory) score += 2;
    if (data.peripheralArteryDisease || data.miHistory) score += 1;
    if (data.gender === 'female') score += 1;
    return score;
}

function getMedicationRecommendations(data: DiagnosisFormValues, risk: string, isIBS: boolean, gfr: number): string[] {
    const recs: string[] = [];
    const isVeryHighRisk = risk.includes('4') || risk.includes('очень высокий');
    const isHighRisk = risk.includes('3') || risk.includes('высокий');
    const { miHistory, strokeHistory, diabetes, lvh, atrialFibrillation, ejectionFraction, chfStage, peripheralArteryDisease } = data;
    const hasCHF = chfStage && chfStage !== 'none';

    if (data.systolic >= 140 || data.diastolic >= 90 || data.onTherapy || hasCHF || miHistory) {
        let rationale = 'базовая терапия при АГ';
        if (diabetes || gfr < 60) rationale = 'препараты выбора для защиты почек при СД/ХБП';
        if (miHistory || hasCHF) rationale = 'обязательны для предотвращения ремоделирования миокарда';
        recs.push(`**ИАПФ или БРА** — ${rationale}`);
    }

    if (miHistory || hasCHF || (data.complaints.includes('chestPain') && isIBS) || atrialFibrillation) {
        let rationale = '';
        if (miHistory) rationale = 'обязательны после инфаркта для улучшения выживаемости';
        else if (hasCHF) rationale = 'базовая терапия ХСН для снижения риска смерти';
        else if (isIBS) rationale = 'первая линия терапии стенокардии';
        else if (atrialFibrillation) rationale = 'для контроля частоты сокращений';
        if (rationale) recs.push(`**Бета-блокаторы** — ${rationale}`);
    }

    if (isVeryHighRisk || isHighRisk || isIBS || miHistory) {
        let rationale = 'для снижения сердечно-сосудистого риска';
        if (isIBS || miHistory) rationale = 'обязательны для стабилизации бляшек';
        recs.push(`**Статины (высокоинтенсивная терапия)** — ${rationale}`);
    }

    if (isIBS || miHistory || strokeHistory || peripheralArteryDisease) {
        recs.push('**Антиагреганты** — вторичная профилактика тромботических осложнений');
    }

    if (hasCHF || (diabetes && (gfr < 60 || isVeryHighRisk || isHighRisk))) {
        let rationale = 'показаны при ХСН или СД высокого риска для защиты сердца и почек';
        if (hasCHF) rationale = 'снижение риска госпитализаций и смерти при любой фракции выброса (базовая терапия)';
        else if (diabetes && gfr < 60) rationale = 'доказанная кардио- и нефропротекция при СД и ХБП';
        else if (diabetes) rationale = 'снижение сердечно-сосудистого риска при СД 2 типа';
        
        recs.push(`**Ингибиторы SGLT2 (глифлозины)** — ${rationale}`);
    }

    if (hasCHF && ejectionFraction !== undefined && ejectionFraction < 40) {
        recs.push('**Антагонисты минералокортикоидных рецепторов (АМКР)** — показаны при ХСН со сниженной ФВ');
    }

    if (atrialFibrillation) {
        const chaScore = calculateCha2ds2Vasc(data);
        const scoreNeeded = data.gender === 'male' ? 2 : 3;
        if (chaScore >= scoreNeeded) recs.push(`**Пероральные антикоагулянты** — СТРОГО ПОКАЗАНЫ (CHA2DS2-VASc: ${chaScore})`);
        else if (chaScore >= scoreNeeded - 1) recs.push(`**Пероральные антикоагулянты** — следует рассмотреть (CHA2DS2-VASc: ${chaScore})`);
    }

    return recs;
}

function getRecommendedExaminations(data: DiagnosisFormValues, isIBS: boolean): string[] {
    const exams: string[] = [];
    const { miHistory, diabetes, creatinine, chfStage, atrialFibrillation, systolic, diastolic } = data;

    // Базовый кардиологический минимум
    exams.push('ЭКГ (в 12 отведениях)');
    exams.push('Общий анализ крови (ОАК)');
    exams.push('Общий анализ мочи (ОАМ)');
    exams.push('Биохимический анализ крови (глюкоза, креатинин, липидный профиль — ОХ, ЛПНП, ТГ)');

    if (systolic >= 140 || diastolic >= 90 || data.onTherapy) {
        exams.push('ЭхоКГ (для выявления ГЛЖ и оценки ФВ)');
        if (systolic >= 180 || diastolic >= 110) exams.push('Осмотр глазного дна (офтальмоскопия)');
    }

    if (isIBS) {
        if (!miHistory) exams.push('Нагрузочная проба (Тредмил-тест или стресс-ЭхоКГ)');
        exams.push('ЭхоКГ (обязательно при подозрении на ИБС)');
        if (data.complaints.includes('palpitations')) exams.push('Суточное (Холтеровское) мониторирование ЭКГ');
    }

    if (atrialFibrillation) {
        exams.push('УЗИ щитовидной железы + ТТГ');
        exams.push('Коагулограмма (МНО/АЧТВ) — перед началом терапии');
        exams.push('ЭхоКГ (оценка размеров левого предсердия)');
    }

    if (diabetes) {
        exams.push('Анализ на гликированный гемоглобин (HbA1c)');
        exams.push('Определение альбумина в моче (микроальбуминурия)');
    }

    if (chfStage && chfStage !== 'none') {
        exams.push('Определение уровня NT-proBNP в крови');
        exams.push('Рентгенография органов грудной клетки');
    }

    if (creatinine && creatinine > 115) {
        exams.push('УЗИ почек и почечных артерий');
    }

    return [...new Set(exams)]; // Убираем дубликаты
}

export function generateDiagnosis(data: DiagnosisFormValues): DiagnosisResult {
    const { complaints, anginaClass, atrialFibrillation, afForm, afEHRA, miHistory, miYear, dyslipidemia, glucoseTolerance, creatinine, ckdAlbuminuria, onTherapy, ejectionFraction, chfStage, chfNYHA, onDialysis, lvh, strokeHistory, strokeYear, peripheralArteryDisease, hypertensiveRetinopathy, fastingGlucose, hba1c, diabetes, dyspneaAsEquivalent } = data;
    
    const bmi = calculateBMI(data.height, data.weight);
    const obesityStage = getObesityStage(bmi);
    const metabolicPhenotype = getMetabolicPhenotype(data, bmi);
    const gfr = calculateGFR(data.age, data.gender, creatinine || 80);
    const ckdStage = getCKDStageFromGFR(gfr);
    const hasAnginaPain = complaints.includes('chestPain');
    const hasDyspneaEquivalent = complaints.includes('shortnessOfBreath') && dyspneaAsEquivalent;
    const isIBS = hasAnginaPain || hasDyspneaEquivalent || miHistory;
    const { stage, grade } = getHypertensionStageAndGrade(data, gfr);
    const isHypertensive = stage !== '0 стадия';
    let risk = isHypertensive ? calculateCardiovascularRisk(data, stage) : 'Нет';
    if (isHypertensive && (isIBS || diabetes || gfr < 60)) risk = 'Риск 4 (очень высокий)';

    const targets = isHypertensive ? getTargetsForPatient(data, risk) : undefined;
    const sections: DiagnosisSections = { primary: [], background: [], complications: [], comorbidities: [], targets: [] };

    const isAbnormal = isIBS || isHypertensive || atrialFibrillation || strokeHistory || peripheralArteryDisease || diabetes;

    if (isIBS) {
        sections.primary.push(sentence('ИБС'));
        if (hasAnginaPain || hasDyspneaEquivalent) {
            const klass = anginaClass && anginaClass !== 'none' ? ` ${anginaClass} ФК` : '';
            sections.primary.push(sentence(`Стенокардия напряжения${klass}${!hasAnginaPain && hasDyspneaEquivalent ? ' (эквивалент — одышка)' : ''}`));
        }
        if (miHistory) sections.primary.push(sentence(miYear ? `Постинфарктный кардиосклероз (${miYear}г)` : 'Постинфарктный кардиосклероз'));
    } else if (isHypertensive) {
        sections.primary.push(sentence(`ГБ ${stage}`));
        if (grade !== 'Степень АГ 0') sections.primary.push(sentence(grade));
        sections.primary.push(sentence(risk));
    } else if (atrialFibrillation) {
        sections.primary.push(sentence('Нарушение ритма сердца'));
    } else if (strokeHistory) {
        sections.primary.push(sentence(strokeYear ? `Последствия ОНМК (${strokeYear}г)` : 'Последствия ОНМК'));
    } else if (peripheralArteryDisease) {
        sections.primary.push(sentence('Атеросклероз артерий нижних конечностей'));
    } else if (diabetes) {
        sections.primary.push(sentence('Сахарный диабет'));
    } else {
        sections.primary.push(sentence('Здоров(а)'));
    }

    if (isIBS && isHypertensive) {
        sections.background.push(sentence(`ГБ ${stage}`));
        if (grade !== 'Степень АГ 0') sections.background.push(sentence(grade));
        sections.background.push(sentence(risk));
    }

    if (diabetes) {
        const dmType = data.diabetesType === '1' ? '1-го типа' : data.diabetesType === '2' ? '2-го типа' : '(тип не уточнен)';
        sections.background.push(sentence(`Сахарный диабет ${dmType}${targets?.glucose?.diagnosis ? `, ${targets.glucose.diagnosis}` : ''}`));
    }

    if (atrialFibrillation) {
        const afForms: any = { paroxysmal: 'пароксизмальная', persistent: 'персистирующая', longStandingPersistent: 'длительно персистирующая', permanent: 'постоянная', firstDetected: 'впервые выявленная' };
        sections.complications.push(sentence(`Фибрилляция предсердий, ${afForms[afForm || 'paroxysmal']} форма, EHRA ${afEHRA || 'I'}`));
    }
    
    if (chfStage && chfStage !== 'none') {
        let chfStr = `ХСН ${chfStage} ст., ФК ${chfNYHA}`;
        if (ejectionFraction) chfStr += ` ${getEjectionFractionClassification(ejectionFraction)} (ФВ ${ejectionFraction}%)`;
        sections.complications.push(sentence(chfStr));
    }

    if (gfr < 60 || (ckdAlbuminuria && ckdAlbuminuria !== 'none')) {
        sections.complications.push(sentence(`ХБП ${ckdStage} (СКФ ${gfr} мл/мин) ${ckdAlbuminuria !== 'none' ? ckdAlbuminuria : ''}${onDialysis ? ', ЗПТ (гемодиализ)' : ''}`));
    }

    if (lvh) sections.complications.push(sentence('ГЛЖ'));
    if (hypertensiveRetinopathy) sections.complications.push(sentence('Гипертоническая ретинопатия'));
    if (strokeHistory) sections.complications.push(sentence(strokeYear ? `ОНМК в анамнезе (${strokeYear}г)` : 'ОНМК в анамнезе'));
    if (peripheralArteryDisease) sections.complications.push(sentence('ЗПА'));

    const isAbdominalObese = hasAbdominalObesity(data);
    if (obesityStage.includes('Ожирение') || isAbdominalObese) {
        let obs = obesityStage;
        if (isAbdominalObese && !obesityStage.includes('Ожирение')) obs = obesityStage === 'Избыточная масса тела' ? 'Избыточная масса тела, абдоминальное ожирение' : 'Абдоминальное ожирение';
        else if (isAbdominalObese) obs += ', абдоминальный тип';
        sections.comorbidities.push(sentence(metabolicPhenotype ? `${obs}, ${metabolicPhenotype}` : obs));
    }

    if (dyslipidemia) sections.comorbidities.push(sentence(getDyslipidemiaPhenotype(data)));

    const isGlucoseAbnormal = (fastingGlucose && fastingGlucose > 6.1) || (hba1c && hba1c > 6.0);
    if (glucoseTolerance || isGlucoseAbnormal) {
        let glc = glucoseTolerance ? 'Нарушение толерантности к глюкозе' : '';
        const metrics = [];
        if (hba1c) metrics.push(`HbA1c ${hba1c}%`);
        if (fastingGlucose) metrics.push(`Глюкоза ${fastingGlucose} ммоль/л`);
        sections.comorbidities.push(sentence(`${glc}${glc && metrics.length ? ': ' : ''}${metrics.join(', ')}`));
    }

    if (targets) sections.targets.push(sentence(formatTargetsForDiagnosis(targets)));

    const recommendations = getMedicationRecommendations(data, risk, isIBS, gfr);
    const examinations = getRecommendedExaminations(data, isIBS);

    return {
        fullDiagnosis: [ ...sections.primary, ...sections.background, ...sections.complications, ...sections.comorbidities, ...sections.targets ].filter(Boolean).join(' '),
        baseDiagnosis: isIBS ? 'ИБС' : isHypertensive ? 'ГБ' : atrialFibrillation ? 'ФП' : strokeHistory ? 'ОНМК' : diabetes ? 'СД' : 'Нет',
        hypertensionStage: isHypertensive ? stage : 'Нет',
        hypertensionGrade: isHypertensive ? grade : 'Нет',
        risk: isHypertensive ? risk : 'Нет',
        comorbidities: sections.comorbidities,
        targets,
        sections: { ...sections, examinations },
        copyText: buildCopyText({ ...sections, examinations }, recommendations),
        recommendations,
        examinations,
    };
}