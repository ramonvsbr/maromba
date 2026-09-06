/* =========================================================
   MAROMBA — app.js
   Toda a lógica roda no navegador, dados salvos no localStorage.
   ========================================================= */

// ---------- storage ----------
const STORAGE_KEYS = {
  EQUIP: 'maromba_equipamentos',
  TREINOS: 'maromba_treinos',
  HIST: 'maromba_historico',
  ATIVA: 'maromba_sessao_ativa',
  CUSTOM: 'maromba_exercicios_personalizados',
  DIETA: 'maromba_dieta',
  CUSTOM_ALIMENTOS: 'maromba_alimentos_personalizados',
  META_DIETA: 'maromba_meta_dieta',
  AGUA: 'maromba_agua',
  AGUA_CONFIG: 'maromba_agua_config',
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('Falha ao ler', key, e);
    return fallback;
  }
}
function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Falha ao salvar', key, e);
    toast('Não foi possível salvar (armazenamento local cheio ou bloqueado).');
  }
}
function getEquip() { return loadJSON(STORAGE_KEYS.EQUIP, []); }
function setEquip(arr) { saveJSON(STORAGE_KEYS.EQUIP, arr); }
function getTreinos() { return loadJSON(STORAGE_KEYS.TREINOS, []); }
function setTreinos(arr) { saveJSON(STORAGE_KEYS.TREINOS, arr); }
function getHistorico() { return loadJSON(STORAGE_KEYS.HIST, []); }
function setHistorico(arr) { saveJSON(STORAGE_KEYS.HIST, arr); }
function getSessaoAtiva() { return loadJSON(STORAGE_KEYS.ATIVA, null); }
function setSessaoAtiva(obj) { saveJSON(STORAGE_KEYS.ATIVA, obj); }
function getCustomExercises() { return loadJSON(STORAGE_KEYS.CUSTOM, []); }
function setCustomExercises(arr) { saveJSON(STORAGE_KEYS.CUSTOM, arr); syncCustomExercises(); }
// mantém a variável global CUSTOM_EXERCISES (definida em data.js) em dia
// com o que está salvo, pra exerciseById()/allExercises() sempre enxergarem
// os exercícios personalizados mais recentes.
function syncCustomExercises() { CUSTOM_EXERCISES = getCustomExercises(); }
function getDieta() { return loadJSON(STORAGE_KEYS.DIETA, []); }
function setDieta(arr) { saveJSON(STORAGE_KEYS.DIETA, arr); }
function getCustomFoods() { return loadJSON(STORAGE_KEYS.CUSTOM_ALIMENTOS, []); }
function setCustomFoods(arr) { saveJSON(STORAGE_KEYS.CUSTOM_ALIMENTOS, arr); syncCustomFoods(); }
// mantém a variável global CUSTOM_FOODS (definida em taco.js) em dia com o
// que está salvo, pra foodById()/allFoods() sempre enxergarem os alimentos
// personalizados mais recentes.
function syncCustomFoods() { CUSTOM_FOODS = getCustomFoods(); }
// meta diária de calorias/macros, definida pelo usuário na aba Dieta pra
// comparar com o que foi consumido no dia. Valor 0 (ou ausente) em um campo
// significa "sem meta definida" pra aquele macro específico.
function getMetaDieta() { return loadJSON(STORAGE_KEYS.META_DIETA, { kcal: 0, prot: 0, carb: 0, gord: 0 }); }
function setMetaDieta(obj) { saveJSON(STORAGE_KEYS.META_DIETA, obj); }
// registros de consumo de água: [{ id, data:'AAAA-MM-DD', horario:'HH:MM', ml }]
function getAgua() { return loadJSON(STORAGE_KEYS.AGUA, []); }
function setAgua(arr) { saveJSON(STORAGE_KEYS.AGUA, arr); }
// config de água: meta diária, janela acordado (pra não notificar de madrugada)
// e intervalo dos lembretes. ultimaNotificacaoTs guarda quando foi o último
// lembrete disparado, pra respeitar o intervalo entre um recarregamento de
// página e outro.
function getAguaConfig() {
  return loadJSON(STORAGE_KEYS.AGUA_CONFIG, {
    metaMl: 2000,
    acordar: '07:00',
    dormir: '23:00',
    intervaloMin: 60,
    notificacoesAtivas: false,
    ultimaNotificacaoTs: 0,
  });
}
function setAguaConfig(obj) { saveJSON(STORAGE_KEYS.AGUA_CONFIG, obj); }

// ---------- helpers ----------
function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDateBR(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
function shiftDateISO(iso, dias) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
function horaAtualHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function formatDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rm = m % 60;
  return rm ? `${h}h ${rm}min` : `${h}h`;
}
function formatClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function exerciseAvailable(ex, equipSet) {
  return ex.equipamento.every(id => equipSet.has(id));
}
// tempo assumido por repetição, usado só pra estimativa (não é cronômetro real)
const SEGUNDOS_POR_REPETICAO = 3;
const SEGUNDOS_TRANSICAO_EXERCICIO = 45;

function estimateExerciseSeconds(cfg) {
  return cfg.series * (cfg.repeticoes * SEGUNDOS_POR_REPETICAO + cfg.pausa);
}
function estimateTreinoSeconds(exercicios) {
  if (!exercicios.length) return 0;
  const soma = exercicios.reduce((acc, e) => acc + estimateExerciseSeconds(e), 0);
  return soma + (exercicios.length - 1) * SEGUNDOS_TRANSICAO_EXERCICIO;
}
function unionMuscles(exercicios, { onlyPrimary = false } = {}) {
  const set = new Set();
  exercicios.forEach(cfg => {
    const ex = exerciseById(cfg.exercicioId);
    if (!ex) return;
    ex.musculos.primarios.forEach(m => set.add(m));
    if (!onlyPrimary) ex.musculos.secundarios.forEach(m => set.add(m));
  });
  return [...set];
}
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ---------- ícones pequenos (usados dentro de botões) ----------
const ICON_PLAY = '<svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M6 4l14 8-14 8V4z" fill="currentColor" stroke="none"/></svg>';
const ICON_EDIT = '<svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
const ICON_TRASH = '<svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>';
const ICON_UP = '<svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>';
const ICON_DOWN = '<svg class="icon" viewBox="0 0 24 24" style="width:13px;height:13px"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
const ICON_DOWNLOAD = '<svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>';
const ICON_UPLOAD = '<svg class="icon" viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 4h16"/></svg>';

// ---------- modal de confirmação (substitui confirm() nativo) ----------
function showConfirm(message, onConfirm, opts = {}) {
  const modal = document.getElementById('modal-confirm');
  const msgEl = document.getElementById('confirm-msg');
  const btnOk = document.getElementById('btn-confirm-ok');
  const btnCancel = document.getElementById('btn-confirm-cancel');
  msgEl.textContent = message;
  btnOk.textContent = opts.okLabel || 'Confirmar';
  btnOk.className = 'btn ' + (opts.okClass || 'btn-danger');
  modal.hidden = false;

  function cleanup() {
    modal.hidden = true;
    btnOk.removeEventListener('click', onOk);
    btnCancel.removeEventListener('click', onCancel);
    modal.removeEventListener('click', onOverlay);
  }
  function onOk() { cleanup(); onConfirm(); }
  function onCancel() { cleanup(); }
  function onOverlay(e) { if (e.target === modal) onCancel(); }
  btnOk.addEventListener('click', onOk);
  btnCancel.addEventListener('click', onCancel);
  modal.addEventListener('click', onOverlay);
}

// ---------- áudio do fim de descanso ----------
// O AudioContext precisa nascer dentro de um gesto do usuário pra não ficar
// suspenso; criamos ele uma única vez no primeiro toque/clique na página e
// reaproveitamos depois, mesmo quando o beep dispara de um setInterval.
let audioCtx = null;
function ensureAudioCtx() {
  if (audioCtx) return audioCtx;
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return null;
  try { audioCtx = new AudioCtxClass(); } catch (e) { audioCtx = null; }
  return audioCtx;
}
document.addEventListener('pointerdown', ensureAudioCtx, { once: true });

function tocarBip(freq, inicioMs, duracaoMs) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  setTimeout(() => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracaoMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duracaoMs / 1000 + 0.02);
    } catch (e) { /* silencioso */ }
  }, inicioMs);
}
function alertaFimDescanso() {
  try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* silencioso */ }
  tocarBip(880, 0, 260);
  tocarBip(1175, 220, 260);
}

// ---------- Screen Wake Lock (mantém a tela acesa durante o treino) ----------
let wakeLock = null;
async function requestWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) {
    wakeLock = null; // ex.: aba em segundo plano — sem problema, tentamos de novo ao voltar
  }
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentTab === 'sessao' && getSessaoAtiva()) {
    requestWakeLock();
  }
});

// ---------- estado de navegação ----------
const APP = document.getElementById('app');
const MONTAR_MOUNT = document.getElementById('montar-mount');
const CONFIG_MOUNT = document.getElementById('config-mount');
const MODAL_MONTAR = document.getElementById('modal-montar');
const MODAL_CONFIG = document.getElementById('modal-config');
const EXERCICIO_CUSTOM_MOUNT = document.getElementById('exercicio-custom-mount');
const MODAL_EXERCICIO_CUSTOM = document.getElementById('modal-exercicio-custom');
const REFEICAO_MOUNT = document.getElementById('refeicao-mount');
const MODAL_REFEICAO = document.getElementById('modal-refeicao');
const ALIMENTO_CUSTOM_MOUNT = document.getElementById('alimento-custom-mount');
const MODAL_ALIMENTO_CUSTOM = document.getElementById('modal-alimento-custom');
const META_DIETA_MOUNT = document.getElementById('meta-dieta-mount');
const MODAL_META_DIETA = document.getElementById('modal-meta-dieta');
const AGUA_CONFIG_MOUNT = document.getElementById('agua-config-mount');
const MODAL_AGUA_CONFIG = document.getElementById('modal-agua-config');

let currentTab = 'meus-treinos';          // 'meus-treinos' | 'sessao' | 'historico' | 'equipamentos' | 'exercicios' | 'dieta' | 'agua'
let draftTreino = null;                   // treino sendo montado/editado
let musculosAlvoMontagem = new Set();     // grupos musculares marcados na tela "montar treino"
let filtroMusculo = 'todos';
let filtroBusca = '';
let somenteDisponiveis = true;
let exercicioAberto = null;
let buscaMontagem = {};           // termo de busca por caixa de grupo muscular, na tela "montar treino"
let draftExercicioCustom = null;  // exercício personalizado sendo cadastrado
let sessaoHistAberta = null;
let exercicioGraficoSelecionado = null;
let dietaData = todayISO();       // dia sendo visualizado na aba Dieta
let refeicaoAberta = null;        // id da refeição expandida na lista do dia
let draftRefeicao = null;         // refeição sendo criada/editada no modal
let buscaAlimentoForm = '';       // termo de busca de alimento dentro do modal de refeição
let draftAlimentoCustom = null;   // alimento personalizado sendo cadastrado
let draftMetaDieta = null;        // meta de calorias/macros sendo editada no modal
let graficoPeriodo = '3m';   // '1m' | '3m' | '6m' | '1a' | 'tudo'
let graficoZoom = null;      // { inicio: 'AAAA-MM-DD', fim: 'AAAA-MM-DD' } | null — recorte extra por arraste no gráfico
let aguaData = todayISO();        // dia sendo visualizado na aba Água
let draftAguaConfig = null;       // config de meta/lembretes de água sendo editada no modal
const AGUA_PRESETS = [200, 250, 300, 500, 750, 1000]; // ml — medidas rápidas padronizadas

const PERIODOS_GRAFICO = [
  { id: '1m', label: '1 mês' },
  { id: '3m', label: '3 meses' },
  { id: '6m', label: '6 meses' },
  { id: '1a', label: '1 ano' },
  { id: 'tudo', label: 'Tudo' },
];

function dataCorteParaPeriodo(periodo) {
  if (periodo === 'tudo') return null;
  const meses = { '1m': 1, '3m': 3, '6m': 6, '1a': 12 }[periodo] || 3;
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d.toISOString().slice(0, 10);
}
const sessaoTimers = { elapsedInt: null, restInt: null };

function switchTab(id) { currentTab = id; render(); }
function clearSessaoTimers() {
  if (sessaoTimers.elapsedInt) clearInterval(sessaoTimers.elapsedInt);
  if (sessaoTimers.restInt) clearInterval(sessaoTimers.restInt);
  sessaoTimers.elapsedInt = null; sessaoTimers.restInt = null;
}

function render() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
  // Botão "Mais" do rodapé mobile: fica marcado como ativo quando a aba
  // atual é uma das que moraram pra dentro do menu (histórico/equipamentos/exercícios).
  const navMoreToggle = document.getElementById('btn-nav-more');
  if (navMoreToggle) navMoreToggle.classList.toggle('active', ['historico', 'equipamentos', 'exercicios'].includes(currentTab));
  const ativaBtn = document.querySelector('.nav-btn[data-tab="sessao"]');
  if (ativaBtn) ativaBtn.classList.toggle('has-live', !!getSessaoAtiva());

  if (currentTab !== 'sessao') { clearSessaoTimers(); releaseWakeLock(); }

  switch (currentTab) {
    case 'meus-treinos': renderMeusTreinos(); break;
    case 'sessao': renderSessao(); break;
    case 'historico': renderHistorico(); break;
    case 'equipamentos': renderEquipamentos(); break;
    case 'exercicios': renderExercicios(); break;
    case 'dieta': renderDieta(); break;
    case 'agua': renderAgua(); break;
    default: renderMeusTreinos();
  }
}

