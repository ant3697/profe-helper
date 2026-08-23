import { OmrScanResult, OmrQuestionGrade, OmrClassStatistics, OmrSheetType } from "../types/omr";
import { ExamData } from "../types/exam";

// Letters mapped to indices
export const OMR_LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Play a synthetic audio beep feedback when a scan is successful
 */
export function playScanSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

/**
 * Extract answer key from exam data
 */
export function getAnswerKeyFromExam(examData: ExamData | null): { [questionNum: number]: string } {
  if (!examData) return {};
  const key: { [questionNum: number]: string } = {};
  let qNum = 1;
  for (const block of examData.bloques) {
    for (const q of block.preguntas) {
      key[qNum] = OMR_LETTERS[q.indiceCorrecta] || "A";
      qNum++;
    }
  }
  return key;
}

/**
 * Point coordinate in 2D space
 */
export interface Point2D {
  x: number;
  y: number;
}

export interface SixPointCorners {
  tl: Point2D;
  tr: Point2D;
  ml: Point2D;
  mr: Point2D;
  bl: Point2D;
  br: Point2D;
}

/**
 * Result of OMR computer vision analysis
 */
export interface OmrAnalysisResult {
  detectedAnswers: { [qNum: number]: string | null };
  detectedStudentId: string;
  detectedKeyVersion: string;
  fiducialsLocked: boolean;
  fiducialsScore: number;
  questionConfidences: { [qNum: number]: { confidence: number; isMultiple: boolean; topScore: number; secondScore: number } };
  flaggedQuestions: number[];
  multipleMarksCount: number;
  overallConfidence: number;
  sensitivityUsed: "normal" | "high" | "pencil" | "pen";
  isUpsideDown?: boolean;
  sixPointsLocked?: boolean;
}

/**
 * Calculate grade and score from student answers and answer key
 */
export function gradeStudentAnswers({
  studentAnswers,
  answerKey,
  studentId = "",
  studentName = "",
  className = "1º CFGM",
  penaltyPerWrong = 0.33,
  capturedImageUrl,
  questionConfidences = {},
  fiducialsLocked = true,
  sensitivityUsed = "normal",
}: {
  studentAnswers: { [qNum: number]: string | null };
  answerKey: { [qNum: number]: string };
  studentId?: string;
  studentName?: string;
  className?: string;
  penaltyPerWrong?: number;
  capturedImageUrl?: string;
  questionConfidences?: { [qNum: number]: { confidence: number; isMultiple: boolean } };
  fiducialsLocked?: boolean;
  sensitivityUsed?: "normal" | "high" | "pencil" | "pen";
}): OmrScanResult {
  const totalQuestions = Object.keys(answerKey).length || Math.max(20, Object.keys(studentAnswers).length);
  const questionGrades: OmrQuestionGrade[] = [];

  let correctCount = 0;
  let incorrectCount = 0;
  let blankCount = 0;
  let multipleMarksCount = 0;
  const flaggedQuestions: number[] = [];
  let totalConfidenceSum = 0;

  for (let i = 1; i <= totalQuestions; i++) {
    const studentAns = studentAnswers[i] || null;
    const correctAns = answerKey[i] || "A";
    const isBlank = !studentAns;
    const isCorrect = !isBlank && studentAns === correctAns;

    const confInfo = questionConfidences[i];
    const isMultiple = confInfo?.isMultiple ?? false;
    let confidence = confInfo?.confidence ?? (isBlank ? 0 : 92);

    if (isMultiple) {
      multipleMarksCount++;
      flaggedQuestions.push(i);
    } else if (!isBlank && confidence < 60) {
      flaggedQuestions.push(i);
    }

    if (isBlank) {
      blankCount++;
      confidence = 0;
    } else if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    totalConfidenceSum += isBlank ? 95 : confidence;

    questionGrades.push({
      questionNumber: i,
      studentAnswer: studentAns,
      correctAnswer: correctAns,
      isCorrect,
      isBlank,
      isMultiple,
      confidence,
    });
  }

  // Formula: Score = Correct - (Wrong * Penalty)
  const netScore = Math.max(0, correctCount - incorrectCount * penaltyPerWrong);
  const percentage = totalQuestions > 0 ? Number(((netScore / totalQuestions) * 100).toFixed(1)) : 0;
  const grade10 = totalQuestions > 0 ? Number(((netScore / totalQuestions) * 10).toFixed(2)) : 0;
  const passed = grade10 >= 5.0;
  const overallConfidence = totalQuestions > 0 ? Math.round(totalConfidenceSum / totalQuestions) : 90;

  return {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    studentId: studentId || "00000",
    studentName: studentName || `Alumno #${studentId || Math.floor(Math.random() * 900 + 100)}`,
    className,
    totalQuestions,
    correctCount,
    incorrectCount,
    blankCount,
    multipleMarksCount,
    penaltyPerWrong,
    rawScore: Number(netScore.toFixed(2)),
    maxScore: totalQuestions,
    percentage,
    grade10,
    passed,
    questionGrades,
    capturedImageUrl,
    fiducialsLocked,
    overallConfidence,
    flaggedQuestions,
    sensitivityUsed,
  };
}

/**
 * Detect the 6 black fiducial markers (TL, TR, ML, MR, BL, BR) in the image
 */
