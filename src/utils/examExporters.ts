import { ExamData } from "../types/exam";

export function jsonToGIFT(data: ExamData): string {
  let out = "";
  let globalIndex = 1;

  data.bloques.forEach((b) => {
    out += `// Bloque: ${b.titulo}\n\n`;
    b.preguntas.forEach((q) => {
      out += `::P${globalIndex}:: ${q.enunciado} {\n`;
      q.opciones.forEach((o, oi) => {
        if (oi === q.indiceCorrecta) {
          out += `=${o}#${q.justificacion}\n`;
        } else {
          out += `~${o}#${q.justificacion}\n`;
        }
      });
      out += "}\n\n";
      globalIndex++;
    });
  });
  return out.trim();
}

export function jsonToTxtCompleto(data: ExamData): string {
  let out = "";
  data.bloques.forEach((b) => {
    out += `### ${b.titulo}\n\n`;
    b.preguntas.forEach((q) => {
      out += `- ${q.enunciado}\n`;
      q.opciones.forEach((o, oi) => {
        if (oi === q.indiceCorrecta) {
          out += `${o} (Correcta)\n`;
        } else {
          out += `${o}\n`;
        }
      });
      out += "\n";
    });
  });
  return out.trim() + "\n";
}

export function jsonToTxtCorrectas(data: ExamData): string {
  let out = "";
  data.bloques.forEach((b) => {
    out += `### SOLUCIONES: ${b.titulo}\n\n`;
    b.preguntas.forEach((q, i) => {
      out += `${i + 1}. ${q.enunciado}\n`;
      const correctLetter = String.fromCharCode(97 + q.indiceCorrecta);
      const correctOption = q.opciones[q.indiceCorrecta];
      out += `${correctLetter}) ${correctOption}\n\n`;
    });
  });
  return out.trim() + "\n";
}

export function jsonToJSONString(data: ExamData): string {
  return JSON.stringify(data, null, 2);
}