// ================= MODAIS =================
function openMontarNovo() {
  draftTreino = { id: null, nome: '', exercicios: [] };
  musculosAlvoMontagem = new Set();
  buscaMontagem = {};
  openMontar();
}
function openMontarEditar(treino) {
  draftTreino = JSON.parse(JSON.stringify(treino));
  musculosAlvoMontagem = new Set(unionMuscles(draftTreino.exercicios, { onlyPrimary: true }));
  buscaMontagem = {};
  openMontar();
}
function openMontar() {
  MODAL_MONTAR.hidden = false;
  renderMontarTreino();
}
function closeMontar() {
  MODAL_MONTAR.hidden = true;
}
function openConfig() {
  MODAL_CONFIG.hidden = false;
  renderDados();
}
function closeConfig() {
  MODAL_CONFIG.hidden = true;
}
function openExercicioCustom() {
  draftExercicioCustom = { nome: '', equipamento: [], primarios: [], secundarios: [] };
  MODAL_EXERCICIO_CUSTOM.hidden = false;
  renderExercicioCustom();
}
function closeExercicioCustom() {
  MODAL_EXERCICIO_CUSTOM.hidden = true;
  draftExercicioCustom = null;
}
function openRefeicaoNova() {
  draftRefeicao = { id: null, data: dietaData, horario: horaAtualHHMM(), nome: '', ingredientes: [] };
  buscaAlimentoForm = '';
  MODAL_REFEICAO.hidden = false;
  renderRefeicaoForm();
}
function openRefeicaoEditar(r) {
  draftRefeicao = JSON.parse(JSON.stringify(r));
  buscaAlimentoForm = '';
  MODAL_REFEICAO.hidden = false;
  renderRefeicaoForm();
}
function closeRefeicao() {
  MODAL_REFEICAO.hidden = true;
  draftRefeicao = null;
}
function openAlimentoCustom() {
  draftAlimentoCustom = { nome: '', kcal: 0, prot: 0, carb: 0, gord: 0 };
  MODAL_ALIMENTO_CUSTOM.hidden = false;
  renderAlimentoCustom();
}
function openMetaDieta() {
  draftMetaDieta = { ...getMetaDieta() };
  MODAL_META_DIETA.hidden = false;
  renderMetaDietaForm();
}
function closeMetaDieta() {
  MODAL_META_DIETA.hidden = true;
  draftMetaDieta = null;
}
function closeAlimentoCustom() {
  MODAL_ALIMENTO_CUSTOM.hidden = true;
  draftAlimentoCustom = null;
}
function openAguaConfig() {
  draftAguaConfig = { ...getAguaConfig() };
  MODAL_AGUA_CONFIG.hidden = false;
  renderAguaConfigForm();
}
function closeAguaConfig() {
  MODAL_AGUA_CONFIG.hidden = true;
  draftAguaConfig = null;
}

// ================= EQUIPAMENTOS =================
function renderEquipamentos() {
  const selected = new Set(getEquip());
  APP.innerHTML = `
    <section class="panel">
      <h1>Equipamentos</h1>
      <p class="sub">Marque o que você tem disponível na academia. Isso define quais exercícios aparecem pra montar treino.</p>
      <div class="actions-row">
        <button id="btn-marcar-todos" class="btn btn-ghost btn-small">Marcar tudo</button>
        <button id="btn-desmarcar-todos" class="btn btn-ghost btn-small">Desmarcar tudo</button>
      </div>
      <div class="equip-grid">
        ${EQUIPMENT.map(eq => `
          <label class="equip-item">
            <input type="checkbox" data-equip="${eq.id}" ${selected.has(eq.id) ? 'checked' : ''}/>
            <span>${eq.nome}</span>
          </label>`).join('')}
      </div>
      <p class="hint">Exercícios que usam só o peso do corpo continuam disponíveis mesmo sem marcar nada.</p>
      <div id="equip-saved" class="saved-flag" hidden>Salvo ✓</div>
    </section>`;

  APP.querySelectorAll('[data-equip]').forEach(input => {
    input.addEventListener('change', () => {
      const set = new Set(getEquip());
      if (input.checked) set.add(input.dataset.equip); else set.delete(input.dataset.equip);
      setEquip([...set]);
      const el = document.getElementById('equip-saved');
      el.hidden = false;
      clearTimeout(el._t);
      el._t = setTimeout(() => { el.hidden = true; }, 1200);
    });
  });

  document.getElementById('btn-marcar-todos').addEventListener('click', () => {
    setEquip(EQUIPMENT.map(eq => eq.id));
    renderEquipamentos();
    toast('Todos marcados');
  });
  document.getElementById('btn-desmarcar-todos').addEventListener('click', () => {
    setEquip([]);
    renderEquipamentos();
    toast('Todos desmarcados');
  });
}

// ================= DADOS / BACKUP (dentro de Ajustes) =================
function renderDados() {
  CONFIG_MOUNT.innerHTML = `
    <section>
      <p class="hint">
        Hoje: ${getEquip().length} equipamento(s) marcado(s), ${getTreinos().length} treino(s) montado(s),
        ${getHistorico().length} sessão(ões) no histórico, ${getCustomExercises().length} exercício(s) personalizado(s),
        ${getDieta().length} refeição(ões) registrada(s), ${getCustomFoods().length} alimento(s) personalizado(s),
        ${getAgua().length} registro(s) de água${getSessaoAtiva() ? ', 1 sessão em andamento' : ''}.
      </p>
      <div class="backup-actions">
        <button id="btn-exportar-dados" class="btn btn-accent">${ICON_DOWNLOAD}Exportar backup (.json)</button>
        <button id="btn-importar-dados" class="btn btn-ghost">${ICON_UPLOAD}Importar backup (.json)</button>
      </div>
      <p class="hint backup-note">Importar um arquivo <strong>substitui</strong> todos os dados atuais deste navegador (equipamentos, treinos, histórico e sessão em andamento).</p>
    </section>`;

  document.getElementById('btn-exportar-dados').addEventListener('click', exportarDados);
  document.getElementById('btn-importar-dados').addEventListener('click', () => {
    document.getElementById('input-importar-json').click();
  });
}

function exportarDados() {
  const payload = {
    app: 'maromba',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    dados: {
      equipamentos: getEquip(),
      treinos: getTreinos(),
      historico: getHistorico(),
      sessaoAtiva: getSessaoAtiva(),
      exerciciosPersonalizados: getCustomExercises(),
      dieta: getDieta(),
      alimentosPersonalizados: getCustomFoods(),
      metaDieta: getMetaDieta(),
      agua: getAgua(),
      aguaConfig: getAguaConfig(),
    },
  };
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maromba-backup-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup exportado!');
  } catch (e) {
    console.warn('Falha ao exportar', e);
    toast('Não foi possível gerar o arquivo de backup.');
  }
}

// aceita tanto o formato do botão "Exportar" quanto o JSON colado manualmente
// via console (ver README) — nesse caso os campos vêm como string, não array.
function normalizarCampoImportado(v) {
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  return v;
}

function importarDados(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let payload;
    try {
      payload = JSON.parse(reader.result);
    } catch (e) {
      toast('Arquivo inválido: não é um JSON legível.');
      return;
    }
    const bruto = (payload && typeof payload === 'object' && payload.dados) ? payload.dados : payload;
    if (!bruto || typeof bruto !== 'object') {
      toast('Arquivo não reconhecido como backup do Maromba.');
      return;
    }
    const equipamentos = normalizarCampoImportado(bruto.equipamentos);
    const treinos = normalizarCampoImportado(bruto.treinos);
    const historico = normalizarCampoImportado(bruto.historico);
    const exerciciosPersonalizados = normalizarCampoImportado(bruto.exerciciosPersonalizados);
    const dieta = normalizarCampoImportado(bruto.dieta);
    const alimentosPersonalizados = normalizarCampoImportado(bruto.alimentosPersonalizados);
    const agua = normalizarCampoImportado(bruto.agua);
    if (!Array.isArray(equipamentos) && !Array.isArray(treinos) && !Array.isArray(historico) && !Array.isArray(exerciciosPersonalizados)
        && !Array.isArray(dieta) && !Array.isArray(alimentosPersonalizados) && !Array.isArray(agua)) {
      toast('Nenhum dado reconhecido nesse arquivo.');
      return;
    }

    showConfirm('Importar vai substituir todos os dados atuais (equipamentos, treinos, histórico, exercícios personalizados, dieta, alimentos personalizados, água e metas) por este arquivo. Continuar?', () => {
      if (Array.isArray(equipamentos)) setEquip(equipamentos);
      if (Array.isArray(treinos)) setTreinos(treinos);
      if (Array.isArray(historico)) setHistorico(historico);
      if (Array.isArray(exerciciosPersonalizados)) setCustomExercises(exerciciosPersonalizados);
      if (Array.isArray(dieta)) setDieta(dieta);
      if (Array.isArray(alimentosPersonalizados)) setCustomFoods(alimentosPersonalizados);
      if (Array.isArray(agua)) setAgua(agua);
      if ('sessaoAtiva' in bruto) setSessaoAtiva(normalizarCampoImportado(bruto.sessaoAtiva) || bruto.sessaoAtiva || null);
      const metaDieta = normalizarCampoImportado(bruto.metaDieta);
      if (metaDieta && typeof metaDieta === 'object') setMetaDieta(metaDieta);
      const aguaConfig = normalizarCampoImportado(bruto.aguaConfig);
      if (aguaConfig && typeof aguaConfig === 'object') setAguaConfig(aguaConfig);
      toast('Dados importados com sucesso!');
      closeConfig();
      currentTab = getSessaoAtiva() ? 'sessao' : 'meus-treinos';
      render();
    }, { okLabel: 'Importar e substituir' });
  };
  reader.onerror = () => toast('Não foi possível ler o arquivo.');
  reader.readAsText(file);
}

// ================= EXERCÍCIOS =================
function renderExercicios() {
  const equipSet = new Set(getEquip());
  let lista = allExercises().filter(ex =>
    filtroMusculo === 'todos' || ex.musculos.primarios.includes(filtroMusculo) || ex.musculos.secundarios.includes(filtroMusculo)
  );
  if (somenteDisponiveis) lista = lista.filter(ex => exerciseAvailable(ex, equipSet));
  const termoBusca = filtroBusca.trim().toLowerCase();
  if (termoBusca) lista = lista.filter(ex => ex.nome.toLowerCase().includes(termoBusca));
  lista = lista.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  APP.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <h1>Biblioteca de exercícios</h1>
        <button id="btn-novo-exercicio-custom" class="btn btn-ghost btn-small" style="margin-top:0">+ Exercício personalizado</button>
      </div>
      <p class="sub">Veja o que dá pra fazer com o que sua academia tem. Pra montar um treino de verdade, use o botão + em "Meus treinos".</p>
      <div class="filters-row">
        <input type="text" id="f-busca" placeholder="Buscar por nome..." value="${escapeHtml(filtroBusca)}"/>
        <select id="f-musculo">
          <option value="todos">Todos os músculos</option>
          ${MUSCLES.map(m => `<option value="${m.id}" ${filtroMusculo === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}
        </select>
        <label class="chk-inline">
          <input type="checkbox" id="f-disp" ${somenteDisponiveis ? 'checked' : ''}/>
          Só o que dá pra fazer com meus equipamentos
        </label>
      </div>
      <div class="exlist">
        ${lista.length ? lista.map(ex => exCardHTML(ex, equipSet)).join('') : `<p class="empty">Nenhum exercício encontrado com esse filtro.</p>`}
      </div>
    </section>`;

  const buscaInput = document.getElementById('f-busca');
  buscaInput.addEventListener('input', e => {
    filtroBusca = e.target.value;
    const pos = e.target.selectionStart;
    renderExercicios();
    const el = document.getElementById('f-busca');
    el.focus();
    el.setSelectionRange(pos, pos);
  });
  document.getElementById('f-musculo').addEventListener('change', e => { filtroMusculo = e.target.value; renderExercicios(); });
  document.getElementById('f-disp').addEventListener('change', e => { somenteDisponiveis = e.target.checked; renderExercicios(); });
  document.getElementById('btn-novo-exercicio-custom').addEventListener('click', openExercicioCustom);
  APP.querySelectorAll('.ex-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      exercicioAberto = exercicioAberto === id ? null : id;
      renderExercicios();
    });
  });
  APP.querySelectorAll('[data-del-custom]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      showConfirm('Excluir este exercício personalizado? Treinos que já o usam vão manter apenas o nome salvo.', () => {
        setCustomExercises(getCustomExercises().filter(e => e.id !== btn.dataset.delCustom));
        exercicioAberto = null;
        renderExercicios();
        toast('Exercício personalizado excluído.');
      });
    });
  });
  if (exercicioAberto) {
    const box = document.getElementById('ex-detail-mount');
    const exAtual = exerciseById(exercicioAberto);
    if (box && exAtual) renderBodyMap(box, exAtual.musculos.primarios, exAtual.musculos.secundarios);
  }
}