export function detectCornerFiducials(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): {
  found: boolean;
  score: number;
  corners: SixPointCorners;
  sixPointsLocked: boolean;
} {
  const defaultCorners: SixPointCorners = {
    tl: { x: width * 0.04, y: height * 0.04 },
    tr: { x: width * 0.96, y: height * 0.04 },
    ml: { x: width * 0.04, y: height * 0.50 },
    mr: { x: width * 0.96, y: height * 0.50 },
    bl: { x: width * 0.04, y: height * 0.96 },
    br: { x: width * 0.96, y: height * 0.96 },
  };

  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Helper to get pixel luminance (0=black, 255=white)
    const getLum = (x: number, y: number): number => {
      const px = Math.min(width - 1, Math.max(0, Math.floor(x)));
      const py = Math.min(height - 1, Math.max(0, Math.floor(y)));
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    // Helper to search for a solid black square centroid within a quadrant/region zone
    const findSquareCentroidInZone = (
      minX: number,
      maxX: number,
      minY: number,
      maxY: number,
      expectedPos: Point2D
    ): { point: Point2D; confidence: number } => {
      let minLum = 255;
      let maxLum = 0;

      // Sample region to estimate local contrast
      const step = Math.max(2, Math.floor(Math.min(maxX - minX, maxY - minY) / 35));
      for (let y = minY; y < maxY; y += step) {
        for (let x = minX; x < maxX; x += step) {
          const l = getLum(x, y);
          if (l < minLum) minLum = l;
          if (l > maxLum) maxLum = l;
        }
      }

      const contrastRange = maxLum - minLum;
      if (contrastRange < 38) {
        // Low contrast region, return expected position
        return { point: expectedPos, confidence: 0 };
      }

      // Adaptive threshold for dark square: bottom 28% of luminance in the region
      const darkThreshold = minLum + contrastRange * 0.28;

      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (let y = minY; y < maxY; y += 2) {
        for (let x = minX; x < maxX; x += 2) {
          if (getLum(x, y) <= darkThreshold) {
            sumX += x;
            sumY += y;
            count++;
          }
        }
      }

      if (count < 15) {
        return { point: expectedPos, confidence: 0 };
      }

      const rawCx = sumX / count;
      const rawCy = sumY / count;

      // Refine with tight window around centroid
      const win = Math.max(10, Math.floor(Math.min(width, height) * 0.04));
      let refSumX = 0;
      let refSumY = 0;
      let refCount = 0;

      for (let y = Math.max(minY, Math.floor(rawCy - win)); y <= Math.min(maxY, Math.floor(rawCy + win)); y++) {
        for (let x = Math.max(minX, Math.floor(rawCx - win)); x <= Math.min(maxX, Math.floor(rawCx + win)); x++) {
          if (getLum(x, y) <= darkThreshold) {
            refSumX += x;
            refSumY += y;
            refCount++;
          }
        }
      }

      if (refCount >= 10) {
        const finalCx = refSumX / refCount;
        const finalCy = refSumY / refCount;
        return {
          point: { x: finalCx, y: finalCy },
          confidence: Math.min(1.0, refCount / (win * win * 0.4)),
        };
      }

      return { point: { x: rawCx, y: rawCy }, confidence: 0.5 };
    };

    const qW = width * 0.28;
    const qH = height * 0.25;
    const mH = height * 0.24;

    const tlRes = findSquareCentroidInZone(0, qW, 0, qH, defaultCorners.tl);
    const trRes = findSquareCentroidInZone(width - qW, width, 0, qH, defaultCorners.tr);
    const mlRes = findSquareCentroidInZone(0, qW, height * 0.38, height * 0.62, defaultCorners.ml);
    const mrRes = findSquareCentroidInZone(width - qW, width, height * 0.38, height * 0.62, defaultCorners.mr);
    const blRes = findSquareCentroidInZone(0, qW, height - qH, height, defaultCorners.bl);
    const brRes = findSquareCentroidInZone(width - qW, width, height - qH, height, defaultCorners.br);

    const cornerAvgConf = (tlRes.confidence + trRes.confidence + blRes.confidence + brRes.confidence) / 4;
    const midAvgConf = (mlRes.confidence + mrRes.confidence) / 2;
    const totalAvgConf = (tlRes.confidence + trRes.confidence + mlRes.confidence + mrRes.confidence + blRes.confidence + brRes.confidence) / 6;

    const isLocked = cornerAvgConf > 0.45;
    const sixPointsLocked = isLocked && midAvgConf > 0.35;

    // Use detected mid-points if confident, else estimate from corners
    const finalMl = mlRes.confidence > 0.35
      ? mlRes.point
      : { x: (tlRes.point.x + blRes.point.x) / 2, y: (tlRes.point.y + blRes.point.y) / 2 };

    const finalMr = mrRes.confidence > 0.35
      ? mrRes.point
      : { x: (trRes.point.x + brRes.point.x) / 2, y: (trRes.point.y + brRes.point.y) / 2 };

    return {
      found: isLocked,
      score: Math.round(totalAvgConf * 100),
      sixPointsLocked,
      corners: {
        tl: isLocked ? tlRes.point : defaultCorners.tl,
        tr: isLocked ? trRes.point : defaultCorners.tr,
        ml: isLocked ? finalMl : defaultCorners.ml,
        mr: isLocked ? finalMr : defaultCorners.mr,
        bl: isLocked ? blRes.point : defaultCorners.bl,
        br: isLocked ? brRes.point : defaultCorners.br,
      },
    };
  } catch {
    return {
      found: false,
      score: 0,
      sixPointsLocked: false,
      corners: defaultCorners,
    };
  }
}

/**
 * 6-Point Piecewise Bilinear Homography interpolation:
 * Eliminates perspective curvature and paper bending distortion by subdividing
 * the document into top and bottom quadrilaterals (TL-TR-ML-MR and ML-MR-BL-BR).
 */
export function mapCanonicalPoint(
  normX: number,
  normY: number,
  corners: SixPointCorners | { tl: Point2D; tr: Point2D; bl: Point2D; br: Point2D; ml?: Point2D; mr?: Point2D }
): Point2D {
  const ml = corners.ml || {
    x: (corners.tl.x + corners.bl.x) / 2,
    y: (corners.tl.y + corners.bl.y) / 2,
  };
  const mr = corners.mr || {
    x: (corners.tr.x + corners.br.x) / 2,
    y: (corners.tr.y + corners.br.y) / 2,
  };

  if (normY <= 0.5) {
    // Upper Quadrilateral (0 <= normY <= 0.5)
    const localY = normY * 2.0; // map 0..0.5 to 0..1
    const topX = corners.tl.x + normX * (corners.tr.x - corners.tl.x);
    const topY = corners.tl.y + normX * (corners.tr.y - corners.tl.y);
    const botX = ml.x + normX * (mr.x - ml.x);
    const botY = ml.y + normX * (mr.y - ml.y);
    return {
      x: topX + localY * (botX - topX),
      y: topY + localY * (botY - topY),
    };
  } else {
    // Lower Quadrilateral (0.5 < normY <= 1.0)
    const localY = (normY - 0.5) * 2.0; // map 0.5..1.0 to 0..1
    const topX = ml.x + normX * (mr.x - ml.x);
    const topY = ml.y + normX * (mr.y - ml.y);
    const botX = corners.bl.x + normX * (corners.br.x - corners.bl.x);
    const botY = corners.bl.y + normX * (corners.br.y - corners.bl.y);
    return {
      x: topX + localY * (botX - topX),
      y: topY + localY * (botY - topY),
    };
  }
}

/**
 * Optical recognition algorithm with Computer Vision pipeline:
 * 1. Corner fiducial detection (4 black squares)
 * 2. 4-point bilinear perspective rectification
 * 3. Local background paper baseline normalization (handles shadows/gradients)
 * 4. Concentric multi-point sampling with center-core weighting
 * 5. Multiple-mark & erased mark discrimination with confidence scoring
 */
