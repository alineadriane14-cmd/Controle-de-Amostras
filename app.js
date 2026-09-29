import { NOMES_CLASSES, identificarClasse, corDaClasse, normalizar } from './classes.js';
import { firebaseConfig } from './firebase-config.js';
import { lerFoto } from './foto.js';

// ------------------------------------------------------------------
//  Utilidades
// ------------------------------------------------------------------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pref = {
  get(k, padrao) { try { return localStorage.getItem('ubs_' + k) ?? padrao; } catch { return padrao; } },
  set(k, v) { try { localStorage.setItem('ubs_' + k, v); } catch {} }
};
const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function toast(msg, tipo = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast ' + tipo; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function diasPara(validade) {
  if (!validade) return Infinity;
  const [a, m, d] = validade.split('-').map(Number);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(a, m - 1, d) - hoje) / 86400000);
}
const limite = () => +pref.get('limite', 60);
function status(med) {
  const d = diasPara(med.validade);
  if (d < 0) return 'vencido';
  if (d <= 30) return 'critico';
  if (d <= limite()) return 'atencao';
  return 'ok';
}
const ROTULO_STATUS = { vencido: 'Vencido', critico: 'Vence em até 30 dias', atencao: 'Vence em breve', ok: 'Validade ok' };
const dataBR = iso => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—';
const dataHoraBR = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
function textoPrazo(d) {
  if (d < 0) return `Venceu há ${-d} dia${d === -1 ? '' : 's'}`;
  if (d === 0) return 'Vence hoje!';
  return `Vence em ${d} dia${d === 1 ? '' : 's'}`;
}
const nomeCompleto = m => m.nome + (m.dose ? ` ${m.dose}` : '');

// ------------------------------------------------------------------
//  Armazenamento: Firebase (compartilhado) ou navegador (demonstração)
// ------------------------------------------------------------------
function armazenamentoLocal() {
  const K = { meds: 'ubs_meds', ret: 'ubs_retiradas' };
  const ler = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const ouvintes = { meds: [], ret: [] };
  const avisar = () => { ouvintes.meds.forEach(f => f(ler(K.meds))); ouvintes.ret.forEach(f => f(ler(K.ret))); };
  return {
    modo: 'local',
    onMeds(cb) { ouvintes.meds.push(cb); cb(ler(K.meds)); },
    onRetiradas(cb) { ouvintes.ret.push(cb); cb(ler(K.ret)); },
    async addMed(m) { gravar(K.meds, [...ler(K.meds), { ...m, id: novoId() }]); avisar(); },
    async updateMed(id, campos) { gravar(K.meds, ler(K.meds).map(m => m.id === id ? { ...m, ...campos } : m)); avisar(); },
    async deleteMed(id) { gravar(K.meds, ler(K.meds).filter(m => m.id !== id)); avisar(); },
    async retirar(r) {
      const lista = ler(K.meds); const m = lista.find(x => x.id === r.medId);
      if (!m) throw new Error('Medicamento não encontrado.');
      if (r.quantidade > m.quantidade) throw new Error(`Só há ${m.quantidade} ${m.unidade} em estoque.`);
      m.quantidade -= r.quantidade; gravar(K.meds, lista);
      gravar(K.ret, [...ler(K.ret), { ...r, ...fotoDoMed(m), id: novoId() }]); avisar();
    }
  };
}

const fotoDoMed = m => ({ nome: nomeCompleto(m), classe: m.classe, local: m.local, validade: m.validade, lote: m.lote || '', unidade: m.unidade });