function exCardHTML(ex, equipSet) {
  const disponivel = exerciseAvailable(ex, equipSet);
  const faltando = ex.equipamento.filter(id => !equipSet.has(id)).map(id => EQUIPMENT.find(e => e.id === id)?.nome);
  const aberto = exercicioAberto === ex.id;
  return `
    <div class="ex-card ${disponivel ? '' : 'ex-indisponivel'} ${aberto ? 'ex-aberto' : ''}" data-id="${ex.id}">
      <div class="ex-card-head">
        <span class="ex-nome">${ex.nome}</span>
        <span class="ex-card-head-right">
          ${ex.personalizado ? '<span class="badge-custom">personalizado</span>' : ''}
          ${disponivel ? '' : '<span class="badge-off">falta equipamento</span>'}
        </span>
      </div>
      <div class="chip-row">
        ${ex.musculos.primarios.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}
        ${ex.musculos.secundarios.map(m => `<span class="chip chip-secondary">${muscleName(m)}</span>`).join('')}
      </div>
      ${aberto ? `
        <div class="ex-detail">
          <div id="ex-detail-mount" class="bodymap-mount small"></div>
          <div class="ex-detail-info">
            <p><strong>Equipamento necessário:</strong> ${ex.equipamento.length ? ex.equipamento.map(id => EQUIPMENT.find(e => e.id === id)?.nome).join(', ') : 'Nenhum (peso do corpo)'}</p>
            ${!disponivel ? `<p class="missing">Falta: ${faltando.join(', ')}</p>` : ''}
            ${historicoResumoExercicio(ex.id)}
            ${ex.personalizado ? `<button class="btn btn-danger btn-small" data-del-custom="${ex.id}">${ICON_TRASH}Excluir exercício personalizado</button>` : ''}
          </div>
        </div>` : ''}
    </div>`;
}

function historicoResumoExercicio(exId) {
  const hist = getHistorico();
  let ultimo = null;
  for (let i = hist.length - 1; i >= 0; i--) {
    const e = hist[i].exercicios.find(x => x.exercicioId === exId);
    if (e && e.sets.length) {
      const maxSet = e.sets.reduce((a, b) => (b.peso > a.peso ? b : a), e.sets[0]);
      ultimo = { data: hist[i].data, peso: maxSet.peso, reps: maxSet.reps };
      break;
    }
  }
  if (!ultimo) return '<p class="hint">Ainda sem histórico para este exercício.</p>';
  return `<p class="hint">Última carga registrada: <strong>${ultimo.peso}kg</strong> × ${ultimo.reps} em ${formatDateBR(ultimo.data)}</p>`;
}

// ================= EXERCÍCIO PERSONALIZADO (modal) =================
function ensureDraftExercicioCustom() {
  if (!draftExercicioCustom) draftExercicioCustom = { nome: '', equipamento: [], primarios: [], secundarios: [] };
}

function renderExercicioCustom() {
  ensureDraftExercicioCustom();
  const d = draftExercicioCustom;

  EXERCICIO_CUSTOM_MOUNT.innerHTML = `
    <section>
      <h1>Novo exercício personalizado</h1>
      <p class="sub">Cadastre um exercício que não está na biblioteca fixa — por exemplo, uma máquina específica da sua academia.</p>

      <div class="field-row">
        <label>Nome do exercício</label>
        <input id="custom-nome" type="text" placeholder="Ex.: Remada na máquina X" value="${escapeHtml(d.nome)}"/>
      </div>

      <div class="field-row">
        <label>Músculos primários (obrigatório escolher ao menos 1)</label>
        <div class="equip-grid">
          ${MUSCLES.map(m => `
            <label class="equip-item">
              <input type="checkbox" data-custom-primario="${m.id}" ${d.primarios.includes(m.id) ? 'checked' : ''}/>
              <span>${m.nome}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="field-row">
        <label>Músculos secundários (opcional)</label>
        <div class="equip-grid">
          ${MUSCLES.map(m => `
            <label class="equip-item">
              <input type="checkbox" data-custom-secundario="${m.id}" ${d.secundarios.includes(m.id) ? 'checked' : ''}/>
              <span>${m.nome}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="field-row">
        <label>Equipamento necessário (deixe tudo desmarcado para "peso do corpo")</label>
        <div class="equip-grid">
          ${EQUIPMENT.map(eq => `
            <label class="equip-item">
              <input type="checkbox" data-custom-equip="${eq.id}" ${d.equipamento.includes(eq.id) ? 'checked' : ''}/>
              <span>${eq.nome}</span>
            </label>`).join('')}
        </div>
      </div>

      <div class="actions-row">
        <button id="btn-salvar-exercicio-custom" class="btn btn-accent">Salvar exercício</button>
      </div>

      ${getCustomExercises().length ? `
        <h2 class="subtitle">Seus exercícios personalizados</h2>
        <div class="exlist">
          ${getCustomExercises().map(ex => `
            <div class="ex-card">
              <div class="ex-card-head">
                <span class="ex-nome">${escapeHtml(ex.nome)}</span>
                <button class="btn-remove" data-del-custom-inline="${ex.id}" title="Excluir">✕</button>
              </div>
              <div class="chip-row">
                ${ex.musculos.primarios.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}
                ${ex.musculos.secundarios.map(m => `<span class="chip chip-secondary">${muscleName(m)}</span>`).join('')}
              </div>
            </div>`).join('')}
        </div>` : ''}
    </section>`;

  document.getElementById('custom-nome').addEventListener('input', e => { d.nome = e.target.value; });
  EXERCICIO_CUSTOM_MOUNT.querySelectorAll('[data-custom-primario]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.customPrimario;
      if (input.checked) { d.primarios.push(id); d.secundarios = d.secundarios.filter(m => m !== id); }
      else d.primarios = d.primarios.filter(m => m !== id);
      renderExercicioCustom();
    });
  });
  EXERCICIO_CUSTOM_MOUNT.querySelectorAll('[data-custom-secundario]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.customSecundario;
      if (input.checked) { d.secundarios.push(id); d.primarios = d.primarios.filter(m => m !== id); }
      else d.secundarios = d.secundarios.filter(m => m !== id);
      renderExercicioCustom();
    });
  });
  EXERCICIO_CUSTOM_MOUNT.querySelectorAll('[data-custom-equip]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.customEquip;
      if (input.checked) d.equipamento.push(id); else d.equipamento = d.equipamento.filter(e => e !== id);
    });
  });
  document.getElementById('btn-salvar-exercicio-custom').addEventListener('click', salvarExercicioCustom);
  EXERCICIO_CUSTOM_MOUNT.querySelectorAll('[data-del-custom-inline]').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Excluir este exercício personalizado?', () => {
        setCustomExercises(getCustomExercises().filter(e => e.id !== btn.dataset.delCustomInline));
        renderExercicioCustom();
        toast('Exercício personalizado excluído.');
      });
    });
  });
}

function salvarExercicioCustom() {
  const d = draftExercicioCustom;
  const nome = d.nome.trim();
  if (!nome) { toast('Dê um nome ao exercício antes de salvar.'); return; }
  if (d.primarios.length === 0) { toast('Escolha ao menos um músculo primário.'); return; }
  const novo = {
    id: 'custom_' + uid(),
    nome,
    equipamento: [...d.equipamento],
    musculos: { primarios: [...d.primarios], secundarios: [...d.secundarios] },
    personalizado: true,
  };
  setCustomExercises([...getCustomExercises(), novo]);
  draftExercicioCustom = { nome: '', equipamento: [], primarios: [], secundarios: [] };
  closeExercicioCustom();
  currentTab = 'exercicios';
  render();
  toast('Exercício personalizado salvo!');
}

// ================= MONTAR TREINO (modal, aberto pelo botão +) =================
function ensureDraft() {
  if (!draftTreino) draftTreino = { id: null, nome: '', exercicios: [] };
}

function renderMontarTreino() {
  ensureDraft();
  const equipSet = new Set(getEquip());
  const disponiveis = allExercises().filter(ex => exerciseAvailable(ex, equipSet)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const jaAdicionados = new Set(draftTreino.exercicios.map(e => e.exercicioId));
  const musculosOrdenados = MUSCLES.filter(m => musculosAlvoMontagem.has(m.id));
  const musculosDisponiveis = MUSCLES.filter(m => !musculosAlvoMontagem.has(m.id));
  const musculos = unionMuscles(draftTreino.exercicios);
  const estimSec = estimateTreinoSeconds(draftTreino.exercicios);

  MONTAR_MOUNT.innerHTML = `
    <section>
      <h1>${draftTreino.id ? 'Editar treino' : 'Adicionar treino'}</h1>
      <div class="field-row">
        <label>Nome do treino</label>
        <input id="treino-nome" type="text" placeholder="Ex.: Treino A — Peito e tríceps" value="${escapeHtml(draftTreino.nome)}"/>
      </div>

      <div class="field-row">
        <label>Adicionar grupo muscular (abre uma caixa de exercícios pra ele)</label>
        <div class="add-row">
          <select id="add-musculo-alvo" ${musculosDisponiveis.length === 0 ? 'disabled' : ''}>
            ${musculosDisponiveis.length
              ? musculosDisponiveis.map(m => `<option value="${m.id}">${m.nome}</option>`).join('')
              : '<option>Todos os grupos já foram adicionados</option>'}
          </select>
          <button id="btn-add-musculo-alvo" class="btn" ${musculosDisponiveis.length === 0 ? 'disabled' : ''}>Adicionar</button>
        </div>
      </div>

      <div class="musculo-add-boxes">
        ${musculosOrdenados.length ? musculosOrdenados.map(m => {
          const todasOpcoes = disponiveis.filter(ex => ex.musculos.primarios.includes(m.id) && !jaAdicionados.has(ex.id));
          const termo = (buscaMontagem[m.id] || '').trim().toLowerCase();
          const opcoes = termo ? todasOpcoes.filter(ex => ex.nome.toLowerCase().includes(termo)) : todasOpcoes;
          return `
          <div class="muscle-add-box">
            <div class="muscle-add-box-head">
              <h3>${m.nome}</h3>
              <button class="btn-remove" data-remove-musculo-alvo="${m.id}" title="Remover grupo muscular">✕</button>
            </div>
            ${todasOpcoes.length ? `<input type="text" class="input-busca-musculo" data-busca-musculo="${m.id}" placeholder="Buscar exercício por nome..." value="${escapeHtml(buscaMontagem[m.id] || '')}"/>` : ''}
            <div class="add-row">
              <select data-add-musculo="${m.id}" ${opcoes.length === 0 ? 'disabled' : ''}>
                ${opcoes.length
                  ? opcoes.map(ex => `<option value="${ex.id}">${ex.nome}</option>`).join('')
                  : `<option>${termo ? 'Nenhum exercício encontrado com essa busca' : `Nenhum exercício de ${m.nome.toLowerCase()} disponível com seu equipamento`}</option>`}
              </select>
              <button class="btn" data-add-btn-musculo="${m.id}" ${opcoes.length === 0 ? 'disabled' : ''}>Adicionar</button>
            </div>
          </div>`;
        }).join('') : '<p class="empty">Adicione um grupo muscular acima para ver os exercícios disponíveis.</p>'}
      </div>

      <div class="draft-list">
        ${draftTreino.exercicios.length
          ? draftTreino.exercicios.map((cfg, i, arr) => draftRowHTML(cfg, i, arr.length)).join('')
          : '<p class="empty">Nenhum exercício adicionado ainda.</p>'}
      </div>

      <div class="summary-bar">
        <div>
          <span class="summary-label">Músculos no treino</span>
          <div class="chip-row">${musculos.length ? musculos.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('') : '<span class="hint">—</span>'}</div>
        </div>
        <div>
          <span class="summary-label">Tempo estimado</span>
          <div class="summary-value">${formatDuration(estimSec)}</div>
        </div>
      </div>

      <div class="actions-row">
        <button id="btn-salvar-treino" class="btn btn-accent">Salvar treino</button>
        <button id="btn-limpar-treino" class="btn btn-ghost">Novo / limpar</button>
      </div>
    </section>`;

  document.getElementById('treino-nome').addEventListener('input', e => { draftTreino.nome = e.target.value; });

  const btnAddMusculo = document.getElementById('btn-add-musculo-alvo');
  if (btnAddMusculo) btnAddMusculo.addEventListener('click', () => {
    const sel = document.getElementById('add-musculo-alvo');
    if (!sel.value) return;
    musculosAlvoMontagem.add(sel.value);
    renderMontarTreino();
  });

  MONTAR_MOUNT.querySelectorAll('[data-remove-musculo-alvo]').forEach(btn => {
    btn.addEventListener('click', () => {
      musculosAlvoMontagem.delete(btn.dataset.removeMusculoAlvo);
      delete buscaMontagem[btn.dataset.removeMusculoAlvo];
      renderMontarTreino();
    });
  });

  MONTAR_MOUNT.querySelectorAll('[data-busca-musculo]').forEach(input => {
    input.addEventListener('input', e => {
      const musculoId = input.dataset.buscaMusculo;
      buscaMontagem[musculoId] = e.target.value;
      const pos = e.target.selectionStart;
      renderMontarTreino();
      const el = MONTAR_MOUNT.querySelector(`[data-busca-musculo="${musculoId}"]`);
      if (el) { el.focus(); el.setSelectionRange(pos, pos); }
    });
  });

  MONTAR_MOUNT.querySelectorAll('[data-add-btn-musculo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const musculoId = btn.dataset.addBtnMusculo;
      const sel = MONTAR_MOUNT.querySelector(`[data-add-musculo="${musculoId}"]`);
      if (!sel || !sel.value) return;
      draftTreino.exercicios.push({ exercicioId: sel.value, series: 3, repeticoes: 10, peso: 0, pausa: 60 });
      renderMontarTreino();
    });
  });

  MONTAR_MOUNT.querySelectorAll('[data-remove-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      draftTreino.exercicios.splice(Number(btn.dataset.removeIdx), 1);
      renderMontarTreino();
    });
  });

  MONTAR_MOUNT.querySelectorAll('[data-move-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.moveUp);
      if (idx <= 0) return;
      const arr = draftTreino.exercicios;
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      renderMontarTreino();
    });
  });
  MONTAR_MOUNT.querySelectorAll('[data-move-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.moveDown);
      const arr = draftTreino.exercicios;
      if (idx >= arr.length - 1) return;
      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      renderMontarTreino();
    });
  });

  MONTAR_MOUNT.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('input', () => {
      const idx = Number(input.dataset.idx), field = input.dataset.field;
      let val = Number(input.value);
      if (Number.isNaN(val) || val < 0) val = 0;
      draftTreino.exercicios[idx][field] = val;
      updateResumoInline();
    });
  });

  document.getElementById('btn-salvar-treino').addEventListener('click', salvarTreino);
  document.getElementById('btn-limpar-treino').addEventListener('click', () => {
    draftTreino = { id: null, nome: '', exercicios: [] };
    musculosAlvoMontagem = new Set();
    renderMontarTreino();
  });
}