export async function analyzeOmrImage(
  canvas: HTMLCanvasElement,
  totalQuestionsToScan: number = 50,
  optionsPerQuestion: number = 5,
  sensitivity: "normal" | "high" | "pencil" | "pen" = "normal"
): Promise<OmrAnalysisResult> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      detectedAnswers: {},
      detectedStudentId: "",
      detectedKeyVersion: "A",
      fiducialsLocked: false,
      fiducialsScore: 0,
      questionConfidences: {},
      flaggedQuestions: [],
      multipleMarksCount: 0,
      overallConfidence: 0,
      sensitivityUsed: sensitivity,
    };
  }

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Detect 6 fiducials for perspective transformation
  const fiducialResult = detectCornerFiducials(ctx, width, height);
  let corners = fiducialResult.corners;

  // Helper to read luminance (0..255)
  const getLumAt = (px: number, py: number): number => {
    const x = Math.min(width - 1, Math.max(0, Math.round(px)));
    const y = Math.min(height - 1, Math.max(0, Math.round(py)));
    const idx = (y * width + x) * 4;
    return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  };

  // 2. Anti-Inversion Check (180-degree sheet detection via asymmetric binary block)
  let isUpsideDown = false;
  try {
    const llP = mapCanonicalPoint(0.04, 0.65, corners);
    const urP = mapCanonicalPoint(0.96, 0.35, corners);
    const llDarkness = 255 - getLumAt(llP.x, llP.y);
    const urDarkness = 255 - getLumAt(urP.x, urP.y);
    if (urDarkness > 140 && llDarkness < 80) {
      isUpsideDown = true;
      // Invert corners 180 degrees
      corners = {
        tl: fiducialResult.corners.br,
        tr: fiducialResult.corners.bl,
        ml: fiducialResult.corners.mr,
        mr: fiducialResult.corners.ml,
        bl: fiducialResult.corners.tr,
        br: fiducialResult.corners.tl,
      };
    }
  } catch {
    // Ignore error
  }

  // Helper to sample local unprinted white paper baseline around a question row
  const getLocalPaperBaseline = (normX: number, normY: number): number => {
    const p1 = mapCanonicalPoint(Math.max(0.05, normX - 0.08), normY, corners);
    const p2 = mapCanonicalPoint(Math.min(0.95, normX + 0.08), normY, corners);
    const p3 = mapCanonicalPoint(normX, Math.max(0.05, normY - 0.015), corners);
    const p4 = mapCanonicalPoint(normX, Math.min(0.95, normY + 0.015), corners);
    return (getLumAt(p1.x, p1.y) + getLumAt(p2.x, p2.y) + getLumAt(p3.x, p3.y) + getLumAt(p4.x, p4.y)) / 4;
  };

  // Black level reference from detected corner fiducials
  const blackBaseline = (
    getLumAt(corners.tl.x, corners.tl.y) +
    getLumAt(corners.tr.x, corners.tr.y) +
    getLumAt(corners.bl.x, corners.bl.y) +
    getLumAt(corners.br.x, corners.br.y)
  ) / 4;

  /**
   * Concentric multi-point sampling with center-core weighting:
   * Returns normalized fill percentage (0% to 100%)
   */
  const getBubbleFillPercentage = (
    normX: number,
    normY: number,
    normRadius: number = 0.011,
    localPaperWhite: number = 240
  ): number => {
    const center = mapCanonicalPoint(normX, normY, corners);
    const radPx = Math.max(3, normRadius * width);

    // 1 Center sample (weight 2.5)
    let weightedDarkness = (255 - getLumAt(center.x, center.y)) * 2.5;
    let totalWeight = 2.5;

    // 8 Concentric core samples at 0.55 * radius (weight 1.0 each)
    const innerR = radPx * 0.55;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const sx = center.x + Math.cos(angle) * innerR;
      const sy = center.y + Math.sin(angle) * innerR;
      weightedDarkness += (255 - getLumAt(sx, sy)) * 1.0;
      totalWeight += 1.0;
    }

    // Average darkness of the bubble core (0..255)
    const avgBubbleDarkness = weightedDarkness / totalWeight;

    // Contrast span from unprinted white paper to black fiducial
    const paperDarkness = 255 - localPaperWhite;
    const maxBlackDarkness = Math.max(160, 255 - blackBaseline);
    const dynamicRange = Math.max(60, maxBlackDarkness - paperDarkness);

    // Fill score normalized from 0% (paper white) to 100% (black)
    const rawFill = ((avgBubbleDarkness - paperDarkness) / dynamicRange) * 100;
    return Math.max(0, Math.min(100, rawFill));
  };

  // Sensitivity configuration
  let fillThreshold = 34; // Minimum % fill to consider marked
  let minContrastDelta = 14; // Minimum difference vs 2nd darkest option
  let eraseMaxThreshold = 20; // Marks below this are considered erased/clean

  if (sensitivity === "high") {
    fillThreshold = 26;
    minContrastDelta = 10;
    eraseMaxThreshold = 15;
  } else if (sensitivity === "pencil") {
    fillThreshold = 30;
    minContrastDelta = 12;
    eraseMaxThreshold = 18;
  } else if (sensitivity === "pen") {
    fillThreshold = 42;
    minContrastDelta = 18;
    eraseMaxThreshold = 24;
  }

  const detectedAnswers: { [qNum: number]: string | null } = {};
  const questionConfidences: { [qNum: number]: { confidence: number; isMultiple: boolean; topScore: number; secondScore: number } } = {};
  const flaggedQuestions: number[] = [];
  let multipleMarksCount = 0;

  /**
   * Sample question bubble row with discrimination between single, double, and erased marks
   */
  const sampleQuestionRow = (
    qNum: number,
    startX: number,
    optSpacingX: number,
    rowY: number,
    optCount: number = 5,
    bubbleRadius: number = 0.011
  ) => {
    // 1. Measure local paper baseline at this row
    const localPaperWhite = getLocalPaperBaseline(startX + (optCount * optSpacingX) / 2, rowY);

    // 2. Measure fill score for every option (A..E)
    const scores: Array<{ letter: string; score: number }> = [];
    for (let optIdx = 0; optIdx < optCount; optIdx++) {
      const optLetter = OMR_LETTERS[optIdx];
      const optX = startX + optIdx * optSpacingX;
      const fillPct = getBubbleFillPercentage(optX, rowY, bubbleRadius, localPaperWhite);
      scores.push({ letter: optLetter, score: fillPct });
    }

    // Sort options descending by fill percentage
    scores.sort((a, b) => b.score - a.score);

    const top1 = scores[0];
    const top2 = scores[1];
    const delta = top1.score - top2.score;

    if (top1.score >= fillThreshold) {
      // Check if student marked TWO options (multiple mark / incomplete erasure)
      if (top2.score >= fillThreshold * 0.72 && delta < minContrastDelta) {
        // Ambiguous / Multiple Mark detected
        detectedAnswers[qNum] = null; // Invalidate answer or mark as multiple
        multipleMarksCount++;
        flaggedQuestions.push(qNum);
        questionConfidences[qNum] = {
          confidence: Math.max(15, Math.round(45 - (minContrastDelta - delta) * 2)),
          isMultiple: true,
          topScore: Math.round(top1.score),
          secondScore: Math.round(top2.score),
        };
      } else {
        // Clean single selection
        detectedAnswers[qNum] = top1.letter;
        const confidence = Math.min(99, Math.round(65 + Math.min(30, delta * 1.5) + (top1.score > 60 ? 4 : 0)));
        questionConfidences[qNum] = {
          confidence,
          isMultiple: false,
          topScore: Math.round(top1.score),
          secondScore: Math.round(top2.score),
        };
        if (confidence < 60) {
          flaggedQuestions.push(qNum);
        }
      }
    } else {
      // Blank answer
      detectedAnswers[qNum] = null;
      questionConfidences[qNum] = {
        confidence: top1.score < eraseMaxThreshold ? 98 : 70,
        isMultiple: false,
        topScore: Math.round(top1.score),
        secondScore: Math.round(top2.score),
      };
    }
  };

  let detectedKeyVersion = "A";
  let detectedStudentId = "";

  if (totalQuestionsToScan <= 20) {
    // =========================================================================
    // 20-QUESTION A5 FORM (2 Centered Columns of 10 Questions with 5-block gaps)
    // =========================================================================
    const col1StartX = 0.28;
    const col2StartX = 0.62;
    const optSpacing = 0.038;
    const startY = 0.28;
    const rowSpacing = 0.044;
    const blockGap = 0.030;

    for (let r = 0; r < 10; r++) {
      const gapOffset = r >= 5 ? blockGap : 0;
      const rowY = startY + r * rowSpacing + gapOffset;

      const q1 = r + 1;
      if (q1 <= totalQuestionsToScan) {
        sampleQuestionRow(q1, col1StartX, optSpacing, rowY, optionsPerQuestion, 0.013);
      }
      const q2 = r + 11;
      if (q2 <= totalQuestionsToScan) {
        sampleQuestionRow(q2, col2StartX, optSpacing, rowY, optionsPerQuestion, 0.013);
      }
    }

    // Detect Test Version (A, B, C, D)
    const versionY = 0.88;
    const versionStartX = 0.42;
    const versionSpacing = 0.055;
    let maxVDarkness = 0;
    ["A", "B", "C", "D"].forEach((v, idx) => {
      const d = getBubbleFillPercentage(versionStartX + idx * versionSpacing, versionY, 0.012);
      if (d > maxVDarkness && d >= fillThreshold) {
        maxVDarkness = d;
        detectedKeyVersion = v;
      }
    });
  } else if (totalQuestionsToScan <= 50) {
    // =========================================================================
    // 50-QUESTION A5 FORM (2 Columns Divided into 10-Question Blocks)
    // Block 1: Q1-10 & Q26-35, Block 2: Q11-20 & Q36-45, Block 3: Q21-25 & Q46-50
    // =========================================================================
    const col1StartX = 0.25;
    const col2StartX = 0.63;
    const optSpacing = 0.032;
    const block1Y = 0.16;
    const block2Y = 0.44;
    const block3Y = 0.72;
    const rowSpacing = 0.026;

    // Block 1 (Q1-10 & Q26-35)
    for (let r = 0; r < 10; r++) {
      const rowY = block1Y + r * rowSpacing;
      const q1 = r + 1;
      if (q1 <= totalQuestionsToScan) {
        sampleQuestionRow(q1, col1StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
      const q2 = r + 26;
      if (q2 <= totalQuestionsToScan) {
        sampleQuestionRow(q2, col2StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
    }

    // Block 2 (Q11-20 & Q36-45)
    for (let r = 0; r < 10; r++) {
      const rowY = block2Y + r * rowSpacing;
      const q1 = r + 11;
      if (q1 <= totalQuestionsToScan) {
        sampleQuestionRow(q1, col1StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
      const q2 = r + 36;
      if (q2 <= totalQuestionsToScan) {
        sampleQuestionRow(q2, col2StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
    }

    // Block 3 (Q21-25 & Q46-50)
    for (let r = 0; r < 5; r++) {
      const rowY = block3Y + r * rowSpacing;
      const q1 = r + 21;
      if (q1 <= totalQuestionsToScan) {
        sampleQuestionRow(q1, col1StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
      const q2 = r + 46;
      if (q2 <= totalQuestionsToScan) {
        sampleQuestionRow(q2, col2StartX, optSpacing, rowY, optionsPerQuestion, 0.011);
      }
    }

    // Detect Key Version (A..E)
    const keyYStart = 0.10;
    const keySpacing = 0.035;
    let maxKeyD = 0;
    ["A", "B", "C", "D", "E"].forEach((v, idx) => {
      const d = getBubbleFillPercentage(0.38 + idx * keySpacing, keyYStart, 0.010);
      if (d > maxKeyD && d >= fillThreshold) {
        maxKeyD = d;
        detectedKeyVersion = v;
      }
    });
  } else {
    // =========================================================================
    // 100-QUESTION A5 FORM (4 Columns in 2 Blocks of 10 Questions)
    // Top Block: Q1-10, Q21-30, Q51-60, Q81-90
    // Bottom Block: Q11-20, Q31-40, Q61-70, Q91-100
    // =========================================================================
    const colStarts = [0.15, 0.38, 0.61, 0.84];
    const optSpacing = 0.024;
    const topStartY = 0.16;
    const botStartY = 0.54;
    const rowSpacing = 0.032;

    // Top block (10 rows)
    for (let r = 0; r < 10; r++) {
      const rowY = topStartY + r * rowSpacing;
      sampleQuestionRow(r + 1, colStarts[0], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 21, colStarts[1], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 51, colStarts[2], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 81, colStarts[3], optSpacing, rowY, optionsPerQuestion, 0.0095);
    }

    // Bottom block (10 rows)
    for (let r = 0; r < 10; r++) {
      const rowY = botStartY + r * rowSpacing;
      sampleQuestionRow(r + 11, colStarts[0], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 31, colStarts[1], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 61, colStarts[2], optSpacing, rowY, optionsPerQuestion, 0.0095);
      sampleQuestionRow(r + 91, colStarts[3], optSpacing, rowY, optionsPerQuestion, 0.0095);
    }
  }

  // Compute Overall Document Confidence
  const confValues = Object.values(questionConfidences).map((c) => c.confidence);
  const overallConfidence = confValues.length > 0 ? Math.round(confValues.reduce((a, b) => a + b, 0) / confValues.length) : 90;

  return {
    detectedAnswers,
    detectedStudentId: detectedStudentId === "00000" ? "" : detectedStudentId,
    detectedKeyVersion: detectedKeyVersion || "A",
    fiducialsLocked: fiducialResult.found,
    fiducialsScore: fiducialResult.score,
    sixPointsLocked: fiducialResult.sixPointsLocked,
    isUpsideDown,
    questionConfidences,
    flaggedQuestions,
    multipleMarksCount,
    overallConfidence,
    sensitivityUsed: sensitivity,
  };
}

/**
 * Compute detailed aggregate statistics matching ZipGrade statistics screen
 */
export function computeClassStatistics(records: OmrScanResult[]): OmrClassStatistics {
  if (!records || records.length === 0) {
    return {
      totalScanned: 0,
      minScore: 0,
      maxScore: 0,
      minPercent: 0,
      maxPercent: 0,
      averageScore: 0,
      averagePercent: 0,
      medianScore: 0,
      medianPercent: 0,
      standardDeviation: 0,
      standardDeviationPercent: 0,
      passedCount: 0,
      failedCount: 0,
      passPercentage: 0,
      hardestQuestions: [],
    };
  }

  const totalScanned = records.length;
  const totalQuestions = records[0].totalQuestions || 40;
  const rawScores = records.map((r) => r.rawScore);
  const percentages = rawScores.map((s) => (totalQuestions > 0 ? (s / totalQuestions) * 100 : 0));

  // Min / Max
  const minScore = Number(Math.min(...rawScores).toFixed(1));
  const maxScore = Number(Math.max(...rawScores).toFixed(1));
  const minPercent = Number(Math.min(...percentages).toFixed(1));
  const maxPercent = Number(Math.max(...percentages).toFixed(1));

  // Average
  const sumScores = rawScores.reduce((a, b) => a + b, 0);
  const averageScore = Number((sumScores / totalScanned).toFixed(1));
  const averagePercent = Number(((averageScore / totalQuestions) * 100).toFixed(1));

  // Median
  const sortedScores = [...rawScores].sort((a, b) => a - b);
  const mid = Math.floor(sortedScores.length / 2);
  const medianScore = sortedScores.length % 2 !== 0 ? sortedScores[mid] : (sortedScores[mid - 1] + sortedScores[mid]) / 2;
  const medianPercent = Number(((medianScore / totalQuestions) * 100).toFixed(1));

  // Standard Deviation
  const variance = rawScores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / totalScanned;
  const standardDeviation = Number(Math.sqrt(variance).toFixed(1));
  const standardDeviationPercent = Number(((standardDeviation / totalQuestions) * 100).toFixed(1));

  const passedCount = records.filter((r) => r.passed || r.grade10 >= 5).length;
  const failedCount = totalScanned - passedCount;
  const passPercentage = Number(((passedCount / totalScanned) * 100).toFixed(1));

  // Compute error rates per question
  const questionStats: { [qNum: number]: { errors: number; total: number; correctAnswer: string; wrongAnswers: { [ans: string]: number } } } = {};

  for (let q = 1; q <= totalQuestions; q++) {
    questionStats[q] = { errors: 0, total: 0, correctAnswer: "", wrongAnswers: {} };
  }

  for (const record of records) {
    for (const qGrade of record.questionGrades) {
      const stat = questionStats[qGrade.questionNumber];
      if (stat) {
        stat.total++;
        stat.correctAnswer = qGrade.correctAnswer;
        if (!qGrade.isCorrect) {
          stat.errors++;
          if (qGrade.studentAnswer) {
            stat.wrongAnswers[qGrade.studentAnswer] = (stat.wrongAnswers[qGrade.studentAnswer] || 0) + 1;
          }
        }
      }
    }
  }

  const hardestQuestions = Object.entries(questionStats)
    .map(([qNumStr, stat]) => {
      const qNum = parseInt(qNumStr, 10);
      const errorRate = stat.total > 0 ? Number(((stat.errors / stat.total) * 100).toFixed(1)) : 0;
      let mostCommonWrongAnswer: string | undefined;
      let highestWrongCount = 0;
      for (const [ans, count] of Object.entries(stat.wrongAnswers)) {
        if (count > highestWrongCount) {
          highestWrongCount = count;
          mostCommonWrongAnswer = ans;
        }
      }
      return {
        questionNumber: qNum,
        errorRate,
        correctAnswer: stat.correctAnswer,
        mostCommonWrongAnswer,
      };
    })
    .filter((q) => q.errorRate > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  return {
    totalScanned,
    minScore,
    maxScore,
    minPercent,
    maxPercent,
    averageScore,
    averagePercent,
    medianScore: Number(medianScore.toFixed(1)),
    medianPercent,
    standardDeviation,
    standardDeviationPercent,
    passedCount,
    failedCount,
    passPercentage,
    hardestQuestions,
  };
}

/**
 * Item Analysis per question for a Quiz
 */
export function computeItemAnalysis(
  totalQuestions: number,
  activeKeyAnswers: Record<number, string>,
  scannedDocs: OmrScanResult[],
  questionPoints: Record<number, number> = {},
  questionTags: Record<number, string[]> = {}
) {
  const rows = [];
  const totalStudents = scannedDocs.length;

  for (let q = 1; q <= totalQuestions; q++) {
    const correctAns = activeKeyAnswers[q] || "A";
    const points = questionPoints[q] ?? 1;
    const tags = questionTags[q] || [];

    const dist = { A: 0, B: 0, C: 0, D: 0, E: 0, blank: 0 };
    let correctCount = 0;

    for (const doc of scannedDocs) {
      const qGrade = doc.questionGrades.find((g) => g.questionNumber === q);
      const ans = qGrade?.studentAnswer;
      if (!ans) {
        dist.blank++;
      } else if (ans in dist) {
        dist[ans as keyof typeof dist]++;
      }
      if (qGrade?.isCorrect) {
        correctCount++;
      }
    }

    const correctPercent = totalStudents > 0 ? Number(((correctCount / totalStudents) * 100).toFixed(1)) : 0;

    // Simple Discrimination Index: Upper 50% vs Lower 50%
    let discriminationIndex = 0;
    if (totalStudents >= 2) {
      const sorted = [...scannedDocs].sort((a, b) => b.rawScore - a.rawScore);
      const half = Math.ceil(totalStudents / 2);
      const upper = sorted.slice(0, half);
      const lower = sorted.slice(half);

      const upperCorrect = upper.filter((d) => d.questionGrades.find((g) => g.questionNumber === q)?.isCorrect).length;
      const lowerCorrect = lower.filter((d) => d.questionGrades.find((g) => g.questionNumber === q)?.isCorrect).length;

      discriminationIndex = Number(((upperCorrect / upper.length) - (lowerCorrect / lower.length)).toFixed(2));
    }

    rows.push({
      questionNumber: q,
      correctAnswer: correctAns,
      points,
      totalAnswers: totalStudents,
      correctCount,
      correctPercent,
      distribution: dist,
      tags,
      discriminationIndex,
    });
  }

  return rows;
}

/**
 * Curricular Tag / RA / CE report
 */
export function computeTagReport(
  totalQuestions: number,
  activeKeyAnswers: Record<number, string>,
  scannedDocs: OmrScanResult[],
  questionPoints: Record<number, number> = {},
  questionTags: Record<number, string[]> = {}
) {
  const tagMap: Record<string, { questions: number[]; totalPointsPossible: number; earnedPointsTotal: number }> = {};

  for (let q = 1; q <= totalQuestions; q++) {
    const tags = questionTags[q] || [];
    const pts = questionPoints[q] ?? 1;

    for (const t of tags) {
      if (!tagMap[t]) {
        tagMap[t] = { questions: [], totalPointsPossible: 0, earnedPointsTotal: 0 };
      }
      tagMap[t].questions.push(q);
      tagMap[t].totalPointsPossible += pts * (scannedDocs.length || 1);
    }
  }

  for (const doc of scannedDocs) {
    for (const qGrade of doc.questionGrades) {
      const q = qGrade.questionNumber;
      const tags = questionTags[q] || [];
      const pts = questionPoints[q] ?? 1;
      if (qGrade.isCorrect) {
        for (const t of tags) {
          if (tagMap[t]) {
            tagMap[t].earnedPointsTotal += pts;
          }
        }
      }
    }
  }

  return Object.entries(tagMap).map(([tag, data]) => {
    const masteryPercent = data.totalPointsPossible > 0 ? Number(((data.earnedPointsTotal / data.totalPointsPossible) * 100).toFixed(1)) : 0;
    const status: "high" | "medium" | "low" = masteryPercent >= 70 ? "high" : masteryPercent >= 45 ? "medium" : "low";

    return {
      tag,
      questionCount: data.questions.length,
      questions: data.questions,
      totalPossiblePoints: data.totalPointsPossible,
      earnedPoints: Number(data.earnedPointsTotal.toFixed(1)),
      masteryPercent,
      status,
    };
  });
}

/**
 * Generate CSV export of the class grading roster
 */
export function exportRosterToCsv(records: OmrScanResult[], examTitle: string): void {
  if (records.length === 0) return;

  const maxQuestions = records[0].totalQuestions;
  const questionHeaders = Array.from({ length: maxQuestions }, (_, i) => `P${i + 1}`).join(",");

  const csvRows = [
    `ID Alumno,Nombre,Clase,Fecha,Nota (0-10),Estado,Aciertos,Fallos,Blancos,Puntos Netos,${questionHeaders}`,
    ...records.map((r) => {
      const answersStr = r.questionGrades
        .map((q) => (q.studentAnswer ? `${q.studentAnswer}${q.isCorrect ? " (OK)" : " (X)"}` : "-"))
        .join(",");
      const dateStr = new Date(r.timestamp).toLocaleDateString();
      return `"${r.studentId}","${r.studentName}","${r.className}","${dateStr}",${r.grade10},"${r.passed ? "APROBADO" : "SUSPENSO"}",${r.correctCount},${r.incorrectCount},${r.blankCount},${r.rawScore},${answersStr}`;
    }),
  ];

  const csvContent = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Calificaciones_OMR_${examTitle.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Helper to reliably print an HTML document across desktop, mobile and iframe environments
 */
export function printOmrHtmlDocument(html: string): boolean {
  try {
    // 1. Direct Portal Injection in main document (for top-level and standalone executions)
    let portal = document.getElementById("omr-direct-print-portal");
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "omr-direct-print-portal";
      document.body.appendChild(portal);
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyInner = bodyMatch ? bodyMatch[1] : html;
    portal.innerHTML = bodyInner;

    document.documentElement.classList.add("printing-omr-active");
    document.body.classList.add("printing-omr-active");

    const cleanup = () => {
      document.documentElement.classList.remove("printing-omr-active");
      document.body.classList.remove("printing-omr-active");
      if (portal) portal.innerHTML = "";
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    setTimeout(cleanup, 8000);

    // 2. Open a dedicated print window with auto-print script (bulletproof for sandboxed iframes)
    let printWin: Window | null = null;
    try {
      printWin = window.open("", "_blank");
    } catch {
      printWin = null;
    }

    if (printWin) {
      // Add auto-print script and print toolbar to the window
      const printEnhancedHtml = html.replace(
        "</body>",
        `
        <div class="no-print" style="position:fixed; top:12px; right:12px; z-index:999999; display:flex; gap:8px; background:#0f172a; padding:8px 12px; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.3); font-family:sans-serif;">
          <button onclick="window.print()" style="background:#f59e0b; color:#000; border:none; padding:7px 14px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px;">
            🖨️ Imprimir / Guardar PDF
          </button>
          <button onclick="window.close()" style="background:#334155; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
            Cerrar
          </button>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              try { window.print(); } catch(e) { console.error(e); }
            }, 300);
          };
        </script>
        </body>`
      );

      printWin.document.open();
      printWin.document.write(printEnhancedHtml);
      printWin.document.close();
    } else {
      // Direct window.print trigger if popup was blocked
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.warn("Direct window.print restricted:", e);
      }
    }

    return true;
  } catch (err) {
    console.error("OMR print dispatch error:", err);
    return false;
  }
}

/**
 * Open printable OMR in a new window/tab
 */
export function openOmrInNewTab(html: string): boolean {
  try {
    const printWin = window.open("", "_blank");
    if (printWin) {
      const printEnhancedHtml = html.replace(
        "</body>",
        `
        <div class="no-print" style="position:fixed; top:12px; right:12px; z-index:999999; display:flex; gap:8px; background:#0f172a; padding:8px 12px; border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.3); font-family:sans-serif;">
          <button onclick="window.print()" style="background:#f59e0b; color:#000; border:none; padding:7px 14px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px;">
            🖨️ Imprimir / Guardar PDF
          </button>
          <button onclick="window.close()" style="background:#334155; color:#fff; border:none; padding:7px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
            Cerrar
          </button>
        </div>
        </body>`
      );
      printWin.document.open();
      printWin.document.write(printEnhancedHtml);
      printWin.document.close();
      return true;
    }

    // Fallback using Blob
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return true;
    }
  } catch (err) {
    console.error("Open OMR in new tab error:", err);
  }
  return false;
}

/**
 * Standard printable OMR sheet HTML template generator matching official ZipGrade 20, 50, and 100 question forms
 * Maximizes A5 Portrait (Caballera) printable and embeddable area with zero data header boxes.
 */
export function generatePrintableZipgradeSheet({
  examTitle = "",
  questionCount = 50,
  optionsCount = 5,
  includeAnswerKey = false,
  answerKey = {},
  candidateName = "",
  dni = "",
  className = "",
  examDate = "",
  model = "",
  sheetFormat = "auto",
  language = "es",
}: {
  examTitle?: string;
  questionCount?: number;
  optionsCount?: number;
  includeAnswerKey?: boolean;
  answerKey?: { [qNum: number]: string };
  candidateName?: string;
  dni?: string;
  className?: string;
  examDate?: string;
  model?: string;
  sheetFormat?: "20" | "50" | "100" | "auto";
  language?: "es" | "en";
}): string {
  const isEs = language === "es";

  // Determine actual format
  let format: "20" | "50" | "100" = "50";
  if (sheetFormat === "20" || (sheetFormat === "auto" && questionCount <= 20)) {
    format = "20";
  } else if (sheetFormat === "100" || (sheetFormat === "auto" && questionCount > 50)) {
    format = "100";
  } else {
    format = "50";
  }

  // Text labels by language (clean, without superfluous text)
  const labels = {
    testVersion: isEs ? "MODELO / VERSIÓN:" : "TEST VERSION:",
    keyVersion: "MODELO",
    keyVersionShort: "MOD",
    studentId: isEs ? "DNI / ID ALUMNO" : "STUDENT ID",
    footerText: isEs
      ? "HOJA OFICIAL DE RESPUESTAS OMR · FORMATO A5"
      : "OFFICIAL OMR ANSWER SHEET · A5 FORMAT",
  };

  const letters = ["A", "B", "C", "D", "E"].slice(0, Math.max(4, optionsCount));

  // Extract up to 5 digits for 50-Q or 8 digits for 100-Q student ID
  const rawIdDigits5 = dni.replace(/\D/g, "").slice(0, 5).padEnd(5, " ");
  const idDigitsArray5 = rawIdDigits5.split("");
  const rawIdDigits8 = dni.replace(/\D/g, "").slice(0, 8).padEnd(8, " ");
  const idDigitsArray8 = rawIdDigits8.split("");

  // Helper to render question row with larger, high-legibility bubbles and exact Lato font
  const renderRow = (
    qNum: number,
    optCount = 5,
    size: "large" | "medium" | "compact" = "medium"
  ) => {
    const hasKey = answerKey && Object.prototype.hasOwnProperty.call(answerKey, qNum);
    const correctAns = hasKey ? answerKey[qNum] : undefined;

    let bubbleSize = "18px";
    let bubbleMargin = "2.5px";
    let numWidth = "22px";
    let numFontSize = "11.8pt"; // 50-preg standard: ~11.8pt Lato-Regular
    let rowMargin = "5px";

    if (size === "large") {
      bubbleSize = "24px";
      bubbleMargin = "3.5px";
      numWidth = "26px";
      numFontSize = "12.5pt"; // 20-preg standard: 12.5pt Lato-Regular
      rowMargin = "9px";
    } else if (size === "compact") {
      bubbleSize = "13.5px";
      bubbleMargin = "1.2px";
      numWidth = "22px";
      numFontSize = "9pt"; // 100-preg standard: 9pt Lato fits 3 digits ("100") without touching bubbles
      rowMargin = "1.5px";
    }

    const bubbles = letters.slice(0, optCount).map((l) => {
      const isMasterKey = includeAnswerKey && Boolean(correctAns) && l === correctAns;
      return `
        <div style="display:inline-flex; align-items:center; justify-content:center; width:${bubbleSize}; height:${bubbleSize}; border-radius:50%; border:1.4px solid #555555; margin:0 ${bubbleMargin}; background:${isMasterKey ? "#000000" : "#ffffff"}; box-sizing:border-box; flex-shrink:0;"></div>`;
    }).join("");

    return `
      <div style="display:flex; align-items:center; justify-content:flex-start; margin-bottom:${rowMargin}; font-family:'Lato', sans-serif;">
        <span style="font-family:'Lato', sans-serif; font-weight:400; width:${numWidth}; text-align:right; margin-right:5px; font-size:${numFontSize}; color:#000000; line-height:1; flex-shrink:0;">${qNum}</span>
        <div style="display:flex; align-items:center;">
          ${bubbles}
        </div>
      </div>`;
  };

  // Helper for column header with 100% exact mathematical alignment with bubbles
  const renderColHeader = (
    size: "large" | "medium" | "compact" = "medium",
    withTimingSquare: boolean = false
  ) => {
    let bubbleSize = "18px";
    let bubbleMargin = "2.5px";
    let numWidth = "22px";
    let fontSize = "10.8pt"; // 50-preg standard: ~10.8pt Lato-Regular / Light
    let sqSize = "8px";

    if (size === "large") {
      bubbleSize = "24px";
      bubbleMargin = "3.5px";
      numWidth = "26px";
      fontSize = "13.4pt"; // 20-preg standard: 13.4pt Lato-Regular
      sqSize = "10px";
    } else if (size === "compact") {
      bubbleSize = "13.5px";
      bubbleMargin = "1.2px";
      numWidth = "22px";
      fontSize = "8pt"; // 100-preg standard: 8pt Lato-Regular / Light
      sqSize = "6px";
    }

    const headerLetters = ["A", "B", "C", "D", "E"].map((l) => `
      <div style="display:inline-flex; align-items:center; justify-content:center; width:${bubbleSize}; height:${bubbleSize}; margin:0 ${bubbleMargin}; text-align:center; font-family:'Lato', sans-serif; font-weight:400; font-size:${fontSize}; color:#000000; box-sizing:border-box; line-height:1; flex-shrink:0;">${l}</div>
    `).join("");

    return `
      <div style="display:flex; align-items:center; justify-content:flex-start; margin-bottom:4px; font-family:'Lato', sans-serif;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:${numWidth}; margin-right:5px; flex-shrink:0;">
          ${withTimingSquare ? `<div style="width:${sqSize}; height:${sqSize}; background:#000000;"></div>` : ""}
        </div>
        <div style="display:flex; align-items:center;">
          ${headerLetters}
        </div>
      </div>`;
  };

  // Helper for column bottom timing square
  const renderColBottomSquare = (
    size: "large" | "medium" | "compact" = "medium",
    showSquare: boolean = true
  ) => {
    let numWidth = "22px";
    let sqSize = "8px";
    if (size === "large") {
      numWidth = "26px";
      sqSize = "10px";
    } else if (size === "compact") {
      numWidth = "22px";
      sqSize = "6px";
    }
    return `
      <div style="display:flex; align-items:center; justify-content:flex-start; margin-top:4px; font-family:'Lato', sans-serif;">
        <div style="display:inline-flex; align-items:center; justify-content:center; width:${numWidth}; margin-right:5px; flex-shrink:0;">
          ${showSquare ? `<div style="width:${sqSize}; height:${sqSize}; background:#000000;"></div>` : ""}
        </div>
      </div>`;
  };

  let bodyContent = "";

  if (format === "20") {
    // =========================================================================
    // 20-QUESTION ULTRA-CLEAN A5 VERTICAL FORM (EXTRA LARGE BUBBLES)
    // 2 Spacious Columns of 10 questions (1-10, 11-20)
    // =========================================================================
    const build20Col = (startQ: number, endQ: number) => {
      let rows = "";
      for (let q = startQ; q <= endQ; q++) {
        rows += renderRow(q, 5, "large");
      }
      return rows;
    };

    let col1Rows = build20Col(1, 10);
    let col2Rows = build20Col(11, 20);

    bodyContent = `
      <div class="omr-container" style="max-width:540px; min-height:740px; padding:44px 36px 36px 44px; position:relative; box-sizing:border-box; background:#ffffff; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <!-- 6 Calibration Fiducial Squares (4 Corners + 2 Mid Lateral) -->
        <div class="fiducial-mark fiducial-tl"></div>
        <div class="fiducial-mark fiducial-tr"></div>
        <div class="fiducial-mark fiducial-ml" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-mr" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-bl"></div>
        <div class="fiducial-mark fiducial-br"></div>

        <!-- Left Margin 2x5 Binary Form/Orientation Code -->
        <div class="orientation-pattern" style="position:absolute; left:8px; top:60%; transform:translateY(-50%); display:flex; flex-direction:column; border:1px solid #000000; background:#ffffff;">
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
        </div>

        <!-- 2 Columns of 10 Questions -->
        <div style="display:flex; justify-content:center; gap:60px; align-items:flex-start; margin:auto 0; width:100%;">
          <div style="flex-shrink:0;">
            ${renderColHeader("large", false)}
            ${col1Rows}
            ${renderColBottomSquare("large", false)}
          </div>
          <div style="flex-shrink:0;">
            ${renderColHeader("large", true)}
            ${col2Rows}
            ${renderColBottomSquare("large", true)}
          </div>
        </div>
      </div>`;
  } else if (format === "50") {
    // =========================================================================
    // 50-QUESTION HIGH-EFFICIENCY A5 VERTICAL FORM
    // 2 Columns Divided into 10-Question Blocks (Q1-10/Q26-35, Q11-20/Q36-45, Q21-25/Q46-50)
    // =========================================================================

    const build50Col = (startQ: number, endQ: number) => {
      let rows = "";
      for (let q = startQ; q <= endQ; q++) {
        rows += renderRow(q, 5, "medium");
      }
      return rows;
    };

    bodyContent = `
      <div class="omr-container" style="max-width:540px; min-height:740px; padding:32px 28px 28px 40px; position:relative; box-sizing:border-box; background:#ffffff; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <!-- 6 Calibration Fiducial Squares (4 Corners + 2 Mid Lateral) -->
        <div class="fiducial-mark fiducial-tl"></div>
        <div class="fiducial-mark fiducial-tr"></div>
        <div class="fiducial-mark fiducial-ml" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-mr" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-bl"></div>
        <div class="fiducial-mark fiducial-br"></div>

        <!-- Left Margin 2x5 Binary Form/Orientation Code -->
        <div class="orientation-pattern" style="position:absolute; left:8px; top:60%; transform:translateY(-50%); display:flex; flex-direction:column; border:1px solid #000000; background:#ffffff;">
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
        </div>

        <!-- QUESTIONS GRID: 2 Columns Divided into 10-Item Sections -->
        <div style="display:flex; flex-direction:column; gap:12px; margin:auto 0; width:100%; align-items:center;">
          <!-- Block 1 (Q1-10 & Q26-35) -->
          <div style="display:flex; justify-content:center; gap:48px; width:100%;">
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", false)}
              ${build50Col(1, 10)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", true)}
              ${build50Col(26, 35)}
            </div>
          </div>

          <!-- Block 2 (Q11-20 & Q36-45) -->
          <div style="display:flex; justify-content:center; gap:48px; width:100%;">
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", false)}
              ${build50Col(11, 20)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", true)}
              ${build50Col(36, 45)}
            </div>
          </div>

          <!-- Block 3 (Q21-25 & Q46-50) -->
          <div style="display:flex; justify-content:center; gap:48px; width:100%;">
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", false)}
              ${build50Col(21, 25)}
              ${renderColBottomSquare("medium", false)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("medium", true)}
              ${build50Col(46, 50)}
              ${renderColBottomSquare("medium", true)}
            </div>
          </div>
        </div>
      </div>`;
  } else {
    // =========================================================================
    // 100-QUESTION A5 VERTICAL FORM
    // 4 Columns Divided in 2 Blocks of 10 Questions
    // Block 1: Q1-10, Q21-30, Q51-60, Q81-90
    // Block 2: Q11-20, Q31-40, Q61-70, Q91-100
    // =========================================================================

    const build100Col = (startQ: number, endQ: number) => {
      let rows = "";
      for (let q = startQ; q <= endQ; q++) {
        rows += renderRow(q, 5, "compact");
      }
      return rows;
    };

    bodyContent = `
      <div class="omr-container" style="max-width:540px; min-height:740px; padding:24px 20px 24px 38px; position:relative; box-sizing:border-box; background:#ffffff; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <!-- 6 Calibration Fiducial Squares (4 Corners + 2 Mid Lateral) -->
        <div class="fiducial-mark fiducial-tl"></div>
        <div class="fiducial-mark fiducial-tr"></div>
        <div class="fiducial-mark fiducial-ml" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-mr" style="top:38%;"></div>
        <div class="fiducial-mark fiducial-bl"></div>
        <div class="fiducial-mark fiducial-br"></div>

        <!-- Left Margin 2x5 Binary Form/Orientation Code -->
        <div class="orientation-pattern" style="position:absolute; left:8px; top:60%; transform:translateY(-50%); display:flex; flex-direction:column; border:1px solid #000000; background:#ffffff;">
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#ffffff;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#ffffff;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
          <div style="display:flex;"><div style="width:8px; height:8px; background:#000000;"></div><div style="width:8px; height:8px; background:#000000;"></div></div>
        </div>

        <!-- 4 COLUMNS IN 2 BLOCKS OF 10 QUESTIONS -->
        <div style="display:flex; flex-direction:column; gap:14px; margin:auto 0; width:100%; align-items:center;">
          <!-- Top Section (Q1-10, Q21-30, Q51-60, Q81-90) -->
          <div style="display:flex; justify-content:center; gap:12px; width:100%;">
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", false)}
              ${build100Col(1, 10)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(21, 30)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(51, 60)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(81, 90)}
            </div>
          </div>

          <!-- Bottom Section (Q11-20, Q31-40, Q61-70, Q91-100) -->
          <div style="display:flex; justify-content:center; gap:12px; width:100%;">
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", false)}
              ${build100Col(11, 20)}
              ${renderColBottomSquare("compact", false)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(31, 40)}
              ${renderColBottomSquare("compact", true)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(61, 70)}
              ${renderColBottomSquare("compact", true)}
            </div>
            <div style="flex-shrink:0;">
              ${renderColHeader("compact", true)}
              ${build100Col(91, 100)}
              ${renderColBottomSquare("compact", true)}
            </div>
          </div>
        </div>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>Plantilla OMR A5 Caballera - ${examTitle || "Examen"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');
    @media print {
      @page { margin: 4mm; size: A5 portrait; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: #ffffff !important; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Lato', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #000000; background: #f1f5f9; margin: 0; padding: 10px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    
    .omr-container {
      position: relative;
      background: #ffffff;
      margin: 0 auto;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      box-sizing: border-box;
      width: 100%;
      font-family: 'Lato', sans-serif;
    }

    /* 6 Solid Black Calibration Fiducials */
    .fiducial-mark { width: 14px; height: 14px; background: #000000; position: absolute; }
    .fiducial-tl { top: 8px; left: 8px; }
    .fiducial-tr { top: 8px; right: 8px; }
    .fiducial-ml { top: 50%; left: 8px; transform: translateY(-50%); }
    .fiducial-mr { top: 50%; right: 8px; transform: translateY(-50%); }
    .fiducial-bl { bottom: 8px; left: 8px; }
    .fiducial-br { bottom: 8px; right: 8px; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}