async function armazenamentoFirebase(cfg) {
  const V = '10.12.2', base = `https://www.gstatic.com/firebasejs/${V}`;
  const [{ initializeApp }, fs, { getAuth, signInAnonymously }] = await Promise.all([
    import(`${base}/firebase-app.js`), import(`${base}/firebase-firestore.js`), import(`${base}/firebase-auth.js`)
  ]);
  const app = initializeApp(cfg);
  await signInAnonymously(getAuth(app));
  const db = fs.getFirestore(app);
  const cMeds = fs.collection(db, 'medicamentos'), cRet = fs.collection(db, 'retiradas');
  const lista = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
  const erro = e => { console.error(e); toast('Erro de conexão com o banco: ' + e.message, 'erro'); };
  return {
    modo: 'firebase',
    onMeds(cb) { fs.onSnapshot(cMeds, s => cb(lista(s)), erro); },
    onRetiradas(cb) { fs.onSnapshot(cRet, s => cb(lista(s)), erro); },
    addMed: m => fs.addDoc(cMeds, m),
    updateMed: (id, campos) => fs.updateDoc(fs.doc(db, 'medicamentos', id), campos),
    deleteMed: id => fs.deleteDoc(fs.doc(db, 'medicamentos', id)),
    retirar: r => fs.runTransaction(db, async t => {
      const ref = fs.doc(db, 'medicamentos', r.medId);
      const s = await t.get(ref);
      if (!s.exists()) throw new Error('Medicamento não encontrado.');
      const m = s.data();
      if (r.quantidade > m.quantidade) throw new Error(`Só há ${m.quantidade} ${m.unidade} em estoque.`);
      t.update(ref, { quantidade: m.quantidade - r.quantidade });
      t.set(fs.doc(cRet), { ...r, ...fotoDoMed(m) });
    })
  };
}

// ------------------------------------------------------------------
//  Estado e renderização
// ------------------------------------------------------------------
let db, meds = [], retiradas = [];

function tagClasse(c) { return `<span class="tag" style="background:${corDaClasse(c)}">${esc(c)}</span>`; }
function tagSala(l) { return `<span class="tag ${l === 'Sala 1' ? 's1' : 's2'}">${esc(l)}</span>`; }

function renderResumo() {
  const ativos = meds.filter(m => m.quantidade > 0);
  const n = st => ativos.filter(m => status(m) === st).length;
  const cards = [
    ['Itens em estoque', ativos.length, 'linear-gradient(135deg,#3b82f6,#6366f1)'],
    ['Na Sala 1', ativos.filter(m => m.local === 'Sala 1').length, 'linear-gradient(135deg,#06b6d4,#0891b2)'],
    ['Na Sala 2', ativos.filter(m => m.local === 'Sala 2').length, 'linear-gradient(135deg,#ec4899,#db2777)'],
    ['Vencem em breve', n('critico') + n('atencao'), 'linear-gradient(135deg,#f59e0b,#f97316)'],
    ['Vencidos', n('vencido'), 'linear-gradient(135deg,#ef4444,#be123c)'],
  ];
  $('#resumo').innerHTML = cards.map(([t, v, g]) => `<div class="num" style="background:${g}"><b>${v}</b><span>${t}</span></div>`).join('');
}

function renderAlertas() {
  $('#dica-limite').textContent = `Mostrando vencidos e o que vence nos próximos ${limite()} dias`;
  const lista = meds.filter(m => m.quantidade > 0 && status(m) !== 'ok')
    .sort((a, b) => a.validade.localeCompare(b.validade));
  $('#alertas').innerHTML = lista.length ? lista.map(m => `
    <div class="alerta ${status(m)}">
      <strong>${esc(nomeCompleto(m))}</strong>
      <small>${esc(m.quantidade)} ${esc(m.unidade)} · ${esc(m.local)}${m.lote ? ' · Lote ' + esc(m.lote) : ''}</small>
      <div class="prazo">${textoPrazo(diasPara(m.validade))} · ${dataBR(m.validade)}</div>
    </div>`).join('')
    : '<div class="vazio">Nenhum medicamento perto de vencer. Tudo em dia!</div>';
}