export function exportStandaloneHTML(
  data: ExamData,
  renderedHtmlContent: string,
  fileName: string = "DocuExam Test",
  evalMode: string = "instant"
): string {
  return `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fileName} - DocuExam Builder</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Roboto+Condensed:wght@700&family=Fira+Code&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-app: #0a0a0c;
            --bg-surface: #1a1a1c;
            --bg-alt: rgba(255, 255, 255, 0.05);
            --bg-hover: rgba(255, 255, 255, 0.1);
            --border-default: rgba(255, 255, 255, 0.1);
            --text-primary: #ffffff;
            --text-secondary: #f8fafc;
            --text-muted: #94a3b8;
            --accent-base: #fbbf24;
            --accent-hover: #f59e0b;
            --accent-ghost: rgba(251, 191, 36, 0.15);
            --status-success-bg: rgba(163, 230, 53, 0.2);
            --status-success-text: #a3e635;
            --status-danger-bg: rgba(252, 165, 165, 0.2);
            --status-danger-text: #fca5a5;
        }
        body { font-family: 'Inter', sans-serif; background-color: var(--bg-app); color: var(--text-primary); padding: 24px; }
        .page-container { max-width: 860px; margin: 0 auto; }
        .option-btn {
            display: flex; align-items: flex-start; width: 100%; padding: 12px 14px; margin-bottom: 8px;
            border: 1px solid var(--border-default); border-radius: 8px; background: var(--bg-surface);
            color: var(--text-secondary); text-align: left; transition: all 0.2s ease; cursor: pointer;
        }
        .option-btn:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--accent-base); }
        .option-btn.selected { background: var(--accent-ghost); border-color: var(--accent-base); box-shadow: 0 0 0 1px var(--accent-base); }
        .option-btn.correct { background: var(--status-success-bg); border-color: var(--status-success-text); color: var(--text-primary); font-weight: 600; }
        .option-btn.incorrect { background: var(--status-danger-bg); border-color: var(--status-danger-text); color: var(--text-primary); }
        .justification-box {
            display: none; margin-top: 12px; padding: 14px; border-left: 4px solid var(--accent-base);
            background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid var(--border-default); border-left-width: 4px;
            font-size: 13px; color: var(--text-muted); line-height: 1.6;
        }
        #resultsModal { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
        #resultsModal.show { opacity: 1; pointer-events: auto; }
    </style>
</head>
<body>
    <div class="page-container">
        <header class="mb-8 pb-4 border-b border-border-default flex justify-between items-center flex-wrap gap-4">
            <div>
                <h1 class="text-2xl font-bold text-accent-base flex items-center gap-2">
                    <span>⚡</span> DocuExam Builder
                </h1>
                <p class="text-sm text-text-muted mt-1" id="examInstructions">Modo: ${evalMode === "instant" ? "Formativo (Feedback inmediato)" : "Realista (Evaluación al enviar)"}</p>
            </div>
            <button onclick="window.print()" class="text-xs font-bold bg-alt border border-border-default hover:bg-hover px-3 py-1.5 rounded-lg text-text-primary">
                Imprimir / Guardar PDF
            </button>
        </header>

        <div id="renderedContent">
            ${renderedHtmlContent}
        </div>
    </div>

    <!-- Modal de Resultados -->
    <div id="resultsModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div class="bg-surface border-2 border-accent-base p-6 sm:p-8 w-full max-w-lg rounded-2xl text-center shadow-2xl">
            <h2 class="text-2xl font-bold text-text-primary mb-1">Resultados del Examen</h2>
            <p class="text-sm text-text-muted mb-6">${fileName}</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div class="p-3 bg-alt rounded-xl border border-border-default">
                    <div class="text-xs text-text-muted uppercase font-bold">Nota</div>
                    <div class="text-2xl font-black text-accent-base"><span id="resModalGrade">0.00</span><span class="text-xs text-text-muted">/10</span></div>
                </div>
                <div class="p-3 bg-alt rounded-xl border border-border-default">
                    <div class="text-xs text-text-muted uppercase font-bold">Precisión</div>
                    <div class="text-2xl font-black text-text-primary" id="resModalPct">0%</div>
                </div>
                <div class="p-3 bg-success-bg rounded-xl border border-success-text">
                    <div class="text-xs text-success-text uppercase font-bold">Aciertos</div>
                    <div class="text-2xl font-black text-success-text" id="resModalCorrect">0</div>
                </div>
                <div class="p-3 bg-danger-bg rounded-xl border border-danger-text">
                    <div class="text-xs text-danger-text uppercase font-bold">Fallos</div>
                    <div class="text-2xl font-black text-danger-text" id="resModalIncorrect">0</div>
                </div>
            </div>
            <button onclick="document.getElementById('resultsModal').classList.remove('show')" class="bg-accent-base text-black font-bold px-6 py-2.5 rounded-xl hover:bg-accent-hover transition-all">
                Cerrar y Revisar
            </button>
        </div>
    </div>

    <script>
        let examSubmitted = false;
        let mode = '${evalMode}';
        let correctCount = 0;
        let incorrectCount = 0;
        let answeredCount = 0;
        let totalCount = document.querySelectorAll('.question-block, .p-4.rounded-xl.bg-surface').length;

        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.onclick = function() {
                if (examSubmitted) return;
                const card = this.closest('.question-block') || this.closest('.p-4.rounded-xl.bg-surface');
                const container = this.closest('.options-container') || this.closest('.flex-col');
                const justDiv = card.querySelector('.justification-box');
                const allBtns = container.querySelectorAll('.option-btn');
                const correctIdx = Array.from(allBtns).findIndex(b => b.getAttribute('data-correct') === 'true');

                if (mode === 'instant') {
                    if (card.dataset.answered === "true") return;
                    card.dataset.answered = "true";
                    allBtns.forEach(b => b.disabled = true);
                    answeredCount++;

                    if (this.getAttribute('data-correct') === 'true') {
                        this.classList.add('correct');
                        correctCount++;
                    } else {
                        this.classList.add('incorrect');
                        if (correctIdx >= 0) allBtns[correctIdx].classList.add('correct');
                        incorrectCount++;
                    }
                    if (justDiv) justDiv.style.display = 'block';
                } else {
                    allBtns.forEach(b => {
                        b.classList.remove('selected');
                        b.dataset.selected = 'false';
                    });
                    this.classList.add('selected');
                    this.dataset.selected = 'true';
                }
            };
        });

        function submitStandaloneExam() {
            if (examSubmitted) return;
            examSubmitted = true;
            correctCount = 0;
            incorrectCount = 0;
            answeredCount = 0;

            document.querySelectorAll('.question-block, .p-4.rounded-xl.bg-surface').forEach(card => {
                const btns = card.querySelectorAll('.option-btn');
                const justDiv = card.querySelector('.justification-box');
                let answeredThis = false;

                btns.forEach(btn => {
                    btn.disabled = true;
                    const isCorrect = btn.getAttribute('data-correct') === 'true';
                    const isSelected = btn.dataset.selected === 'true';

                    if (isSelected) {
                        answeredThis = true;
                        if (isCorrect) {
                            btn.classList.add('correct');
                            correctCount++;
                        } else {
                            btn.classList.add('incorrect');
                            incorrectCount++;
                        }
                    }
                    if (isCorrect && !isSelected) {
                        btn.classList.add('correct');
                    }
                    btn.classList.remove('selected');
                });

                if (answeredThis) answeredCount++;
                if (justDiv) justDiv.style.display = 'block';
            });

            const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
            const nota = totalCount > 0 ? ((correctCount / totalCount) * 10).toFixed(2) : "0.00";

            document.getElementById('resModalGrade').textContent = nota;
            document.getElementById('resModalPct').textContent = pct + "%";
            document.getElementById('resModalCorrect').textContent = correctCount;
            document.getElementById('resModalIncorrect').textContent = incorrectCount;
            document.getElementById('resultsModal').classList.add('show');
        }
    </script>
</body>
</html>`;
}