function draftRowHTML(cfg, i, total) {
  const ex = exerciseById(cfg.exercicioId);
  return `
    <div class="draft-row draft-row-reorderable">
      <div class="reorder-btns">
        <button class="btn-reorder" data-move-up="${i}" title="Mover para cima" ${i === 0 ? 'disabled' : ''}>${ICON_UP}</button>
        <button class="btn-reorder" data-move-down="${i}" title="Mover para baixo" ${i === total - 1 ? 'disabled' : ''}>${ICON_DOWN}</button>
      </div>
      <div class="draft-row-body">
        <div class="draft-row-head">
          <span class="ex-nome">${ex.nome}</span>
          <button class="btn-remove" data-remove-idx="${i}" title="Remover">✕</button>
        </div>
        <div class="chip-row">${ex.musculos.primarios.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}</div>
        <div class="draft-fields">
          <label>Séries<input type="number" min="1" data-idx="${i}" data-field="series" value="${cfg.series}"/></label>
          <label>Repetições<input type="number" min="1" data-idx="${i}" data-field="repeticoes" value="${cfg.repeticoes}"/></label>
          <label>Peso (kg)<input type="number" min="0" step="0.5" data-idx="${i}" data-field="peso" value="${cfg.peso}"/></label>
          <label>Pausa (s)<input type="number" min="0" step="5" data-idx="${i}" data-field="pausa" value="${cfg.pausa}"/></label>
        </div>
      </div>
    </div>`;
}

function updateResumoInline() {
  const musculos = unionMuscles(draftTreino.exercicios);
  const estimSec = estimateTreinoSeconds(draftTreino.exercicios);
  const chipRow = MONTAR_MOUNT.querySelector('.summary-bar .chip-row');
  const val = MONTAR_MOUNT.querySelector('.summary-value');
  if (chipRow) chipRow.innerHTML = musculos.length ? musculos.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('') : '<span class="hint">—</span>';
  if (val) val.textContent = formatDuration(estimSec);
}

function salvarTreino() {
  const nome = draftTreino.nome.trim();
  if (!nome) { toast('Dê um nome ao treino antes de salvar.'); return; }
  if (draftTreino.exercicios.length === 0) { toast('Adicione ao menos um exercício.'); return; }
  const treinos = getTreinos();
  if (draftTreino.id) {
    const idx = treinos.findIndex(t => t.id === draftTreino.id);
    if (idx >= 0) treinos[idx] = { ...draftTreino, nome };
  } else {
    treinos.push({ ...draftTreino, nome, id: uid(), criadoEm: Date.now() });
  }
  setTreinos(treinos);
  draftTreino = null;
  musculosAlvoMontagem = new Set();
  closeMontar();
  currentTab = 'meus-treinos';
  render();
  toast('Treino salvo!');
}

// ================= MEUS TREINOS (tela principal) =================
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function renderMeusTreinos() {
  const treinos = getTreinos();
  const hist = getHistorico();
  const mesAtual = todayISO().slice(0, 7);
  const sessoesMes = hist.filter(h => h.data.slice(0, 7) === mesAtual).length;
  const ultimaSessao = hist.slice().sort((a, b) => b.data.localeCompare(a.data))[0];

  APP.innerHTML = `
    <section class="panel">
      <div class="home-header">
        <div>
          <h1>${saudacao()}. Bora treinar?</h1>
        </div>
        <span class="home-date">${formatDateBR(todayISO())}</span>
      </div>

      <div class="stat-strip">
        <div class="stat-card">
          <span class="stat-label">Treinos montados</span>
          <span class="stat-value">${treinos.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Sessões este mês</span>
          <span class="stat-value">${sessoesMes}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Último treino feito</span>
          <span class="stat-value small">${ultimaSessao ? `${escapeHtml(ultimaSessao.treinoNome)} · ${formatDateBR(ultimaSessao.data)}` : '—'}</span>
        </div>
      </div>

      <div class="section-head"><h2>Meus treinos</h2></div>
      ${treinos.length ? `
        <div class="treino-grid">
          ${treinos.map(t => treinoCardHTML(t)).join('')}
        </div>` : `
        <div class="empty-state">
          <strong>Você ainda não tem nenhum treino montado.</strong>
          Toque no botão + no canto da tela para montar o seu primeiro.
        </div>`}
    </section>`;

  APP.querySelectorAll('[data-start]').forEach(b => b.addEventListener('click', () => iniciarSessao(b.dataset.start)));
  APP.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
    const t = treinos.find(x => x.id === b.dataset.edit);
    if (t) openMontarEditar(t);
  }));
  APP.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    showConfirm('Excluir este treino?', () => {
      setTreinos(getTreinos().filter(x => x.id !== b.dataset.del));
      render();
      toast('Treino excluído.');
    });
  }));
}

function treinoCardHTML(t) {
  const musculos = unionMuscles(t.exercicios);
  const estim = estimateTreinoSeconds(t.exercicios);
  return `
    <div class="treino-card">
      <div class="treino-card-head">
        <h3>${escapeHtml(t.nome)}</h3>
        <span class="summary-value small">${formatDuration(estim)}</span>
      </div>
      <div class="chip-row">${musculos.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}</div>
      <p class="hint">${t.exercicios.length} exercício(s)</p>
      <div class="icon-actions">
        <button class="btn-icon act-start" data-start="${t.id}">${ICON_PLAY}Iniciar</button>
        <button class="btn-icon" data-edit="${t.id}">${ICON_EDIT}Editar</button>
        <button class="btn-icon act-danger" data-del="${t.id}">${ICON_TRASH}Excluir</button>
      </div>
    </div>`;
}

// ================= SESSÃO ATIVA =================
function iniciarSessao(treinoId) {
  const disparar = () => {
    const t = getTreinos().find(x => x.id === treinoId);
    if (!t) return;
    const sessao = {
      id: uid(),
      treinoId: t.id,
      treinoNome: t.nome,
      data: todayISO(),
      iniciadoEm: Date.now(),
      exercicioAtualIdx: 0,
      exercicios: t.exercicios.map(cfg => ({
        exercicioId: cfg.exercicioId,
        seriesAlvo: cfg.series,
        repeticoesAlvo: cfg.repeticoes,
        pesoAlvo: cfg.peso,
        pausa: cfg.pausa,
        sets: [],
      })),
      estimadoSegundos: estimateTreinoSeconds(t.exercicios),
      pausaAte: null,
    };
    setSessaoAtiva(sessao);
    currentTab = 'sessao';
    render();
  };
  if (getSessaoAtiva()) {
    showConfirm('Já existe um treino em andamento. Descartar e iniciar um novo?', disparar);
  } else {
    disparar();
  }
}

function renderSessao() {
  clearSessaoTimers();
  const sessao = getSessaoAtiva();
  if (!sessao) {
    releaseWakeLock();
    APP.innerHTML = `<section class="panel"><h1>Treino ativo</h1><p class="empty">Nenhum treino em andamento. Vá em "Meus treinos" e clique em Iniciar.</p></section>`;
    return;
  }
  requestWakeLock();
  const idx = sessao.exercicioAtualIdx;
  if (idx >= sessao.exercicios.length) { renderSessaoResumoFinal(sessao); return; }

  const cfg = sessao.exercicios[idx];
  const ex = exerciseById(cfg.exercicioId);
  const serieAtual = cfg.sets.length + 1;
  const emDescanso = !!(sessao.pausaAte && sessao.pausaAte > Date.now());
  const musculosAteAgora = unionMuscles(sessao.exercicios.slice(0, idx + 1));

  APP.innerHTML = `
    <section class="panel">
      <div class="sessao-top">
        <h1>${escapeHtml(sessao.treinoNome)}</h1>
        <div class="sessao-meta">
          <span>Exercício ${idx + 1} de ${sessao.exercicios.length}</span>
          <span id="tempo-decorrido" class="mono"></span>
          ${'wakeLock' in navigator ? '<span class="wakelock-badge" title="A tela fica acesa enquanto você treina">tela sempre ativa</span>' : ''}
        </div>
      </div>

      <div class="sessao-grid">
        <div class="bodymap-mount" id="sessao-bodymap"></div>
        <div class="sessao-info">
          <h2>${ex.nome}</h2>
          <div class="chip-row">
            ${ex.musculos.primarios.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}
            ${ex.musculos.secundarios.map(m => `<span class="chip chip-secondary">${muscleName(m)}</span>`).join('')}
          </div>
          <p class="hint">Alvo: ${cfg.seriesAlvo} séries × ${cfg.repeticoesAlvo} reps · ${cfg.pesoAlvo}kg · pausa ${cfg.pausa}s</p>

          <div class="sets-log">
            ${cfg.sets.map((s, i) => `<div class="set-line done">Série ${i + 1}: ${s.peso}kg × ${s.reps}</div>`).join('')}
            ${(!emDescanso && serieAtual <= cfg.seriesAlvo) ? `
              <div class="set-line atual">
                <span>Série ${serieAtual}/${cfg.seriesAlvo}</span>
                <label>kg<input id="input-peso" type="number" step="0.5" min="0" value="${cfg.pesoAlvo}"/></label>
                <label>reps<input id="input-reps" type="number" step="1" min="0" value="${cfg.repeticoesAlvo}"/></label>
                <button id="btn-registrar-serie" class="btn btn-accent">Registrar série</button>
              </div>` : ''}
          </div>

          ${emDescanso ? `
            <div class="descanso-box">
              <span>Descansando…</span>
              <span id="pausa-countdown" class="mono big"></span>
              <button id="btn-pular-descanso" class="btn btn-ghost">Pular descanso</button>
            </div>` : ''}

          ${(!emDescanso && serieAtual > cfg.seriesAlvo) ? `
            <button id="btn-prox-exercicio" class="btn btn-accent">
              ${idx + 1 < sessao.exercicios.length ? 'Próximo exercício →' : 'Finalizar treino'}
            </button>` : ''}

          <div>
            <button id="btn-pular-exercicio" class="btn btn-ghost btn-small">Pular para o próximo exercício</button>
          </div>
        </div>
      </div>

      <div class="summary-bar">
        <div>
          <span class="summary-label">Músculos trabalhados na sessão</span>
          <div class="chip-row">${musculosAteAgora.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}</div>
        </div>
        <div>
          <span class="summary-label">Tempo estimado do treino</span>
          <div class="summary-value">${formatDuration(sessao.estimadoSegundos)}</div>
        </div>
      </div>

      <button id="btn-abandonar" class="btn btn-danger btn-small">Abandonar sessão</button>
    </section>`;

  renderBodyMap(document.getElementById('sessao-bodymap'), ex.musculos.primarios, ex.musculos.secundarios);

  const atualizaTempo = () => {
    const el = document.getElementById('tempo-decorrido');
    if (el) el.textContent = 'Tempo: ' + formatClock((Date.now() - sessao.iniciadoEm) / 1000);
  };
  atualizaTempo();
  sessaoTimers.elapsedInt = setInterval(atualizaTempo, 1000);

  if (emDescanso) {
    const atualizaPausa = () => {
      const rest = Math.max(0, Math.round((sessao.pausaAte - Date.now()) / 1000));
      const el = document.getElementById('pausa-countdown');
      if (el) el.textContent = rest + 's';
      if (rest <= 0) {
        sessao.pausaAte = null;
        setSessaoAtiva(sessao);
        alertaFimDescanso();
        render();
      }
    };
    atualizaPausa();
    sessaoTimers.restInt = setInterval(atualizaPausa, 1000);
  }

  const btnReg = document.getElementById('btn-registrar-serie');
  if (btnReg) btnReg.addEventListener('click', () => {
    const peso = Number(document.getElementById('input-peso').value) || 0;
    const reps = Number(document.getElementById('input-reps').value) || 0;
    cfg.sets.push({ peso, reps });
    if (cfg.sets.length < cfg.seriesAlvo && cfg.pausa > 0) {
      sessao.pausaAte = Date.now() + cfg.pausa * 1000;
    }
    setSessaoAtiva(sessao);
    render();
  });

  const btnPularDescanso = document.getElementById('btn-pular-descanso');
  if (btnPularDescanso) btnPularDescanso.addEventListener('click', () => {
    sessao.pausaAte = null;
    setSessaoAtiva(sessao);
    render();
  });

  const btnProx = document.getElementById('btn-prox-exercicio');
  if (btnProx) btnProx.addEventListener('click', () => {
    sessao.exercicioAtualIdx += 1;
    setSessaoAtiva(sessao);
    render();
  });

  document.getElementById('btn-pular-exercicio').addEventListener('click', () => {
    showConfirm('Pular este exercício sem completar todas as séries?', () => {
      sessao.exercicioAtualIdx += 1;
      sessao.pausaAte = null;
      setSessaoAtiva(sessao);
      render();
    });
  });

  document.getElementById('btn-abandonar').addEventListener('click', () => {
    showConfirm('Abandonar a sessão atual? O progresso não será salvo no histórico.', () => {
      clearSessaoTimers();
      releaseWakeLock();
      setSessaoAtiva(null);
      render();
    });
  });
}