function renderEstoque() {
  const busca = normalizar($('#busca').value), sala = $('#filtro-sala').value,
        classe = $('#filtro-classe').value, st = $('#filtro-status').value,
        ocultar = $('#ocultar-zerados').checked;
  const lista = meds.filter(m =>
    (!busca || normalizar(`${m.nome} ${m.dose} ${m.classe} ${m.lote}`).includes(busca)) &&
    (!sala || m.local === sala) && (!classe || m.classe === classe) &&
    (!st || status(m) === st) && (!ocultar || m.quantidade > 0)
  ).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.validade.localeCompare(b.validade));

  $('#lista-estoque').innerHTML = lista.length ? lista.map(m => {
    const s = status(m);
    return `<div class="item ${s} ${m.quantidade <= 0 ? 'zerado' : ''}">
      <div>
        <div class="item-nome">${esc(m.nome)} <small>${esc(m.dose || '')}</small></div>
        <div class="etiquetas">
          ${tagClasse(m.classe)} ${tagSala(m.local)}
          <span class="tag ${s}">${ROTULO_STATUS[s]} · ${dataBR(m.validade)}</span>
          ${m.lote ? `<span class="tag leve">Lote ${esc(m.lote)}</span>` : ''}
          ${m.quantidade <= 0 ? '<span class="tag leve">Esgotado</span>' : ''}
        </div>
      </div>
      <div class="item-lado">
        <div class="qtd">${esc(m.quantidade)}<small>${esc(m.unidade)}</small></div>
        <div class="acoes">
          ${m.quantidade > 0 && s !== 'vencido' ? `<button class="btn btn-laranja btn-mini" data-retirar="${m.id}">Retirar</button>` : ''}
          <button class="btn btn-leve btn-mini" data-editar="${m.id}">Editar</button>
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="vazio">Nenhum medicamento encontrado.</div>';
}

function renderFiltroClasses() {
  const usadas = [...new Set(meds.map(m => m.classe))].sort();
  const sel = $('#filtro-classe'), atual = sel.value;
  sel.innerHTML = '<option value="">Todas as classes</option>' + usadas.map(c => `<option>${esc(c)}</option>`).join('');
  sel.value = usadas.includes(atual) ? atual : '';
}

function renderSelectRetirada(selecionar) {
  const busca = normalizar($('#ret-busca').value);
  const sel = $('#ret-med'), atual = selecionar || sel.value;
  // Só mostra o que tem saldo e não venceu; ordena pelo que vence primeiro (primeiro que vence, primeiro que sai)
  const lista = meds.filter(m => m.quantidade > 0 && status(m) !== 'vencido' &&
      (!busca || normalizar(`${m.nome} ${m.dose}`).includes(busca)))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.validade.localeCompare(b.validade));
  sel.innerHTML = '<option value="">Selecione…</option>' + lista.map(m =>
    `<option value="${m.id}">${esc(nomeCompleto(m))} — ${esc(m.local)} — vence ${dataBR(m.validade)} — ${m.quantidade} ${esc(m.unidade)}</option>`).join('');
  if (lista.some(m => m.id === atual)) sel.value = atual;
  renderInfoRetirada();
}

function renderInfoRetirada() {
  const m = meds.find(x => x.id === $('#ret-med').value);
  if (!m) { $('#ret-info').innerHTML = ''; return; }
  $('#ret-qtd').max = m.quantidade;
  const outros = meds.filter(x => x.id !== m.id && x.quantidade > 0 && status(x) !== 'vencido' &&
    normalizar(x.nome) === normalizar(m.nome) && x.validade < m.validade);
  $('#ret-info').innerHTML = `<div class="alerta ${status(m)}">
      <strong>${esc(nomeCompleto(m))}</strong>
      <small>${tagClasse(m.classe)} ${tagSala(m.local)} · Disponível: <b>${m.quantidade} ${esc(m.unidade)}</b></small>
      <div class="prazo">${textoPrazo(diasPara(m.validade))} (${dataBR(m.validade)})</div>
      ${outros.length ? `<small>Atenção: existe outro lote deste remédio que vence antes (${dataBR(outros[0].validade)}, ${esc(outros[0].local)}). Prefira usá-lo primeiro.</small>` : ''}
    </div>`;
}

function filtrarHistorico() {
  const busca = normalizar($('#hist-busca').value), de = $('#hist-de').value, ate = $('#hist-ate').value;
  return retiradas.filter(r => {
    const dia = new Date(r.data).toLocaleDateString('sv-SE'); // AAAA-MM-DD local
    return (!busca || normalizar(`${r.nome} ${r.responsavel} ${r.destino} ${r.obs}`).includes(busca)) &&
      (!de || dia >= de) && (!ate || dia <= ate);
  }).sort((a, b) => b.data.localeCompare(a.data));
}

function renderHistorico() {
  const lista = filtrarHistorico();
  $('#lista-hist').innerHTML = lista.length ? lista.map(r => `
    <div class="hist">
      <div>
        <strong>${esc(r.nome)}</strong> ${tagSala(r.local)}<br>
        <small>Retirado por <b>${esc(r.responsavel)}</b>${r.destino ? ' · Para: ' + esc(r.destino) : ''}${r.obs ? ' · ' + esc(r.obs) : ''}</small>
      </div>
      <div style="text-align:right"><b>${esc(r.quantidade)} ${esc(r.unidade || '')}</b><br><small>${dataHoraBR(r.data)}</small></div>
    </div>`).join('') : '<div class="vazio">Nenhuma retirada registrada.</div>';
}

function renderTudo() {
  renderResumo(); renderAlertas(); renderFiltroClasses(); renderEstoque(); renderSelectRetirada(); renderHistorico();
}

// ------------------------------------------------------------------
//  Abas
// ------------------------------------------------------------------
function abrirAba(nome) {
  document.querySelectorAll('.aba').forEach(b => b.classList.toggle('ativa', b.dataset.aba === nome));
  document.querySelectorAll('.painel').forEach(p => p.classList.toggle('ativo', p.id === nome));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.aba').forEach(b => b.addEventListener('click', () => abrirAba(b.dataset.aba)));

// ------------------------------------------------------------------
//  Adicionar
// ------------------------------------------------------------------
const opcoesClasse = NOMES_CLASSES.map(c => `<option>${esc(c)}</option>`).join('');
$('#add-classe').innerHTML = opcoesClasse;
$('#ed-classe').innerHTML = opcoesClasse;
let classeManual = false;

function atualizarClasseAuto() {
  const nome = $('#add-nome').value;
  const c = identificarClasse(nome);
  if (!classeManual) $('#add-classe').value = c;
  $('#add-classe-info').textContent = !nome ? '' :
    c === 'Outros' ? 'Não reconheci este remédio. Escolha a classe acima.' : `Identificado automaticamente: ${c}`;
  $('#add-classe-info').style.color = c === 'Outros' ? '#f97316' : corDaClasse(c);
}
$('#add-nome').addEventListener('input', atualizarClasseAuto);
$('#add-classe').addEventListener('change', () => { classeManual = true; });

$('#form-add').addEventListener('submit', async e => {
  e.preventDefault();
  const local = document.querySelector('input[name="add-local"]:checked')?.value;
  if (!local) return toast('Escolha a sala (Sala 1 ou Sala 2).', 'erro');
  const med = {
    nome: $('#add-nome').value.trim(),
    dose: $('#add-dose').value.trim(),
    classe: $('#add-classe').value,
    quantidade: parseInt($('#add-qtd').value, 10),
    unidade: $('#add-unidade').value,
    validade: $('#add-validade').value,
    lote: $('#add-lote').value.trim(),
    local,
    criadoEm: new Date().toISOString()
  };
  if (!med.nome || !(med.quantidade > 0) || !med.validade) return toast('Preencha nome, quantidade e validade.', 'erro');
  if (diasPara(med.validade) < 0 && !confirm('Essa data de validade já passou. Adicionar mesmo assim?')) return;

  // Mesmo remédio, mesma validade, lote, unidade e sala → soma a quantidade
  const igual = meds.find(m => normalizar(nomeCompleto(m)) === normalizar(nomeCompleto(med)) &&
    m.validade === med.validade && (m.lote || '') === med.lote && m.local === med.local && m.unidade === med.unidade);
  try {
    if (igual) {
      await db.updateMed(igual.id, { quantidade: igual.quantidade + med.quantidade });
      toast(`Somado ao item existente: agora são ${igual.quantidade + med.quantidade} ${med.unidade}.`);
    } else {
      await db.addMed(med);
      toast(`${med.nome} adicionado à ${local}!`);
    }
    e.target.reset(); classeManual = false; $('#add-classe-info').textContent = '';
    $('#foto-previa').hidden = true; $('#foto-status').hidden = true;
    $('#add-nome').focus();
  } catch (err) { toast('Não foi possível salvar: ' + err.message, 'erro'); }
});

// ---------- Foto ----------
$('#foto').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  const previa = $('#foto-previa'), st = $('#foto-status');
  previa.src = URL.createObjectURL(file); previa.hidden = false;
  const usarIA = !!pref.get('gemini', '');
  st.hidden = false; st.className = 'foto-status carregando';
  st.innerHTML = `${usarIA ? 'Analisando a foto com IA…' : 'Lendo o texto da embalagem…'} <div class="barra"><i></i></div>`;
  const barra = st.querySelector('i');
  try {
    const r = await lerFoto(file, { chaveGemini: pref.get('gemini', ''), modelo: pref.get('modelo', '') },
      p => { barra.style.width = Math.round(p * 100) + '%'; });
    const preencher = (sel, v) => { if (v !== '' && v != null) { const el = $(sel); el.value = v; el.classList.remove('preenchido'); void el.offsetWidth; el.classList.add('preenchido'); } };
    preencher('#add-nome', r.nome);
    preencher('#add-dose', r.dose);
    preencher('#add-qtd', r.quantidade);
    if (r.unidade && [...$('#add-unidade').options].some(o => o.value === r.unidade)) preencher('#add-unidade', r.unidade);
    preencher('#add-validade', r.validade);
    preencher('#add-lote', r.lote);
    classeManual = false; atualizarClasseAuto();

    const achou = [r.nome && 'nome', r.dose && 'dosagem', r.quantidade && 'quantidade', r.validade && 'validade', r.lote && 'lote'].filter(Boolean);
    const faltou = ['nome', 'quantidade', 'validade'].filter(c => !achou.includes(c));
    st.className = 'foto-status ' + (achou.length ? 'ok' : 'erro');
    st.innerHTML = achou.length
      ? `Encontrei: <b>${achou.join(', ')}</b>.` +
        (r.caixas > 1 && r.porCaixa ? ` Vi ${r.caixas} caixas com ${r.porCaixa} ${esc(r.unidade)} cada.` : '') +
        (faltou.length ? ` Complete: <b>${faltou.join(', ')}</b>.` : '') +
        ' Confira os campos destacados antes de salvar.'
      : 'Não consegui ler a embalagem. Tente uma foto mais próxima, bem iluminada e sem reflexo, ou preencha à mão.';
    if (r.fonte === 'texto' && r.textoBruto) console.log('Texto lido da foto:\n', r.textoBruto);
    if (!r.nome) $('#add-nome').focus();
  } catch (err) {
    st.className = 'foto-status erro'; st.textContent = 'Erro ao ler a foto: ' + (err?.message || err || 'tente novamente') + '. Você pode preencher à mão.';
  }
  e.target.value = '';
});

// ------------------------------------------------------------------
//  Estoque: filtros, editar, atalho de retirada, exportar
// ------------------------------------------------------------------
['#busca', '#filtro-sala', '#filtro-classe', '#filtro-status', '#ocultar-zerados']
  .forEach(s => $(s).addEventListener('input', renderEstoque));

$('#lista-estoque').addEventListener('click', e => {
  const r = e.target.closest('[data-retirar]'), ed = e.target.closest('[data-editar]');
  if (r) { $('#ret-busca').value = ''; renderSelectRetirada(r.dataset.retirar); abrirAba('retirar'); $('#ret-qtd').focus(); }
  if (ed) abrirEdicao(ed.dataset.editar);
});

let editando = null;
function abrirEdicao(id) {
  const m = meds.find(x => x.id === id); if (!m) return;
  editando = id;
  $('#ed-nome').value = m.nome; $('#ed-dose').value = m.dose || ''; $('#ed-classe').value = m.classe;
  $('#ed-qtd').value = m.quantidade; $('#ed-unidade').value = m.unidade; $('#ed-validade').value = m.validade;
  $('#ed-lote').value = m.lote || ''; $('#ed-local').value = m.local;
  $('#modal').showModal();
}
$('#ed-cancelar').addEventListener('click', () => $('#modal').close());
$('#form-edit').addEventListener('submit', async e => {
  e.preventDefault();
  try {
    await db.updateMed(editando, {
      nome: $('#ed-nome').value.trim(), dose: $('#ed-dose').value.trim(), classe: $('#ed-classe').value,
      quantidade: parseInt($('#ed-qtd').value, 10) || 0, unidade: $('#ed-unidade').value.trim() || 'unidades',
      validade: $('#ed-validade').value, lote: $('#ed-lote').value.trim(), local: $('#ed-local').value
    });
    $('#modal').close(); toast('Alterações salvas.');
  } catch (err) { toast('Erro ao salvar: ' + err.message, 'erro'); }
});
$('#ed-excluir').addEventListener('click', async () => {
  const m = meds.find(x => x.id === editando);
  if (!m || !confirm(`Excluir "${nomeCompleto(m)}" do estoque? O histórico de retiradas continua salvo.`)) return;
  try { await db.deleteMed(editando); $('#modal').close(); toast('Medicamento excluído.', 'info'); }
  catch (err) { toast('Erro ao excluir: ' + err.message, 'erro'); }
});

function baixarCSV(nomeArquivo, cabecalho, linhas) {
  const cel = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [cabecalho, ...linhas].map(l => l.map(cel).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = nomeArquivo; a.click(); URL.revokeObjectURL(a.href);
}
const hojeArq = () => new Date().toLocaleDateString('sv-SE');
$('#exportar-estoque').addEventListener('click', () => baixarCSV(`estoque-amostras-${hojeArq()}.csv`,
  ['Medicamento', 'Dosagem', 'Classe', 'Quantidade', 'Unidade', 'Validade', 'Lote', 'Local', 'Situação'],
  [...meds].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(m =>
    [m.nome, m.dose, m.classe, m.quantidade, m.unidade, dataBR(m.validade), m.lote, m.local, ROTULO_STATUS[status(m)]])));
$('#exportar-hist').addEventListener('click', () => baixarCSV(`retiradas-${hojeArq()}.csv`,
  ['Data', 'Medicamento', 'Quantidade', 'Unidade', 'Quem retirou', 'Paciente/destino', 'Observação', 'Local', 'Lote', 'Validade'],
  filtrarHistorico().map(r => [dataHoraBR(r.data), r.nome, r.quantidade, r.unidade, r.responsavel, r.destino, r.obs, r.local, r.lote, dataBR(r.validade)])));

// ------------------------------------------------------------------
//  Retirada
// ------------------------------------------------------------------
$('#ret-busca').addEventListener('input', () => renderSelectRetirada());
$('#ret-med').addEventListener('change', renderInfoRetirada);
$('#ret-resp').value = pref.get('responsavel', '');

$('#form-ret').addEventListener('submit', async e => {
  e.preventDefault();
  const m = meds.find(x => x.id === $('#ret-med').value);
  const qtd = parseInt($('#ret-qtd').value, 10);
  const resp = $('#ret-resp').value.trim();
  if (!m) return toast('Escolha o medicamento.', 'erro');
  if (!(qtd > 0)) return toast('Informe a quantidade.', 'erro');
  if (qtd > m.quantidade) return toast(`Só há ${m.quantidade} ${m.unidade} em estoque.`, 'erro');
  if (!resp) return toast('Informe quem está retirando.', 'erro');
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    await db.retirar({ medId: m.id, quantidade: qtd, responsavel: resp,
      destino: $('#ret-destino').value.trim(), obs: $('#ret-obs').value.trim(), data: new Date().toISOString() });
    pref.set('responsavel', resp);
    toast(`Retirada registrada: ${qtd} ${m.unidade} de ${nomeCompleto(m)}.`);
    $('#ret-qtd').value = ''; $('#ret-destino').value = ''; $('#ret-obs').value = ''; $('#ret-busca').value = '';
    renderSelectRetirada('');
  } catch (err) { toast(err.message, 'erro'); }
  btn.disabled = false;
});

// ------------------------------------------------------------------
//  Histórico e ajustes
// ------------------------------------------------------------------
['#hist-busca', '#hist-de', '#hist-ate'].forEach(s => $(s).addEventListener('input', renderHistorico));

$('#cfg-limite').value = String(limite());
$('#cfg-gemini').value = pref.get('gemini', '');
$('#cfg-modelo').value = pref.get('modelo', '');
$('#cfg-salvar').addEventListener('click', () => {
  pref.set('limite', $('#cfg-limite').value);
  pref.set('gemini', $('#cfg-gemini').value.trim());
  pref.set('modelo', $('#cfg-modelo').value.trim());
  renderTudo(); toast('Ajustes salvos.');
});

// ------------------------------------------------------------------
//  Início
// ------------------------------------------------------------------
async function iniciar() {
  const modo = $('#modo');
  if (firebaseConfig.apiKey) {
    try {
      db = await armazenamentoFirebase(firebaseConfig);
      modo.textContent = 'Online · dados compartilhados';
    } catch (err) {
      console.error(err);
      toast('Não consegui conectar ao Firebase: ' + err.message, 'erro');
      db = armazenamentoLocal();
      modo.textContent = 'Offline · só neste navegador';
    }
  } else {
    db = armazenamentoLocal();
    modo.textContent = 'Modo demonstração';
    modo.title = 'Configure o Firebase (firebase-config.js) para compartilhar os dados entre computadores.';
  }
  db.onMeds(l => { meds = l.map(m => ({ unidade: 'unidades', ...m, quantidade: +m.quantidade || 0 })); renderTudo(); });
  db.onRetiradas(l => { retiradas = l; renderHistorico(); });
}
iniciar();
