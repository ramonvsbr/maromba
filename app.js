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

// ---------- helpers ----------
function uid() { return 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDateBR(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }

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

// ---------- estado de navegação ----------
const APP = document.getElementById('app');
const MONTAR_MOUNT = document.getElementById('montar-mount');
const CONFIG_MOUNT = document.getElementById('config-mount');
const MODAL_MONTAR = document.getElementById('modal-montar');
const MODAL_CONFIG = document.getElementById('modal-config');

let currentTab = 'meus-treinos';          // 'meus-treinos' | 'sessao' | 'historico'
let configTab = 'equipamentos';           // 'equipamentos' | 'exercicios' (dentro do modal de ajustes)
let draftTreino = null;                   // treino sendo montado/editado
let musculosAlvoMontagem = new Set();     // grupos musculares marcados na tela "montar treino"
let filtroMusculo = 'todos';
let somenteDisponiveis = true;
let exercicioAberto = null;
let sessaoHistAberta = null;
let exercicioGraficoSelecionado = null;
const sessaoTimers = { elapsedInt: null, restInt: null };

function switchTab(id) { currentTab = id; render(); }
function clearSessaoTimers() {
  if (sessaoTimers.elapsedInt) clearInterval(sessaoTimers.elapsedInt);
  if (sessaoTimers.restInt) clearInterval(sessaoTimers.restInt);
  sessaoTimers.elapsedInt = null; sessaoTimers.restInt = null;
}

function render() {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
  const ativaBtn = document.querySelector('.nav-btn[data-tab="sessao"]');
  if (ativaBtn) ativaBtn.classList.toggle('has-live', !!getSessaoAtiva());

  if (currentTab !== 'sessao') clearSessaoTimers();

  switch (currentTab) {
    case 'meus-treinos': renderMeusTreinos(); break;
    case 'sessao': renderSessao(); break;
    case 'historico': renderHistorico(); break;
    default: renderMeusTreinos();
  }
}

// ================= MODAIS =================
function openMontarNovo() {
  draftTreino = { id: null, nome: '', exercicios: [] };
  musculosAlvoMontagem = new Set();
  openMontar();
}
function openMontarEditar(treino) {
  draftTreino = JSON.parse(JSON.stringify(treino));
  musculosAlvoMontagem = new Set(unionMuscles(draftTreino.exercicios, { onlyPrimary: true }));
  openMontar();
}
function openMontar() {
  MODAL_MONTAR.hidden = false;
  renderMontarTreino();
}
function closeMontar() {
  MODAL_MONTAR.hidden = true;
}
function openConfig(tab) {
  if (tab) configTab = tab;
  MODAL_CONFIG.hidden = false;
  updateConfigTabButtons();
  renderConfigContent();
}
function closeConfig() {
  MODAL_CONFIG.hidden = true;
}
function updateConfigTabButtons() {
  document.querySelectorAll('.config-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.configTab === configTab));
}
function renderConfigContent() {
  if (configTab === 'exercicios') renderExercicios(); else renderEquipamentos();
}

// ================= EQUIPAMENTOS (dentro de Ajustes) =================
function renderEquipamentos() {
  const selected = new Set(getEquip());
  CONFIG_MOUNT.innerHTML = `
    <section>
      <h2>Equipamentos da academia</h2>
      <p class="sub">Marque o que você tem disponível. Isso define quais exercícios aparecem pra montar treino.</p>
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

  CONFIG_MOUNT.querySelectorAll('[data-equip]').forEach(input => {
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

// ================= EXERCÍCIOS (dentro de Ajustes) =================
function renderExercicios() {
  const equipSet = new Set(getEquip());
  let lista = EXERCISES.filter(ex =>
    filtroMusculo === 'todos' || ex.musculos.primarios.includes(filtroMusculo) || ex.musculos.secundarios.includes(filtroMusculo)
  );
  if (somenteDisponiveis) lista = lista.filter(ex => exerciseAvailable(ex, equipSet));
  lista = lista.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  CONFIG_MOUNT.innerHTML = `
    <section>
      <h2>Biblioteca de exercícios</h2>
      <p class="sub">Veja o que dá pra fazer com o que sua academia tem. Pra montar um treino de verdade, use o botão + em "Meus treinos".</p>
      <div class="filters-row">
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

  document.getElementById('f-musculo').addEventListener('change', e => { filtroMusculo = e.target.value; renderExercicios(); });
  document.getElementById('f-disp').addEventListener('change', e => { somenteDisponiveis = e.target.checked; renderExercicios(); });
  CONFIG_MOUNT.querySelectorAll('.ex-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      exercicioAberto = exercicioAberto === id ? null : id;
      renderExercicios();
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
        ${disponivel ? '' : '<span class="badge-off">falta equipamento</span>'}
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

// ================= MONTAR TREINO (modal, aberto pelo botão +) =================
function ensureDraft() {
  if (!draftTreino) draftTreino = { id: null, nome: '', exercicios: [] };
}

function renderMontarTreino() {
  ensureDraft();
  const equipSet = new Set(getEquip());
  const disponiveis = EXERCISES.filter(ex => exerciseAvailable(ex, equipSet)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
          const opcoes = disponiveis.filter(ex => ex.musculos.primarios.includes(m.id) && !jaAdicionados.has(ex.id));
          return `
          <div class="muscle-add-box">
            <div class="muscle-add-box-head">
              <h3>${m.nome}</h3>
              <button class="btn-remove" data-remove-musculo-alvo="${m.id}" title="Remover grupo muscular">✕</button>
            </div>
            <div class="add-row">
              <select data-add-musculo="${m.id}" ${opcoes.length === 0 ? 'disabled' : ''}>
                ${opcoes.length
                  ? opcoes.map(ex => `<option value="${ex.id}">${ex.nome}</option>`).join('')
                  : `<option>Nenhum exercício de ${m.nome.toLowerCase()} disponível com seu equipamento</option>`}
              </select>
              <button class="btn" data-add-btn-musculo="${m.id}" ${opcoes.length === 0 ? 'disabled' : ''}>Adicionar</button>
            </div>
          </div>`;
        }).join('') : '<p class="empty">Adicione um grupo muscular acima para ver os exercícios disponíveis.</p>'}
      </div>

      <div class="draft-list">
        ${draftTreino.exercicios.length
          ? draftTreino.exercicios.map((cfg, i) => draftRowHTML(cfg, i)).join('')
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
      renderMontarTreino();
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

function draftRowHTML(cfg, i) {
  const ex = exerciseById(cfg.exercicioId);
  return `
    <div class="draft-row">
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
    if (!confirm('Excluir este treino?')) return;
    setTreinos(getTreinos().filter(x => x.id !== b.dataset.del));
    render();
    toast('Treino excluído.');
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
  const ativa = getSessaoAtiva();
  if (ativa) {
    if (!confirm('Já existe um treino em andamento. Descartar e iniciar um novo?')) return;
  }
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
}

function renderSessao() {
  clearSessaoTimers();
  const sessao = getSessaoAtiva();
  if (!sessao) {
    APP.innerHTML = `<section class="panel"><h1>Treino ativo</h1><p class="empty">Nenhum treino em andamento. Vá em "Meus treinos" e clique em Iniciar.</p></section>`;
    return;
  }
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
    if (!confirm('Pular este exercício sem completar todas as séries?')) return;
    sessao.exercicioAtualIdx += 1;
    sessao.pausaAte = null;
    setSessaoAtiva(sessao);
    render();
  });

  document.getElementById('btn-abandonar').addEventListener('click', () => {
    if (!confirm('Abandonar a sessão atual? O progresso não será salvo no histórico.')) return;
    clearSessaoTimers();
    setSessaoAtiva(null);
    render();
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
    if (!confirm('Descartar esta sessão sem salvar no histórico?')) return;
    setSessaoAtiva(null);
    currentTab = 'meus-treinos';
    render();
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
      <div class="chart-box">
        <canvas id="chart-canvas" width="640" height="220"></canvas>
        <p id="chart-empty" class="empty" hidden>Registre séries em pelo menos 2 sessões para ver a evolução deste exercício.</p>
      </div>

      <h2 class="subtitle">Sessões registradas</h2>
      ${hist.length ? '' : '<p class="empty">Nenhum treino salvo ainda. Finalize um treino em "Treino ativo".</p>'}
      <div class="hist-list">${hist.map(s => histCardHTML(s)).join('')}</div>
    </section>`;

  const sel = document.getElementById('sel-grafico');
  if (sel) sel.addEventListener('change', e => { exercicioGraficoSelecionado = e.target.value; render(); });
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
      if (!confirm('Excluir este registro do histórico?')) return;
      setHistorico(getHistorico().filter(s => s.id !== btn.dataset.delHist));
      render();
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
  const pontos = [];
  hist.forEach(s => {
    const cfg = s.exercicios.find(e => e.exercicioId === exId);
    if (cfg && cfg.sets.length) pontos.push({ data: s.data, peso: Math.max(...cfg.sets.map(x => x.peso)) });
  });

  const emptyMsg = document.getElementById('chart-empty');
  if (pontos.length < 2) { if (emptyMsg) emptyMsg.hidden = false; return; }
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
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('fab-add').addEventListener('click', openMontarNovo);
  document.getElementById('btn-close-montar').addEventListener('click', closeMontar);
  document.getElementById('btn-config').addEventListener('click', () => openConfig('equipamentos'));
  document.getElementById('btn-close-config').addEventListener('click', closeConfig);

  document.querySelectorAll('.config-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      configTab = btn.dataset.configTab;
      updateConfigTabButtons();
      renderConfigContent();
    });
  });

  MODAL_MONTAR.addEventListener('click', e => { if (e.target === MODAL_MONTAR) closeMontar(); });
  MODAL_CONFIG.addEventListener('click', e => { if (e.target === MODAL_CONFIG) closeConfig(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!MODAL_MONTAR.hidden) closeMontar();
    if (!MODAL_CONFIG.hidden) closeConfig();
  });

  if (getSessaoAtiva()) currentTab = 'sessao';
  render();
});