function renderSessaoResumoFinal(sessao) {
  const musculos = unionMuscles(sessao.exercicios);
  const duracaoReal = Math.floor((Date.now() - sessao.iniciadoEm) / 1000);
  APP.innerHTML = `
    <section class="panel">
      <h1>Treino concluído</h1>
      <p class="hint">${escapeHtml(sessao.treinoNome)} — ${formatDateBR(sessao.data)}</p>
      <div class="summary-bar">
        <div>
          <span class="summary-label">Músculos trabalhados</span>
          <div class="chip-row">${musculos.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}</div>
        </div>
        <div>
          <span class="summary-label">Duração real</span>
          <div class="summary-value">${formatClock(duracaoReal)}</div>
        </div>
      </div>
      <div class="draft-list">
        ${sessao.exercicios.map(cfg => {
          const ex = exerciseById(cfg.exercicioId);
          return `<div class="draft-row">
            <div class="draft-row-head"><span class="ex-nome">${ex.nome}</span></div>
            ${cfg.sets.length ? cfg.sets.map((s, i) => `<div class="set-line done">Série ${i + 1}: ${s.peso}kg × ${s.reps}</div>`).join('') : '<p class="hint">Nenhuma série registrada.</p>'}
          </div>`;
        }).join('')}
      </div>
      <div class="actions-row">
        <button id="btn-salvar-historico" class="btn btn-accent">Salvar no histórico</button>
        <button id="btn-descartar-sessao" class="btn btn-ghost">Descartar</button>
      </div>
    </section>`;

  document.getElementById('btn-salvar-historico').addEventListener('click', () => {
    const registro = {
      id: uid(),
      treinoId: sessao.treinoId,
      treinoNome: sessao.treinoNome,
      data: sessao.data,
      duracaoSegundos: duracaoReal,
      estimadoSegundos: sessao.estimadoSegundos,
      musculos,
      exercicios: sessao.exercicios.map(cfg => ({ exercicioId: cfg.exercicioId, sets: cfg.sets })),
    };
    const hist = getHistorico();
    hist.push(registro);
    setHistorico(hist);
    setSessaoAtiva(null);
    currentTab = 'historico';
    render();
    toast('Treino salvo no histórico!');
  });
  document.getElementById('btn-descartar-sessao').addEventListener('click', () => {
    showConfirm('Descartar esta sessão sem salvar no histórico?', () => {
      setSessaoAtiva(null);
      currentTab = 'meus-treinos';
      render();
    });
  });
}

// ================= HISTÓRICO =================
function renderHistorico() {
  const hist = getHistorico().slice().sort((a, b) => b.data.localeCompare(a.data));
  const idsComHistorico = [...new Set(getHistorico().flatMap(s => s.exercicios.filter(e => e.sets.length).map(e => e.exercicioId)))];
  if ((!exercicioGraficoSelecionado || !idsComHistorico.includes(exercicioGraficoSelecionado)) && idsComHistorico.length) {
    exercicioGraficoSelecionado = idsComHistorico[0];
  }

  APP.innerHTML = `
    <section class="panel">
      <h1>Histórico</h1>

      <div class="field-row">
        <label>Evolução de carga por exercício</label>
        <select id="sel-grafico" ${idsComHistorico.length === 0 ? 'disabled' : ''}>
          ${idsComHistorico.length
            ? idsComHistorico.map(id => `<option value="${id}" ${exercicioGraficoSelecionado === id ? 'selected' : ''}>${exerciseById(id)?.nome || id}</option>`).join('')
            : '<option>Sem dados ainda</option>'}
        </select>
      </div>
      <div class="chart-toolbar">
        <div class="segmented" id="seg-periodo" role="group" aria-label="Período do gráfico">
          ${PERIODOS_GRAFICO.map(p => `<button type="button" class="seg-btn ${graficoPeriodo === p.id ? 'active' : ''}" data-periodo="${p.id}">${p.label}</button>`).join('')}
        </div>
        <button type="button" id="btn-reset-zoom" class="btn-link" ${graficoZoom ? '' : 'hidden'}>↺ Ver período inteiro</button>
      </div>
      <div class="chart-box">
        <canvas id="chart-canvas" width="640" height="220"></canvas>
        <p id="chart-empty" class="empty" hidden>Registre séries em pelo menos 2 sessões dentro do período selecionado para ver a evolução deste exercício.</p>
        <p class="hint chart-zoom-hint">Arraste sobre o gráfico pra dar zoom num trecho.</p>
      </div>

      <h2 class="subtitle">Sessões registradas</h2>
      ${hist.length ? '' : '<p class="empty">Nenhum treino salvo ainda. Finalize um treino em "Treino ativo".</p>'}
      <div class="hist-list">${hist.map(s => histCardHTML(s)).join('')}</div>
    </section>`;

  const sel = document.getElementById('sel-grafico');
  if (sel) sel.addEventListener('change', e => {
    exercicioGraficoSelecionado = e.target.value;
    graficoZoom = null;
    render();
  });
  APP.querySelectorAll('#seg-periodo [data-periodo]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.periodo === graficoPeriodo) return;
      graficoPeriodo = btn.dataset.periodo;
      graficoZoom = null;
      render();
    });
  });
  const btnResetZoom = document.getElementById('btn-reset-zoom');
  if (btnResetZoom) btnResetZoom.addEventListener('click', () => {
    graficoZoom = null;
    render();
  });
  if (exercicioGraficoSelecionado) desenharGrafico(exercicioGraficoSelecionado);

  APP.querySelectorAll('[data-hist-toggle]').forEach(card => {
    card.addEventListener('click', () => {
      sessaoHistAberta = sessaoHistAberta === card.dataset.histToggle ? null : card.dataset.histToggle;
      render();
    });
  });
  APP.querySelectorAll('[data-del-hist]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      showConfirm('Excluir este registro do histórico?', () => {
        setHistorico(getHistorico().filter(s => s.id !== btn.dataset.delHist));
        render();
      });
    });
  });
}

function histCardHTML(s) {
  const aberto = sessaoHistAberta === s.id;
  return `
    <div class="hist-card ${aberto ? 'ex-aberto' : ''}" data-hist-toggle="${s.id}">
      <div class="hist-card-head">
        <div><strong>${escapeHtml(s.treinoNome)}</strong><span class="hint"> — ${formatDateBR(s.data)}</span></div>
        <div class="hist-card-meta">
          <span class="mono">${formatClock(s.duracaoSegundos)}</span>
          <button class="btn-remove" data-del-hist="${s.id}" title="Excluir">✕</button>
        </div>
      </div>
      <div class="chip-row">${s.musculos.map(m => `<span class="chip chip-primary">${muscleName(m)}</span>`).join('')}</div>
      ${aberto ? `
        <div class="draft-list">
          ${s.exercicios.map(cfg => {
            const ex = exerciseById(cfg.exercicioId);
            return `<div class="draft-row">
              <div class="draft-row-head"><span class="ex-nome">${ex ? ex.nome : cfg.exercicioId}</span></div>
              ${cfg.sets.length ? cfg.sets.map((set, i) => `<div class="set-line done">Série ${i + 1}: ${set.peso}kg × ${set.reps}</div>`).join('') : '<p class="hint">Sem séries registradas.</p>'}
            </div>`;
          }).join('')}
        </div>` : ''}
    </div>`;
}

function desenharGrafico(exId) {
  const canvas = document.getElementById('chart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const hist = getHistorico().slice().sort((a, b) => a.data.localeCompare(b.data));
  const todosPontos = [];
  hist.forEach(s => {
    const cfg = s.exercicios.find(e => e.exercicioId === exId);
    if (cfg && cfg.sets.length) todosPontos.push({ data: s.data, peso: Math.max(...cfg.sets.map(x => x.peso)) });
  });

  // filtro por período (segmentado acima do gráfico)
  const dataCorte = dataCorteParaPeriodo(graficoPeriodo);
  let pontos = dataCorte ? todosPontos.filter(p => p.data >= dataCorte) : todosPontos;

  // recorte extra por zoom (arraste do usuário), guardado como datas pra
  // não bagunçar ao reaplicar sobre um `pontos` que já mudou de tamanho
  if (graficoZoom) {
    pontos = pontos.filter(p => p.data >= graficoZoom.inicio && p.data <= graficoZoom.fim);
  }

  const emptyMsg = document.getElementById('chart-empty');
  if (pontos.length < 2) {
    if (emptyMsg) emptyMsg.hidden = false;
    canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null;
    return;
  }
  if (emptyMsg) emptyMsg.hidden = true;

  const padL = 46, padR = 16, padT = 16, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const pesos = pontos.map(p => p.peso);
  let min = Math.min(...pesos), max = Math.max(...pesos);
  if (min === max) { min -= 1; max += 1; }
  const margem = (max - min) * 0.15;
  min -= margem; max += margem;
  if (min < 0) min = 0;

  const styles = getComputedStyle(document.documentElement);
  const corLinha = styles.getPropertyValue('--chalk').trim() || '#E9BD4A';
  const corGrid = styles.getPropertyValue('--line').trim() || '#34373c';
  const corTexto = styles.getPropertyValue('--text-muted').trim() || '#8b8d94';

  ctx.strokeStyle = corGrid; ctx.lineWidth = 1;
  ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = corTexto;
  const linhas = 4;
  for (let i = 0; i <= linhas; i++) {
    const y = padT + plotH - (i / linhas) * plotH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillText((min + (i / linhas) * (max - min)).toFixed(1) + 'kg', 2, y + 4);
  }

  const xFor = i => padL + (pontos.length === 1 ? plotW / 2 : (i / (pontos.length - 1)) * plotW);
  const yFor = v => padT + plotH - ((v - min) / (max - min)) * plotH;

  ctx.strokeStyle = corLinha; ctx.lineWidth = 2.5;
  ctx.beginPath();
  pontos.forEach((p, i) => { const x = xFor(i), y = yFor(p.peso); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.fillStyle = corLinha;
  pontos.forEach((p, i) => { const x = xFor(i), y = yFor(p.peso); ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = corTexto; ctx.textAlign = 'center';
  const passo = Math.max(1, Math.ceil(pontos.length / 6));
  pontos.forEach((p, i) => {
    if (i % passo !== 0 && i !== pontos.length - 1) return;
    ctx.fillText(formatDateBR(p.data).slice(0, 5), xFor(i), H - 8);
  });
  ctx.textAlign = 'left';

  // snapshot do gráfico "limpo", pra redesenhar rápido durante o arraste
  // de seleção sem ter que rodar tudo isso nesse ponto de novo
  const snapshot = ctx.getImageData(0, 0, W, H);
  configurarZoomArrasteCanvas(canvas, ctx, snapshot, pontos, padL, plotW, (inicio, fim) => {
    graficoZoom = { inicio, fim };
    render();
  });
}

/**
 * Liga o arraste de mouse/toque sobre o canvas do gráfico pra selecionar um
 * trecho e dar zoom nele. `pontos` já é a lista filtrada/atualmente visível;
 * `onSelecionar(dataInicio, dataFim)` é chamado com as datas do início e do
 * fim do trecho arrastado (não os índices), pra o zoom não ficar bagunçado
 * quando o usuário arrastar de novo em cima de um recorte já zoomado.
 */
function configurarZoomArrasteCanvas(canvas, ctx, snapshot, pontos, padL, plotW, onSelecionar) {
  const W = canvas.width, H = canvas.height;
  const podeZoom = pontos.length >= 3;
  canvas.style.cursor = podeZoom ? 'crosshair' : 'default';
  canvas.style.touchAction = 'none';

  if (!podeZoom) {
    canvas.onpointerdown = canvas.onpointermove = canvas.onpointerup = canvas.onpointercancel = null;
    return;
  }

  let arrastando = false;
  let startX = 0;

  function posPixel(ev) {
    const rect = canvas.getBoundingClientRect();
    const escala = canvas.width / rect.width;
    const x = (ev.clientX - rect.left) * escala;
    return Math.max(padL, Math.min(padL + plotW, x));
  }
  function pixelParaIndice(x) {
    const rel = (x - padL) / plotW;
    return Math.max(0, Math.min(pontos.length - 1, Math.round(rel * (pontos.length - 1))));
  }
  function desenharSelecao(x0, x1) {
    ctx.putImageData(snapshot, 0, 0);
    ctx.fillStyle = 'rgba(233,189,74,0.16)';
    ctx.fillRect(x0, 0, x1 - x0, H);
    ctx.strokeStyle = 'rgba(233,189,74,0.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, 0.5, Math.max(0, x1 - x0 - 1), H - 1);
  }

  function onDown(ev) {
    arrastando = true;
    startX = posPixel(ev);
    try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
  }
  function onMove(ev) {
    if (!arrastando) return;
    const x = posPixel(ev);
    desenharSelecao(Math.min(startX, x), Math.max(startX, x));
  }
  function onUp(ev) {
    if (!arrastando) return;
    arrastando = false;
    const x = posPixel(ev);
    ctx.putImageData(snapshot, 0, 0);
    if (Math.abs(x - startX) < 8) return; // arraste curto demais: ignora (foi só um clique)
    const i0 = pixelParaIndice(Math.min(startX, x));
    const i1 = pixelParaIndice(Math.max(startX, x));
    if (i1 <= i0) return;
    onSelecionar(pontos[i0].data, pontos[i1].data);
  }
  function onCancel() {
    arrastando = false;
    ctx.putImageData(snapshot, 0, 0);
  }

  canvas.onpointerdown = onDown;
  canvas.onpointermove = onMove;
  canvas.onpointerup = onUp;
  canvas.onpointercancel = onCancel;
}

// ================= DIETA =================
function calcTotaisIngredientes(ingredientes) {
  return ingredientes.reduce((acc, ing) => {
    acc.kcal += ing.kcal; acc.prot += ing.prot; acc.carb += ing.carb; acc.gord += ing.gord;
    return acc;
  }, { kcal: 0, prot: 0, carb: 0, gord: 0 });
}
function calcTotaisRefeicoes(lista) {
  return lista.reduce((acc, r) => {
    const t = calcTotaisIngredientes(r.ingredientes);
    acc.kcal += t.kcal; acc.prot += t.prot; acc.carb += t.carb; acc.gord += t.gord;
    return acc;
  }, { kcal: 0, prot: 0, carb: 0, gord: 0 });
}
function ingredienteFromFood(food, qtd) {
  const fator = qtd / 100;
  return {
    alimentoId: food.id,
    nome: food.nome,
    quantidade: qtd,
    kcal: food.kcal * fator,
    prot: food.prot * fator,
    carb: food.carb * fator,
    gord: food.gord * fator,
  };
}
// reescala um ingrediente já adicionado pra uma nova quantidade em gramas,
// a partir da proporção atual (funciona mesmo se o alimento de origem tiver
// sido excluído da lista de personalizados depois de adicionado à refeição)
function recalcularIngredienteQtd(ing, novaQtd) {
  const base = ing.quantidade > 0 ? ing.quantidade : 100;
  const razao = novaQtd / base;
  ing.quantidade = novaQtd;
  ing.kcal *= razao; ing.prot *= razao; ing.carb *= razao; ing.gord *= razao;
}
function macroChipsHTML(t) {
  return `
    <span class="macro-badge macro-kcal">${Math.round(t.kcal)} kcal</span>
    <span class="macro-badge">P ${t.prot.toFixed(1)}g</span>
    <span class="macro-badge">C ${t.carb.toFixed(1)}g</span>
    <span class="macro-badge">G ${t.gord.toFixed(1)}g</span>`;
}

// ---------- meta diária de calorias/macros ----------
function metaDefinida(meta) {
  return !!meta && (meta.kcal > 0 || meta.prot > 0 || meta.carb > 0 || meta.gord > 0);
}
// uma linha de progresso "consumido / meta" com barra; retorna '' se essa
// meta específica não foi definida (0 ou vazio), pra não mostrar barra zerada
function metaBarraHTML(label, atual, meta, casasDecimais, unidade) {
  if (!meta || meta <= 0) return '';
  const pct = Math.max(0, Math.min(100, Math.round((atual / meta) * 100)));
  const estourou = atual > meta;
  const fmt = n => casasDecimais ? n.toFixed(casasDecimais) : Math.round(n);
  return `
    <div class="meta-row">
      <div class="meta-row-head">
        <span class="meta-row-label">${label}</span>
        <span class="meta-row-value ${estourou ? 'over' : ''}">${fmt(atual)} / ${fmt(meta)}${unidade}</span>
      </div>
      <div class="meta-bar-track">
        <div class="meta-bar-fill ${estourou ? 'over' : ''}" style="width:${pct}%"></div>
      </div>
    </div>`;
}
function metaProgressoHTML(totais, meta) {
  return [
    metaBarraHTML('Calorias', totais.kcal, meta.kcal, 0, ' kcal'),
    metaBarraHTML('Proteínas', totais.prot, meta.prot, 1, 'g'),
    metaBarraHTML('Carboidratos', totais.carb, meta.carb, 1, 'g'),
    metaBarraHTML('Gorduras', totais.gord, meta.gord, 1, 'g'),
  ].join('');
}

function renderDieta() {
  const doDia = getDieta().filter(r => r.data === dietaData).sort((a, b) => a.horario.localeCompare(b.horario));
  const totais = calcTotaisRefeicoes(doDia);
  const meta = getMetaDieta();
  const temMeta = metaDefinida(meta);

  APP.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <h1>Dieta</h1>
        <button id="btn-nova-refeicao" class="btn btn-accent btn-small" style="margin-top:0">+ Nova refeição</button>
      </div>
      <p class="sub">Registre suas refeições e acompanhe calorias e macros com base na Tabela TACO (valores por 100g; ajuste a gramagem conforme sua embalagem/receita real).</p>

      <div class="date-nav">
        <button id="btn-dia-anterior" class="btn-icon" title="Dia anterior">‹</button>
        <input type="date" id="dieta-data-input" value="${dietaData}"/>
        <button id="btn-dia-proximo" class="btn-icon" title="Próximo dia">›</button>
        <button id="btn-dia-hoje" class="btn btn-ghost btn-small" style="margin-top:0">Hoje</button>
      </div>

      <div class="stat-strip stat-strip-4">
        <div class="stat-card"><span class="stat-label">Calorias</span><span class="stat-value">${Math.round(totais.kcal)}${temMeta && meta.kcal > 0 ? ` <span class="stat-value-meta">/ ${Math.round(meta.kcal)}</span>` : ''}</span></div>
        <div class="stat-card"><span class="stat-label">Proteínas</span><span class="stat-value small">${totais.prot.toFixed(1)}g${temMeta && meta.prot > 0 ? ` <span class="stat-value-meta">/ ${meta.prot.toFixed(1)}g</span>` : ''}</span></div>
        <div class="stat-card"><span class="stat-label">Carboidratos</span><span class="stat-value small">${totais.carb.toFixed(1)}g${temMeta && meta.carb > 0 ? ` <span class="stat-value-meta">/ ${meta.carb.toFixed(1)}g</span>` : ''}</span></div>
        <div class="stat-card"><span class="stat-label">Gorduras</span><span class="stat-value small">${totais.gord.toFixed(1)}g${temMeta && meta.gord > 0 ? ` <span class="stat-value-meta">/ ${meta.gord.toFixed(1)}g</span>` : ''}</span></div>
      </div>

      <div class="meta-dieta-block">
        <div class="section-head">
          <h2 class="subtitle" style="margin-top:0;border-top:none;padding-top:0">Meta do dia</h2>
          <button id="btn-editar-meta" class="btn btn-ghost btn-small" style="margin-top:0">${temMeta ? 'Editar meta' : '+ Definir meta'}</button>
        </div>
        ${temMeta
          ? metaProgressoHTML(totais, meta)
          : '<p class="hint">Defina quanto pretende consumir de calorias e macros por dia pra comparar com o que já comeu.</p>'}
      </div>

      <h2 class="subtitle">Refeições de ${formatDateBR(dietaData)}</h2>
      ${doDia.length
        ? `<div class="hist-list">${doDia.map(r => refeicaoCardHTML(r)).join('')}</div>`
        : '<p class="empty">Nenhuma refeição registrada nesse dia. Toque em "+ Nova refeição" pra começar.</p>'}
    </section>`;

  document.getElementById('btn-nova-refeicao').addEventListener('click', openRefeicaoNova);
  document.getElementById('btn-editar-meta').addEventListener('click', openMetaDieta);
  document.getElementById('dieta-data-input').addEventListener('change', e => {
    dietaData = e.target.value || todayISO();
    refeicaoAberta = null;
    render();
  });
  document.getElementById('btn-dia-hoje').addEventListener('click', () => {
    dietaData = todayISO();
    refeicaoAberta = null;
    render();
  });
  document.getElementById('btn-dia-anterior').addEventListener('click', () => {
    dietaData = shiftDateISO(dietaData, -1);
    refeicaoAberta = null;
    render();
  });
  document.getElementById('btn-dia-proximo').addEventListener('click', () => {
    dietaData = shiftDateISO(dietaData, 1);
    refeicaoAberta = null;
    render();
  });

  APP.querySelectorAll('[data-refeicao-toggle]').forEach(card => {
    card.addEventListener('click', () => {
      refeicaoAberta = refeicaoAberta === card.dataset.refeicaoToggle ? null : card.dataset.refeicaoToggle;
      renderDieta();
    });
  });
  APP.querySelectorAll('[data-edit-refeicao]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const r = getDieta().find(x => x.id === btn.dataset.editRefeicao);
      if (r) openRefeicaoEditar(r);
    });
  });
  APP.querySelectorAll('[data-del-refeicao]').forEach(btn => {
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      showConfirm('Excluir esta refeição?', () => {
        setDieta(getDieta().filter(x => x.id !== btn.dataset.delRefeicao));
        refeicaoAberta = null;
        renderDieta();
        toast('Refeição excluída.');
      });
    });
  });
}

function refeicaoCardHTML(r) {
  const aberto = refeicaoAberta === r.id;
  const t = calcTotaisIngredientes(r.ingredientes);
  return `
    <div class="hist-card refeicao-card ${aberto ? 'ex-aberto' : ''}" data-refeicao-toggle="${r.id}">
      <div class="hist-card-head">
        <div><strong>${escapeHtml(r.nome)}</strong><span class="hint mono"> — ${r.horario}</span></div>
        <div class="hist-card-meta">
          <button class="btn-remove" data-edit-refeicao="${r.id}" title="Editar">${ICON_EDIT}</button>
          <button class="btn-remove" data-del-refeicao="${r.id}" title="Excluir">✕</button>
        </div>
      </div>
      <div class="macro-row">${macroChipsHTML(t)}</div>
      ${aberto ? `
        <div class="draft-list">
          ${r.ingredientes.length ? r.ingredientes.map(ing => `
            <div class="draft-row">
              <div class="draft-row-head">
                <span class="ex-nome">${escapeHtml(ing.nome)}</span>
                <span class="hint mono">${ing.quantidade}g</span>
              </div>
              <p class="hint">${Math.round(ing.kcal)} kcal · P ${ing.prot.toFixed(1)}g · C ${ing.carb.toFixed(1)}g · G ${ing.gord.toFixed(1)}g</p>
            </div>`).join('') : '<p class="hint">Nenhum ingrediente adicionado.</p>'}
        </div>` : ''}
    </div>`;
}

function renderRefeicaoForm() {
  const d = draftRefeicao;
  const termo = buscaAlimentoForm.trim().toLowerCase();
  const todosAlimentos = allFoods().slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const opcoes = termo ? todosAlimentos.filter(f => f.nome.toLowerCase().includes(termo)) : todosAlimentos;
  const totais = calcTotaisIngredientes(d.ingredientes);

  REFEICAO_MOUNT.innerHTML = `
    <section>
      <h1>${d.id ? 'Editar refeição' : 'Nova refeição'}</h1>
      <p class="sub">Dê um nome, defina o horário e adicione os ingredientes com a quantidade em gramas.</p>

      <div class="field-row-inline">
        <label>Data<input type="date" id="refeicao-data" value="${d.data}"/></label>
        <label>Horário<input type="time" id="refeicao-horario" value="${d.horario}"/></label>
      </div>
      <div class="field-row">
        <label>Nome da refeição</label>
        <input type="text" id="refeicao-nome" placeholder="Ex.: Café da manhã, Almoço, Lanche..." value="${escapeHtml(d.nome)}"/>
      </div>

      <h2 class="subtitle">Ingredientes</h2>
      <div class="muscle-add-box">
        <input type="text" class="input-busca-musculo" id="busca-alimento" placeholder="Buscar alimento na Tabela TACO..." value="${escapeHtml(buscaAlimentoForm)}"/>
        <div class="add-row">
          <select id="sel-alimento" ${opcoes.length === 0 ? 'disabled' : ''}>
            ${opcoes.length
              ? opcoes.map(f => `<option value="${f.id}">${escapeHtml(f.nome)} (${f.kcal} kcal/100g)</option>`).join('')
              : '<option>Nenhum alimento encontrado com essa busca</option>'}
          </select>
          <input type="number" id="qtd-alimento" min="1" step="1" value="100" style="width:90px"/>
          <span class="hint" style="align-self:center">gramas</span>
          <button class="btn" id="btn-add-alimento" ${opcoes.length === 0 ? 'disabled' : ''}>Adicionar</button>
        </div>
        <button id="btn-novo-alimento-custom" class="btn btn-ghost btn-small">+ Cadastrar alimento personalizado</button>
      </div>

      <div class="draft-list">
        ${d.ingredientes.length ? d.ingredientes.map((ing, i) => `
          <div class="draft-row">
            <div class="draft-row-head">
              <span class="ex-nome">${escapeHtml(ing.nome)}</span>
              <button class="btn-remove" data-remove-ingrediente="${i}" title="Remover">✕</button>
            </div>
            <div class="draft-fields">
              <label>Quantidade (g)<input type="number" min="0" step="1" data-idx-ingrediente="${i}" value="${ing.quantidade}"/></label>
            </div>
            <p class="hint">${Math.round(ing.kcal)} kcal · P ${ing.prot.toFixed(1)}g · C ${ing.carb.toFixed(1)}g · G ${ing.gord.toFixed(1)}g</p>
          </div>`).join('') : '<p class="empty">Nenhum ingrediente adicionado ainda.</p>'}
      </div>

      <div class="summary-bar">
        <div><span class="summary-label">Calorias</span><div class="summary-value">${Math.round(totais.kcal)} kcal</div></div>
        <div><span class="summary-label">Proteínas</span><div class="summary-value small">${totais.prot.toFixed(1)}g</div></div>
        <div><span class="summary-label">Carboidratos</span><div class="summary-value small">${totais.carb.toFixed(1)}g</div></div>
        <div><span class="summary-label">Gorduras</span><div class="summary-value small">${totais.gord.toFixed(1)}g</div></div>
      </div>

      <div class="actions-row">
        <button id="btn-salvar-refeicao" class="btn btn-accent">Salvar refeição</button>
      </div>
    </section>`;

  document.getElementById('refeicao-data').addEventListener('input', e => { d.data = e.target.value; });
  document.getElementById('refeicao-horario').addEventListener('input', e => { d.horario = e.target.value; });
  document.getElementById('refeicao-nome').addEventListener('input', e => { d.nome = e.target.value; });

  const buscaInput = document.getElementById('busca-alimento');
  buscaInput.addEventListener('input', e => {
    buscaAlimentoForm = e.target.value;
    const pos = e.target.selectionStart;
    renderRefeicaoForm();
    const el = document.getElementById('busca-alimento');
    el.focus();
    el.setSelectionRange(pos, pos);
  });

  document.getElementById('btn-add-alimento').addEventListener('click', () => {
    const sel = document.getElementById('sel-alimento');
    const qtdInput = document.getElementById('qtd-alimento');
    if (!sel.value) return;
    const food = foodById(sel.value);
    if (!food) return;
    let qtd = Number(qtdInput.value);
    if (!qtd || qtd <= 0) qtd = 100;
    d.ingredientes.push(ingredienteFromFood(food, qtd));
    renderRefeicaoForm();
  });

  REFEICAO_MOUNT.querySelectorAll('[data-remove-ingrediente]').forEach(btn => {
    btn.addEventListener('click', () => {
      d.ingredientes.splice(Number(btn.dataset.removeIngrediente), 1);
      renderRefeicaoForm();
    });
  });
  REFEICAO_MOUNT.querySelectorAll('[data-idx-ingrediente]').forEach(input => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.idxIngrediente);
      let novaQtd = Number(input.value);
      if (Number.isNaN(novaQtd) || novaQtd < 0) novaQtd = 0;
      recalcularIngredienteQtd(d.ingredientes[i], novaQtd);
      const pos = input.selectionStart;
      renderRefeicaoForm();
      const el = REFEICAO_MOUNT.querySelector(`[data-idx-ingrediente="${i}"]`);
      if (el) { el.focus(); el.setSelectionRange(pos, pos); }
    });
  });

  document.getElementById('btn-novo-alimento-custom').addEventListener('click', openAlimentoCustom);
  document.getElementById('btn-salvar-refeicao').addEventListener('click', salvarRefeicao);
}

function salvarRefeicao() {
  const d = draftRefeicao;
  const nome = d.nome.trim();
  if (!nome) { toast('Dê um nome à refeição antes de salvar.'); return; }
  if (!d.data) { toast('Informe a data da refeição.'); return; }
  if (!d.horario) { toast('Informe o horário da refeição.'); return; }
  if (d.ingredientes.length === 0) { toast('Adicione ao menos um ingrediente.'); return; }

  const lista = getDieta();
  if (d.id) {
    const idx = lista.findIndex(r => r.id === d.id);
    if (idx >= 0) lista[idx] = { ...d, nome };
  } else {
    lista.push({ ...d, nome, id: uid() });
  }
  setDieta(lista);
  dietaData = d.data;
  draftRefeicao = null;
  closeRefeicao();
  currentTab = 'dieta';
  render();
  toast('Refeição salva!');
}

// ---------- alimento personalizado (modal, aberto de dentro da refeição) ----------
function renderAlimentoCustom() {
  const a = draftAlimentoCustom;
  ALIMENTO_CUSTOM_MOUNT.innerHTML = `
    <section>
      <h1>Novo alimento personalizado</h1>
      <p class="sub">Cadastre um alimento que não está na Tabela TACO, informando os valores nutricionais por 100g (rótulo da embalagem, por exemplo).</p>

      <div class="field-row">
        <label>Nome do alimento</label>
        <input id="alimento-nome" type="text" placeholder="Ex.: Barra de proteína XYZ" value="${escapeHtml(a.nome)}"/>
      </div>
      <div class="draft-fields">
        <label>Calorias (kcal/100g)<input type="number" min="0" step="1" id="alimento-kcal" value="${a.kcal}"/></label>
        <label>Proteínas (g/100g)<input type="number" min="0" step="0.1" id="alimento-prot" value="${a.prot}"/></label>
        <label>Carboidratos (g/100g)<input type="number" min="0" step="0.1" id="alimento-carb" value="${a.carb}"/></label>
        <label>Gorduras (g/100g)<input type="number" min="0" step="0.1" id="alimento-gord" value="${a.gord}"/></label>
      </div>
      <div class="actions-row">
        <button id="btn-salvar-alimento-custom" class="btn btn-accent">Salvar alimento</button>
      </div>

      ${getCustomFoods().length ? `
        <h2 class="subtitle">Seus alimentos personalizados</h2>
        <div class="exlist">
          ${getCustomFoods().map(f => `
            <div class="ex-card">
              <div class="ex-card-head">
                <span class="ex-nome">${escapeHtml(f.nome)}</span>
                <button class="btn-remove" data-del-alimento-custom="${f.id}" title="Excluir">✕</button>
              </div>
              <p class="hint">${f.kcal} kcal · P ${f.prot}g · C ${f.carb}g · G ${f.gord}g (por 100g)</p>
            </div>`).join('')}
        </div>` : ''}
    </section>`;

  document.getElementById('alimento-nome').addEventListener('input', e => { a.nome = e.target.value; });
  document.getElementById('alimento-kcal').addEventListener('input', e => { a.kcal = Number(e.target.value) || 0; });
  document.getElementById('alimento-prot').addEventListener('input', e => { a.prot = Number(e.target.value) || 0; });
  document.getElementById('alimento-carb').addEventListener('input', e => { a.carb = Number(e.target.value) || 0; });
  document.getElementById('alimento-gord').addEventListener('input', e => { a.gord = Number(e.target.value) || 0; });
  document.getElementById('btn-salvar-alimento-custom').addEventListener('click', salvarAlimentoCustom);
  ALIMENTO_CUSTOM_MOUNT.querySelectorAll('[data-del-alimento-custom]').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Excluir este alimento personalizado?', () => {
        setCustomFoods(getCustomFoods().filter(f => f.id !== btn.dataset.delAlimentoCustom));
        renderAlimentoCustom();
        toast('Alimento personalizado excluído.');
      });
    });
  });
}

function salvarAlimentoCustom() {
  const a = draftAlimentoCustom;
  const nome = a.nome.trim();
  if (!nome) { toast('Dê um nome ao alimento antes de salvar.'); return; }
  const foods = getCustomFoods();
  foods.push({ id: uid(), nome, kcal: a.kcal, prot: a.prot, carb: a.carb, gord: a.gord, personalizado: true });
  setCustomFoods(foods);
  closeAlimentoCustom();
  if (draftRefeicao) renderRefeicaoForm(); // atualiza a lista de alimentos disponíveis no formulário aberto
  toast('Alimento personalizado salvo!');
}

// ---------- meta de dieta (modal) ----------
function renderMetaDietaForm() {
  const m = draftMetaDieta;
  META_DIETA_MOUNT.innerHTML = `
    <section>
      <h1>Meta diária</h1>
      <p class="sub">Defina quanto você pretende consumir de calorias e macros por dia. Deixe um campo em 0 pra não acompanhar aquele valor.</p>

      <div class="draft-fields">
        <label>Calorias (kcal/dia)<input type="number" min="0" step="1" id="meta-kcal" value="${m.kcal}"/></label>
        <label>Proteínas (g/dia)<input type="number" min="0" step="1" id="meta-prot" value="${m.prot}"/></label>
        <label>Carboidratos (g/dia)<input type="number" min="0" step="1" id="meta-carb" value="${m.carb}"/></label>
        <label>Gorduras (g/dia)<input type="number" min="0" step="1" id="meta-gord" value="${m.gord}"/></label>
      </div>

      <div class="actions-row">
        <button id="btn-salvar-meta" class="btn btn-accent">Salvar meta</button>
        ${metaDefinida(m) ? '<button id="btn-limpar-meta" class="btn btn-ghost">Remover meta</button>' : ''}
      </div>
    </section>`;

  document.getElementById('meta-kcal').addEventListener('input', e => { m.kcal = Number(e.target.value) || 0; });
  document.getElementById('meta-prot').addEventListener('input', e => { m.prot = Number(e.target.value) || 0; });
  document.getElementById('meta-carb').addEventListener('input', e => { m.carb = Number(e.target.value) || 0; });
  document.getElementById('meta-gord').addEventListener('input', e => { m.gord = Number(e.target.value) || 0; });
  document.getElementById('btn-salvar-meta').addEventListener('click', salvarMetaDieta);
  const btnLimpar = document.getElementById('btn-limpar-meta');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      showConfirm('Remover a meta diária de calorias e macros?', () => {
        setMetaDieta({ kcal: 0, prot: 0, carb: 0, gord: 0 });
        closeMetaDieta();
        if (currentTab === 'dieta') renderDieta();
        toast('Meta removida.');
      });
    });
  }
}
function salvarMetaDieta() {
  setMetaDieta({ ...draftMetaDieta });
  closeMetaDieta();
  if (currentTab === 'dieta') renderDieta();
  toast('Meta salva!');
}

// ================= ÁGUA =================
function totalAguaDia(data) {
  return getAgua().filter(r => r.data === data).reduce((soma, r) => soma + r.ml, 0);
}

function adicionarAgua(ml) {
  ml = Math.round(Number(ml));
  if (!ml || ml <= 0) { toast('Informe uma quantidade de água válida.'); return; }
  const arr = getAgua();
  arr.push({ id: uid(), data: aguaData, horario: horaAtualHHMM(), ml });
  setAgua(arr);
  renderAgua();
  toast(`+${ml} ml registrado!`);
}

function renderAgua() {
  const config = getAguaConfig();
  const doDia = getAgua().filter(r => r.data === aguaData).sort((a, b) => a.horario.localeCompare(b.horario));
  const total = doDia.reduce((soma, r) => soma + r.ml, 0);
  const temMeta = config.metaMl > 0;
  const pct = temMeta ? Math.max(0, Math.min(100, Math.round((total / config.metaMl) * 100))) : 0;
  const estourou = temMeta && total > config.metaMl;

  APP.innerHTML = `
    <section class="panel">
      <div class="section-head">
        <h1>Água</h1>
        <button id="btn-agua-config" class="btn btn-ghost btn-small" style="margin-top:0">Meta e lembretes</button>
      </div>
      <p class="sub">Registre sua ingestão de água ao longo do dia e acompanhe sua meta diária.</p>

      <div class="date-nav">
        <button id="btn-agua-dia-anterior" class="btn-icon" title="Dia anterior">‹</button>
        <input type="date" id="agua-data-input" value="${aguaData}"/>
        <button id="btn-agua-dia-proximo" class="btn-icon" title="Próximo dia">›</button>
        <button id="btn-agua-dia-hoje" class="btn btn-ghost btn-small" style="margin-top:0">Hoje</button>
      </div>

      <div class="agua-progress-block">
        <div class="agua-progress-head">
          <span class="agua-total">${total} <span class="hint">ml</span></span>
          ${temMeta
            ? `<span class="meta-row-value ${estourou ? 'over' : ''}">${pct}% da meta de ${config.metaMl} ml</span>`
            : '<span class="hint">Nenhuma meta definida — toque em "Meta e lembretes".</span>'}
        </div>
        ${temMeta ? `
          <div class="meta-bar-track">
            <div class="meta-bar-fill ${estourou ? 'over' : ''}" style="width:${pct}%"></div>
          </div>` : ''}
      </div>

      <h2 class="subtitle">Adicionar</h2>
      <p class="hint">Medidas rápidas (ml):</p>
      <div class="agua-presets">
        ${AGUA_PRESETS.map(ml => `<button class="btn btn-ghost agua-preset-btn" data-agua-preset="${ml}">+${ml} ml</button>`).join('')}
      </div>
      <div class="actions-row">
        <input type="number" min="1" step="1" id="agua-custom-ml" placeholder="Quantidade em ml"/>
        <button id="btn-agua-add-custom" class="btn btn-accent">Adicionar</button>
      </div>

      <h2 class="subtitle">Registros de ${formatDateBR(aguaData)}</h2>
      ${doDia.length ? `
        <div class="hist-list">
          ${doDia.map(r => `
            <div class="hist-card agua-card">
              <div class="hist-card-head">
                <div><strong>${r.ml} ml</strong><span class="hint mono"> — ${r.horario}</span></div>
                <button class="btn-remove" data-del-agua="${r.id}" title="Excluir">✕</button>
              </div>
            </div>`).join('')}
        </div>` : '<p class="empty">Nenhum registro nesse dia ainda. Use os botões acima pra começar.</p>'}
    </section>`;

  document.getElementById('btn-agua-config').addEventListener('click', openAguaConfig);
  document.getElementById('agua-data-input').addEventListener('change', e => {
    aguaData = e.target.value || todayISO();
    render();
  });
  document.getElementById('btn-agua-dia-hoje').addEventListener('click', () => { aguaData = todayISO(); render(); });
  document.getElementById('btn-agua-dia-anterior').addEventListener('click', () => { aguaData = shiftDateISO(aguaData, -1); render(); });
  document.getElementById('btn-agua-dia-proximo').addEventListener('click', () => { aguaData = shiftDateISO(aguaData, 1); render(); });

  APP.querySelectorAll('[data-agua-preset]').forEach(btn => {
    btn.addEventListener('click', () => adicionarAgua(Number(btn.dataset.aguaPreset)));
  });
  const inputCustom = document.getElementById('agua-custom-ml');
  document.getElementById('btn-agua-add-custom').addEventListener('click', () => {
    adicionarAgua(Number(inputCustom.value));
    inputCustom.value = '';
  });
  inputCustom.addEventListener('keydown', e => {
    if (e.key === 'Enter') { adicionarAgua(Number(inputCustom.value)); inputCustom.value = ''; }
  });

  APP.querySelectorAll('[data-del-agua]').forEach(btn => {
    btn.addEventListener('click', () => {
      showConfirm('Excluir este registro de água?', () => {
        setAgua(getAgua().filter(r => r.id !== btn.dataset.delAgua));
        renderAgua();
        toast('Registro excluído.');
      });
    });
  });
}

// ---------- config de meta e lembretes (modal) ----------
function renderAguaConfigForm() {
  const c = draftAguaConfig;
  const suportaNotificacao = 'Notification' in window;
  const permissao = suportaNotificacao ? Notification.permission : 'unsupported';

  AGUA_CONFIG_MOUNT.innerHTML = `
    <section>
      <h1>Meta e lembretes de água</h1>
      <p class="sub">Defina quanto pretende beber por dia e, se quiser, ative lembretes periódicos enquanto o app estiver aberto.</p>

      <div class="draft-fields">
        <label>Meta diária (ml)<input type="number" min="0" step="50" id="agua-cfg-meta" value="${c.metaMl}"/></label>
        <label>Acordar<input type="time" id="agua-cfg-acordar" value="${c.acordar}"/></label>
        <label>Dormir<input type="time" id="agua-cfg-dormir" value="${c.dormir}"/></label>
        <label>Lembrar a cada (min)<input type="number" min="5" step="5" id="agua-cfg-intervalo" value="${c.intervaloMin}"/></label>
      </div>
      <p class="hint">Os lembretes só disparam entre o horário de acordar e o de dormir — nada de notificação de madrugada.</p>

      <h2 class="subtitle">Notificações</h2>
      <label class="chk-inline">
        <input type="checkbox" id="agua-cfg-notif" ${c.notificacoesAtivas ? 'checked' : ''} ${!suportaNotificacao || permissao === 'denied' ? 'disabled' : ''}/>
        <span>Ativar lembretes por notificação</span>
      </label>
      ${!suportaNotificacao ? '<p class="missing">Este navegador não suporta notificações.</p>' : ''}
      ${suportaNotificacao && permissao === 'denied' ? '<p class="missing">As notificações estão bloqueadas nas permissões do navegador/site. Libere o acesso e tente de novo.</p>' : ''}
      <p class="hint">Funciona só enquanto o app estiver aberto (uma aba ou instalado na tela inicial) — sem servidor, não é possível notificar com o app totalmente fechado.</p>

      <div class="actions-row">
        <button id="btn-salvar-agua-cfg" class="btn btn-accent">Salvar</button>
      </div>
    </section>`;

  document.getElementById('agua-cfg-meta').addEventListener('input', e => { c.metaMl = Math.max(0, Number(e.target.value) || 0); });
  document.getElementById('agua-cfg-acordar').addEventListener('input', e => { c.acordar = e.target.value || c.acordar; });
  document.getElementById('agua-cfg-dormir').addEventListener('input', e => { c.dormir = e.target.value || c.dormir; });
  document.getElementById('agua-cfg-intervalo').addEventListener('input', e => { c.intervaloMin = Math.max(5, Number(e.target.value) || 60); });

  const chkNotif = document.getElementById('agua-cfg-notif');
  chkNotif.addEventListener('change', () => {
    if (!chkNotif.checked) { c.notificacoesAtivas = false; return; }
    if (!suportaNotificacao) { toast('Este navegador não suporta notificações.'); chkNotif.checked = false; return; }
    if (Notification.permission === 'granted') { c.notificacoesAtivas = true; return; }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') { c.notificacoesAtivas = true; toast('Notificações ativadas!'); }
      else { c.notificacoesAtivas = false; chkNotif.checked = false; toast('Permissão de notificação negada.'); }
    });
  });

  document.getElementById('btn-salvar-agua-cfg').addEventListener('click', salvarAguaConfig);
}

function salvarAguaConfig() {
  const atual = getAguaConfig();
  setAguaConfig({ ...draftAguaConfig, ultimaNotificacaoTs: atual.ultimaNotificacaoTs || 0 });
  closeAguaConfig();
  if (currentTab === 'agua') renderAgua();
  toast('Configurações de água salvas!');
}

// ---------- lembretes periódicos ----------
// true se "agora" está entre acordar e dormir (trata o caso em que dormir
// é "no dia seguinte", ex.: acorda 07:00 / dorme 23:00, ou o inverso pra
// quem trabalha à noite, ex.: acorda 22:00 / dorme 06:00).
function estaNoHorarioAcordado(agora, acordar, dormir) {
  const [ah, am] = acordar.split(':').map(Number);
  const [dh, dm] = dormir.split(':').map(Number);
  const minsAgora = agora.getHours() * 60 + agora.getMinutes();
  const minsAcordar = ah * 60 + am;
  const minsDormir = dh * 60 + dm;
  if (minsAcordar === minsDormir) return true; // horários iguais = sem janela de silêncio
  if (minsAcordar < minsDormir) return minsAgora >= minsAcordar && minsAgora < minsDormir;
  return minsAgora >= minsAcordar || minsAgora < minsDormir;
}

function dispararNotificacaoAgua(config) {
  const total = totalAguaDia(todayISO());
  const titulo = '💧 Hora de beber água';
  const corpo = config.metaMl > 0
    ? `${total} ml de ${config.metaMl} ml bebidos hoje. Bora beber mais um pouco?`
    : `${total} ml bebidos hoje. Bora beber mais um pouco?`;
  const opts = { body: corpo, tag: 'maromba-agua', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
  if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg && reg.showNotification) reg.showNotification(titulo, opts);
      else new Notification(titulo, opts);
    }).catch(() => { try { new Notification(titulo, opts); } catch (e) { /* silencioso */ } });
  } else {
    try { new Notification(titulo, opts); } catch (e) { /* silencioso */ }
  }
}

function checkAguaNotificacao() {
  const config = getAguaConfig();
  if (!config.notificacoesAtivas) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const agora = new Date();
  if (!estaNoHorarioAcordado(agora, config.acordar, config.dormir)) return;
  const intervaloMs = Math.max(5, config.intervaloMin) * 60 * 1000;
  const ultima = config.ultimaNotificacaoTs || 0;
  if (agora.getTime() - ultima < intervaloMs) return;
  dispararNotificacaoAgua(config);
  config.ultimaNotificacaoTs = agora.getTime();
  setAguaConfig(config);
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Menu "Mais" do rodapé mobile (Histórico / Equipamentos / Exercícios)
  const btnNavMore = document.getElementById('btn-nav-more');
  const navMoreMenu = document.getElementById('nav-more-menu');
  if (btnNavMore && navMoreMenu) {
    btnNavMore.addEventListener('click', e => {
      e.stopPropagation();
      navMoreMenu.hidden = !navMoreMenu.hidden;
    });
    navMoreMenu.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => { navMoreMenu.hidden = true; });
    });
    document.addEventListener('click', e => {
      if (!navMoreMenu.hidden && !document.getElementById('nav-more').contains(e.target)) {
        navMoreMenu.hidden = true;
      }
    });
  }

  document.getElementById('fab-add').addEventListener('click', openMontarNovo);
  document.getElementById('btn-close-montar').addEventListener('click', closeMontar);
  document.getElementById('btn-config').addEventListener('click', openConfig);
  document.getElementById('btn-close-config').addEventListener('click', closeConfig);
  document.getElementById('btn-close-exercicio-custom').addEventListener('click', closeExercicioCustom);
  document.getElementById('btn-close-refeicao').addEventListener('click', closeRefeicao);
  document.getElementById('btn-close-alimento-custom').addEventListener('click', closeAlimentoCustom);
  document.getElementById('btn-close-meta-dieta').addEventListener('click', closeMetaDieta);
  document.getElementById('btn-close-agua-config').addEventListener('click', closeAguaConfig);

  MODAL_MONTAR.addEventListener('click', e => { if (e.target === MODAL_MONTAR) closeMontar(); });
  MODAL_CONFIG.addEventListener('click', e => { if (e.target === MODAL_CONFIG) closeConfig(); });
  MODAL_EXERCICIO_CUSTOM.addEventListener('click', e => { if (e.target === MODAL_EXERCICIO_CUSTOM) closeExercicioCustom(); });
  MODAL_REFEICAO.addEventListener('click', e => { if (e.target === MODAL_REFEICAO) closeRefeicao(); });
  MODAL_ALIMENTO_CUSTOM.addEventListener('click', e => { if (e.target === MODAL_ALIMENTO_CUSTOM) closeAlimentoCustom(); });
  MODAL_META_DIETA.addEventListener('click', e => { if (e.target === MODAL_META_DIETA) closeMetaDieta(); });
  MODAL_AGUA_CONFIG.addEventListener('click', e => { if (e.target === MODAL_AGUA_CONFIG) closeAguaConfig(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modalConfirm = document.getElementById('modal-confirm');
    if (!modalConfirm.hidden) { document.getElementById('btn-confirm-cancel').click(); return; }
    if (!MODAL_ALIMENTO_CUSTOM.hidden) { closeAlimentoCustom(); return; }
    if (!MODAL_AGUA_CONFIG.hidden) { closeAguaConfig(); return; }
    if (!MODAL_META_DIETA.hidden) { closeMetaDieta(); return; }
    if (!MODAL_REFEICAO.hidden) { closeRefeicao(); return; }
    if (!MODAL_MONTAR.hidden) closeMontar();
    if (!MODAL_CONFIG.hidden) closeConfig();
    if (!MODAL_EXERCICIO_CUSTOM.hidden) closeExercicioCustom();
  });

  document.getElementById('input-importar-json').addEventListener('change', e => {
    const file = e.target.files[0];
    e.target.value = ''; // permite importar o mesmo arquivo de novo depois
    if (file) importarDados(file);
  });

  syncCustomExercises();
  syncCustomFoods();
  if (getSessaoAtiva()) currentTab = 'sessao';
  render();

  // ---------- PWA: service worker (funciona offline) ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Service worker não registrado', e));
    });
  }

  // ---------- lembretes de água ----------
  // Roda em qualquer aba (não só na aba "Água"), enquanto o app estiver
  // aberto — sem servidor/push, não dá pra notificar com o app fechado.
  checkAguaNotificacao();
  setInterval(checkAguaNotificacao, 60 * 1000);
});