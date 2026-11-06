/* =============================================================
   Healing Blood – js/script.js
   Seções:
    1. Dados e regras          8. Recompensas e resgate
    2. Utilitários             9. Históricos
    3. Estado                 10. Agenda e calendário
    4. Tema (claro/escuro)    11. Checklist "Posso doar?"
    5. Autenticação           12. Perfil e compatibilidade
    6. Navegação              13. Inicialização
    7. Doações e lembrete
   ============================================================= */


/* =============================================================
   1. DADOS E REGRAS
   ============================================================= */

const REWARDS = [
  { id: 1, name: "Passagem de ônibus", points: 50,  icon: "🚌", desc: "Uma passagem de ônibus gratuita em qualquer linha da cidade." },
  { id: 2, name: "iFood",              points: 150, icon: "🍔", desc: "Voucher de R$30 para usar no iFood." },
  { id: 3, name: "Uber",               points: 250, icon: "🚕", desc: "Crédito de R$40 para sua próxima corrida." },
  { id: 4, name: "Farmácia",           points: 350, icon: "💊", desc: "Voucher de R$80 para medicamentos." },
  { id: 5, name: "Vale combustível",   points: 400, icon: "⛽", desc: "R$60 de crédito em qualquer posto." },
  { id: 6, name: "Streaming",          points: 600, icon: "📺", desc: "1 mês de Netflix ou Disney+ grátis." }
];

// M = masculino, F = feminino
const DONATION_INTERVAL_DAYS = { M: 60,  F: 90 };   // intervalo entre doações
const POINTS_PER_DONATION    = { M: 100, F: 150 };  // pontos por doação de sangue
const DAY_MS = 24 * 60 * 60 * 1000;

const STORAGE_KEYS = {
  users:   "hb_users",
  session: "hb_session",
  theme:   "hb_theme"
};


// Limite de doações em 12 meses
const ANNUAL_LIMIT = { M: 4, F: 3 };

// Instituições do Recife que recebem pontos. O código é o identificador interno.
// (Exemplos: confirmar parceria com cada instituição antes de publicar.)
const INSTITUTIONS = [
  { code: "HBI-001", name: "ONG Juntando as Sílabas",                  area: "Crianças · Alto do Pascoal" },
  { code: "HBI-002", name: "APA Severino Chaves",                      area: "Animais abandonados" },
  { code: "HBI-003", name: "Fundo Municipal da Pessoa Idosa do Recife", area: "Idosos" },
  { code: "HBI-004", name: "ONG Samaritanos",                          area: "Pessoas em situação de rua" },
  { code: "HBI-005", name: "Hemope",                                   area: "Saúde · hemocentro de Pernambuco" },
  { code: "HBI-006", name: "Santa Casa de Misericórdia do Recife",     area: "Saúde e assistência social" }
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Compatibilidade de concentrado de hemácias: para quem doa / de quem recebe
const BLOOD_COMPAT = {
  "O-":  { give: BLOOD_TYPES,                       get: ["O-"] },
  "O+":  { give: ["O+", "A+", "B+", "AB+"],         get: ["O-", "O+"] },
  "A-":  { give: ["A-", "A+", "AB-", "AB+"],        get: ["A-", "O-"] },
  "A+":  { give: ["A+", "AB+"],                     get: ["A+", "A-", "O+", "O-"] },
  "B-":  { give: ["B-", "B+", "AB-", "AB+"],        get: ["B-", "O-"] },
  "B+":  { give: ["B+", "AB+"],                     get: ["B+", "B-", "O+", "O-"] },
  "AB-": { give: ["AB-", "AB+"],                    get: ["AB-", "A-", "B-", "O-"] },
  "AB+": { give: ["AB+"],                           get: BLOOD_TYPES }
};

// Checklist "Posso doar?" – regras gerais do Ministério da Saúde.
// Os prazos podem variar entre hemocentros; a triagem clínica decide.
const CHECKLIST = {
  basic: [
    { id: "b1", text: "Tenho entre 16 e 69 anos (menores de 18 com autorização dos responsáveis; a 1ª doação precisa ser antes dos 60)" },
    { id: "b2", text: "Peso mais de 50 kg" },
    { id: "b3", text: "Estou me sentindo bem e com saúde hoje" },
    { id: "b4", text: "Estou descansado(a) e dormi bem" },
    { id: "b5", text: "Estou alimentado(a) e hidratado(a), sem refeição gordurosa nas últimas 3 horas" },
    { id: "b6", text: "Tenho um documento oficial com foto" }
  ],
  temp: [
    { id: "t1",  text: "Gripe, resfriado, febre ou diarreia recente",                      wait: "Aguardar 7 dias depois que os sintomas passarem" },
    { id: "t2",  text: "Bebi álcool nas últimas 12 horas",                                  wait: "Aguardar 12 horas" },
    { id: "t3",  text: "Fumei nas últimas 2 horas",                                         wait: "Aguardar 2 horas" },
    { id: "t4",  text: "Estou grávida",                                                     wait: "Durante toda a gravidez" },
    { id: "t5",  text: "Tive bebê recentemente",                                            wait: "90 dias após parto normal ou 180 dias após cesariana" },
    { id: "t6",  text: "Estou amamentando um bebê com menos de 12 meses",                   wait: "Até o bebê completar 12 meses" },
    { id: "t7",  text: "Fiz tatuagem, maquiagem definitiva ou piercing recentemente",       wait: "6 a 12 meses, conforme o serviço" },
    { id: "t8",  text: "Extraí dente ou fiz tratamento de canal na última semana",          wait: "Aguardar 7 dias" },
    { id: "t9",  text: "Fiz endoscopia ou colonoscopia nos últimos 6 meses",                wait: "Aguardar 6 meses" },
    { id: "t10", text: "Fiz cirurgia de médio ou grande porte nos últimos 6 meses",         wait: "Cerca de 6 meses (varia conforme a cirurgia)" },
    { id: "t11", text: "Tomei vacina recentemente",                                         wait: "Gripe: 48 h · febre amarela e dengue: cerca de 4 semanas · outras: informe na triagem" },
    { id: "t12", text: "Tive dengue, zika ou chikungunya",                                  wait: "30 dias após a cura (dengue hemorrágica: 6 meses)" },
    { id: "t13", text: "Estive em área de malária nos últimos 12 meses",                    wait: "12 meses após o retorno" },
    { id: "t14", text: "Recebi transfusão de sangue no último ano",                         wait: "Aguardar 12 meses" },
    { id: "t15", text: "Tive situação de risco para infecção sexualmente transmissível",    wait: "Aguardar 12 meses" }
  ],
  definitive: [
    { id: "f1", text: "Hepatite após os 11 anos de idade" },
    { id: "f2", text: "HIV/AIDS" },
    { id: "f3", text: "Doença de Chagas" },
    { id: "f4", text: "HTLV (I ou II)" },
    { id: "f5", text: "Câncer (na maioria dos casos)" },
    { id: "f6", text: "Problema de coagulação do sangue" },
    { id: "f7", text: "Diabetes com complicações vasculares ou uso de insulina" },
    { id: "f8", text: "Uso de drogas injetáveis ilícitas" },
    { id: "f9", text: "Mal de Parkinson ou outra doença crônica grave (o médico da triagem avalia cada caso)" }
  ]
};


/* =============================================================
   2. UTILITÁRIOS
   ============================================================= */

const $ = id => document.getElementById(id);

// Evita injeção de HTML em textos digitados pelo usuário
const esc = text => String(text).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

// Armazenamento local com fallback em memória (caso o navegador bloqueie)
const memoryStore = {};
const storage = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return memoryStore[key] ?? null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); }
    catch (e) { memoryStore[key] = value; }
  }
};

// Hash SHA-256 da senha (demonstração – em produção use um servidor)
async function hashPassword(text) {
  try {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("hb:" + text));
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return btoa(unescape(encodeURIComponent(text)));
  }
}

const formatDateTime = iso =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const formatDate = date => date.toLocaleDateString("pt-BR");

const svgIcon = name => `<svg class="i"><use href="#${name}"/></svg>`;

let toastTimer;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 2800);
}


/* =============================================================
   3. ESTADO
   ============================================================= */

let users = {};
try { users = JSON.parse(storage.get(STORAGE_KEYS.users)) || {}; } catch (e) { /* começa vazio */ }

let me = null;               // usuário logado
let meEmail = null;          // e-mail (chave) do usuário logado
let authMode = "login";      // "login" | "reg"
let donationFilter = "all";  // "all" | "sangue" | "doacao"
let currentRewardId = null;  // recompensa aberta no modal

const saveUsers = () => storage.set(STORAGE_KEYS.users, JSON.stringify(users));

// Registra um item no histórico do usuário
// type: "sangue" | "doacao" | "resgate"   ·   extra: campos opcionais (status, local…)
function addHistory(type, name, icon, points, code, extra) {
  me.hist.unshift({ t: type, name, icon, pts: points, code, d: new Date().toISOString(), ...extra });
  saveUsers();
}


/* =============================================================
   4. TEMA (CLARO / ESCURO)
   ============================================================= */

const darkQuery = matchMedia("(prefers-color-scheme: dark)");

const currentTheme = () =>
  document.documentElement.dataset.theme || (darkQuery.matches ? "dark" : "light");

// Marca como ativo o botão do tema atual (login e cabeçalho)
function paintTheme() {
  const current = currentTheme();
  document.querySelectorAll(".theme button").forEach(btn =>
    btn.classList.toggle("on", btn.dataset.t === current));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  storage.set(STORAGE_KEYS.theme, theme);
  paintTheme();
}

function initTheme() {
  const saved = storage.get(STORAGE_KEYS.theme);
  if (saved === "light" || saved === "dark") document.documentElement.dataset.theme = saved;
  paintTheme();
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", paintTheme);
}


/* =============================================================
   5. AUTENTICAÇÃO
   ============================================================= */

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "reg";

  $("tl").className = isRegister ? "" : "on";
  $("tr").className = isRegister ? "on" : "";

  $("gn").classList.toggle("hide", !isRegister);   // nome
  $("gs").classList.toggle("hide", !isRegister);   // sexo
  $("gp").classList.toggle("hide", !isRegister);   // confirmar senha
  $("aname").required = isRegister;
  $("asex").required = isRegister;
  $("apass2").required = isRegister;

  $("abtn").textContent = isRegister ? "Criar conta" : "Entrar";
  $("aerr").textContent = "";
}

async function submitAuth(event) {
  event.preventDefault();
  const email = $("amail").value.trim().toLowerCase();
  const password = $("apass").value;
  const error = $("aerr");
  error.textContent = "";

  if (authMode === "reg") {
    const name = $("aname").value.trim();
    if (name.length < 2) return error.textContent = "Informe seu nome.";
    if (!$("asex").value) return error.textContent = "Selecione o sexo.";
    if (password !== $("apass2").value) return error.textContent = "As senhas não coincidem.";
    if (users[email]) return error.textContent = "Este e-mail já tem cadastro.";

    users[email] = {
      name,
      sex: $("asex").value,
      pass: await hashPassword(password),
      points: 0,
      hist: []
    };
    saveUsers();
  } else {
    const user = users[email];
    if (!user || user.pass !== await hashPassword(password)) {
      return error.textContent = "E-mail ou senha incorretos.";
    }
  }

  storage.set(STORAGE_KEYS.session, email);
  $("af").reset();
  startSession(email);
}

function startSession(email) {
  const user = users[email];
  if (!user) return;
  me = user;
  meEmail = email;

  // contas antigas: garante os campos novos
  me.sched = me.sched || [];
  me.profile = me.profile || {};
  me.check = me.check || {};
  me.created = me.created || new Date().toISOString();

  $("auth").classList.add("hide");
  $("app").classList.remove("hide");
  $("uname").textContent = me.name.split(" ")[0];

  showView("home");
  if (!me.sex) askSex();   // contas antigas ainda sem o campo "sexo"
}

function logout() {
  storage.set(STORAGE_KEYS.session, "");
  me = null;
  closeModal();
  $("app").classList.add("hide");
  $("auth").classList.remove("hide");
  setAuthMode("login");
}

// Janela para contas antigas informarem o sexo (obrigatória)
function askSex() {
  $("mc").innerHTML = `
    <div class="eta">Complete seu perfil</div>
    <h2 style="font-size:1.2rem">Qual é o seu sexo?</h2>
    <p style="color:var(--mu);font-size:.92rem;margin:4px 0 18px">
      Usamos essa informação para definir o intervalo entre doações (60 dias para homens,
      90 para mulheres) e os pontos de cada doação (100 para homens, 150 para mulheres).
    </p>
    <div class="mb">
      <button class="btn" onclick="setSex('M')">Masculino</button>
      <button class="btn" onclick="setSex('F')">Feminino</button>
    </div>`;
  $("modal").style.display = "flex";
}

function setSex(sex) {
  me.sex = sex;
  saveUsers();
  closeModal();
  refresh();
}


/* =============================================================
   6. NAVEGAÇÃO E TELA INICIAL
   ============================================================= */

const VIEWS = ["home", "don", "res", "chk", "prof"];

function showView(view) {
  VIEWS.forEach(v => {
    $("v-" + v).classList.toggle("hide", v !== view);
    $("n-" + v).className = v === view ? "on" : "";
  });
  refresh();
}

// Redesenha tudo que depende dos dados do usuário
function refresh() {
  const today = dateKey(new Date());
  me.sched = me.sched.filter(s => s.date >= today);   // descarta agendamentos que já passaram

  $("points").textContent = me.points;
  $("lead").textContent = me.sex
    ? `Cada doação sua vale ${POINTS_PER_DONATION[me.sex]} pontos (mulheres recebem 150; homens, 100).`
    : "";
  $("sdate").min = dateKey(minScheduleDate());

  renderRewards();
  renderReminder();
  renderCalendar();
  renderSchedules();
  renderDonations();
  renderRedemptions();
  renderChecklist();
  renderProfile();
}


/* =============================================================
   7. DOAÇÕES E LEMBRETE
   ============================================================= */

// Calcula se o usuário já pode doar de novo e quando.
// Considera o intervalo mínimo e o limite de doações em 12 meses.
function getNextDonation() {
  const interval = DONATION_INTERVAL_DAYS[me.sex] || 60;
  const blood = me.hist.filter(h => h.t === "sangue");   // da mais recente para a mais antiga
  if (!blood.length) return { ok: true, interval };

  let next = new Date(new Date(blood[0].d).getTime() + interval * DAY_MS);

  const limit = ANNUAL_LIMIT[me.sex] || 4;
  const recent = blood.filter(h => Date.now() - new Date(h.d) < 365 * DAY_MS);
  if (recent.length >= limit) {
    const free = new Date(new Date(recent[limit - 1].d).getTime() + 365 * DAY_MS);
    if (free > next) next = free;
  }

  const daysLeft = Math.ceil((next - Date.now()) / DAY_MS);
  return {
    ok: daysLeft <= 0,
    daysLeft,
    next,
    interval,
    progress: Math.max(0, Math.min(100, (1 - daysLeft / interval) * 100))
  };
}

// Link para criar o evento no Google Agenda
function buildCalendarLink(date) {
  const fmt = d => d.getFullYear()
    + String(d.getMonth() + 1).padStart(2, "0")
    + String(d.getDate()).padStart(2, "0");
  const end = new Date(date.getTime() + DAY_MS);

  return "https://calendar.google.com/calendar/render?action=TEMPLATE"
    + "&text=" + encodeURIComponent("Doar sangue – Healing Blood")
    + "&details=" + encodeURIComponent("Você já pode doar sangue novamente. Doe sangue, salve vidas.")
    + "&dates=" + fmt(date) + "/" + fmt(end);
}

// Card de lembrete (telas Recompensas e Doações):
// 1) doação agendada  2) já está em época de doar, sem agendar  3) ainda no intervalo
function renderReminder() {
  if (!me.sex) {
    $("rem-home").innerHTML = $("rem-don").innerHTML = "";
    return;
  }

  const info = getNextDonation();
  const who = me.sex === "F" ? "mulheres" : "homens";
  const upcoming = me.sched[0];   // já filtrado: só datas de hoje em diante
  const scheduleBtn = `<button class="btn sm" onclick="goSchedule()">Agendar doação</button>`;
  let cls = "ok", title, text, action, bar = "";

  if (upcoming) {
    const days = Math.round((parseKey(upcoming.date) - startOfToday()) / DAY_MS);
    title = `Doação agendada para ${fmtKey(upcoming.date)}`;
    text = `${esc(upcoming.place)} · ${days === 0 ? "é hoje" : "em " + days + (days === 1 ? " dia" : " dias")}.`;
    action = `<a class="btn sec sm" target="_blank" rel="noopener" href="${buildCalendarLink(parseKey(upcoming.date))}">Lembrar na agenda</a>`;
  } else if (info.ok) {
    const first = !me.hist.some(h => h.t === "sangue");
    title = "Você já está em época de doar sangue";
    text = first
      ? "Você ainda não registrou nenhuma doação e não tem data marcada. Que tal agendar a primeira?"
      : `O intervalo para ${who} (${info.interval} dias) já passou e você ainda não agendou a próxima doação.`;
    action = scheduleBtn;
  } else {
    cls = "";
    title = `Próxima doação liberada em ${info.daysLeft} ${info.daysLeft === 1 ? "dia" : "dias"}`;
    text = `Você poderá doar a partir de ${formatDate(info.next)}. Já dá para deixar a data marcada.`;
    bar = `<div class="bar"><i style="width:${info.progress}%"></i></div>`;
    action = scheduleBtn;
  }

  $("rem-home").innerHTML = $("rem-don").innerHTML = `
    <div class="rem ${cls}">
      <div style="flex:1;min-width:220px">
        <h3>${title}</h3>
        <p>${text}</p>
        ${bar}
      </div>
      ${action}
    </div>`;
}

// Vai para a aba Doações, no formulário de agendamento
function goSchedule() {
  showView("don");
  $("sched-box").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* FUTURO – validação por comprovante
   1. o usuário anexa o comprovante (foto/PDF) do hemocentro → status "pendente"
   2. o servidor analisa o documento (nome, data, local)
   3. se válido → status "validada" e os pontos são liberados; senão → "recusada"
   addHistory já aceita { status, local } para guardar esses dados. */

// Botão "Registrar doação de sangue" (demonstração; respeita o intervalo)
function doarSangue() {
  const info = getNextDonation();
  if (!info.ok) {
    const dias = info.daysLeft === 1 ? "dia" : "dias";
    return toast(`Você poderá doar de novo em ${info.daysLeft} ${dias} (${formatDate(info.next)}).`);
  }

  const points = POINTS_PER_DONATION[me.sex];
  me.points += points;
  addHistory("sangue", "Doação de sangue", "", points, undefined,
    { status: "validada", local: "Registro manual (demonstração)" });

  const today = dateKey(new Date());
  me.sched = me.sched.filter(s => s.date > today);   // a doação de hoje cumpre o agendamento
  saveUsers();
  refresh();
  toast(`Doação registrada: +${points} pontos`);
}

// Doar pontos para uma instituição
function doarInstituicao() {
  const inst = INSTITUTIONS.find(i => i.code === $("inst").value);
  const value = parseInt($("valor").value, 10);

  if (isNaN(value) || value <= 0) return toast("Digite uma quantidade válida.");
  if (value > me.points) return toast("Você não tem pontos suficientes.");

  me.points -= value;
  addHistory("doacao", "Doação para " + inst.name, "", -value, inst.code);
  $("valor").value = "";
  refresh();
  toast(`Você doou ${value} pontos para ${inst.name} (código ${inst.code}).`);
}

function renderInstitutions() {
  $("inst").innerHTML = INSTITUTIONS.map(i => `<option value="${i.code}">${i.name}</option>`).join("");
  showInstitution();
}

function showInstitution() {
  const inst = INSTITUTIONS.find(i => i.code === $("inst").value);
  $("inst-info").textContent = `${inst.area} · Código da instituição: ${inst.code}`;
}


/* =============================================================
   8. RECOMPENSAS E RESGATE (modal em 3 etapas)
   ============================================================= */

function renderRewards() {
  $("grid").innerHTML = REWARDS.map(r => {
    const progress = Math.min(me.points / r.points * 100, 100);
    const available = progress >= 100;
    return `
      <div class="rc" onclick="openReward(${r.id})">
        <div class="top">
          <div class="tile">${r.icon}</div>
          <div>
            <h3>${r.name}</h3>
            <span class="pr">${r.points} pontos</span>
          </div>
        </div>
        <div class="bar"><i style="width:${progress}%"></i></div>
        <div class="row">
          <span class="st ${available ? "ok" : ""}">
            ${available ? "Disponível para resgate" : "Faltam " + (r.points - me.points) + " pontos"}
          </span>
          <button class="btn sec sm">Detalhes</button>
        </div>
      </div>`;
  }).join("");
}

function openReward(id) {
  currentRewardId = id;
  step1();
  $("modal").style.display = "flex";
}

function closeModal() {
  $("modal").style.display = "none";
}

// Clique fora do modal fecha, exceto enquanto o perfil está incompleto
function onBackdropClick(event) {
  if (event.target === $("modal") && me && me.sex) closeModal();
}

const currentReward = () => REWARDS.find(r => r.id === currentRewardId);

// Etapa 1 – detalhes
function step1() {
  const r = currentReward();
  const canRedeem = me.points >= r.points;

  $("mc").innerHTML = `
    <div class="eta">Etapa 1 de 3 · Detalhes</div>
    <div class="mh">
      <div class="tile">${r.icon}</div>
      <div><h2>${r.name}</h2><span class="pr">${r.points} pontos</span></div>
    </div>
    <div class="dsc"><strong>Como resgatar</strong><br>${r.desc} Depois de confirmar, você recebe um código para usar.</div>
    <div class="mb">
      <button class="btn sec" onclick="closeModal()">Fechar</button>
      <button class="btn" ${canRedeem ? "" : "disabled"} onclick="step2()">
        ${canRedeem ? "Continuar" : "Pontos insuficientes"}
      </button>
    </div>`;
}

// Etapa 2 – confirmação com o resumo do saldo
function step2() {
  const r = currentReward();

  $("mc").innerHTML = `
    <div class="eta">Etapa 2 de 3 · Confirmação</div>
    <h2 style="font-size:1.2rem">Confirmar resgate</h2>
    <p style="color:var(--mu);font-size:.92rem;margin-top:2px">Confira os dados antes de continuar.</p>
    <div class="sum">
      <div><span>Recompensa</span><span>${r.icon} ${r.name}</span></div>
      <div><span>Saldo atual</span><span>${me.points} pts</span></div>
      <div><span>Custo</span><span class="neg">− ${r.points} pts</span></div>
      <div><span>Saldo após o resgate</span><span>${me.points - r.points} pts</span></div>
    </div>
    <div class="mb">
      <button class="btn sec" onclick="step1()">Voltar</button>
      <button class="btn" onclick="confirmRedeem()">Confirmar resgate</button>
    </div>`;
}

// Etapa 3 – resgate concluído, com código
function confirmRedeem() {
  const r = currentReward();
  if (me.points < r.points) {
    toast("Pontos insuficientes.");
    return closeModal();
  }

  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  const code = `HB-${part()}-${part()}`;

  me.points -= r.points;
  addHistory("resgate", r.name, r.icon, -r.points, code);
  refresh();

  $("mc").innerHTML = `
    <div class="eta">Etapa 3 de 3 · Concluído</div>
    <div class="chk">✓</div>
    <h2 style="font-size:1.2rem">Resgate concluído</h2>
    <p style="color:var(--mu);font-size:.92rem;margin-top:2px">${esc(r.name)} foi adicionado à sua conta.</p>
    <div class="cbox"><small>Seu código</small><b>${code}</b></div>
    <p style="font-size:.85rem;color:var(--mu);margin-bottom:18px">
      Novo saldo: <strong>${me.points} pontos</strong>. O código fica salvo na aba Resgates.
    </p>
    <div class="mb">
      <button class="btn sec" onclick="closeModal()">Fechar</button>
      <button class="btn" onclick="closeModal(); showView('res')">Ver resgates</button>
    </div>`;
}


/* =============================================================
   9. HISTÓRICOS
   ============================================================= */

function copyCode(code, button) {
  try { navigator.clipboard.writeText(code); } catch (e) { /* ignora */ }
  const original = button.textContent;
  button.textContent = "Copiado";
  setTimeout(() => button.textContent = original, 1200);
}

// Uma linha de histórico (doação de sangue, doação a instituição ou resgate)
function historyRow(h) {
  const icon = h.t === "sangue" ? svgIcon("drop")
             : h.t === "doacao" ? svgIcon("heart")
             : h.icon;

  return `
    <div class="hi">
      <div class="ic">${icon}</div>
      <div class="in"><b>${esc(h.name)}</b><small>${formatDateTime(h.d)}${h.local ? " · " + esc(h.local) : ""}</small></div>
      ${h.code ? `<button class="code" title="Copiar código" onclick="copyCode('${h.code}', this)">${h.code}</button>` : ""}
      ${h.t === "resgate" ? `<span class="badge">Concluído</span>` : ""}
      <div class="hp ${h.pts > 0 ? "pos" : ""}">${h.pts > 0 ? "+" : ""}${h.pts} pts</div>
    </div>`;
}

const emptyState = (message, buttonLabel, view) => `
  <div class="list">
    <div class="empty">${message}<br><br>
      <button class="btn" onclick="showView('${view}')">${buttonLabel}</button>
    </div>
  </div>`;

// ----- Aba Doações -----
function setDonationFilter(filter) {
  donationFilter = filter;
  ["all", "sangue", "doacao"].forEach(f => $("d-" + f).className = f === filter ? "on" : "");
  renderDonations();
}

function renderDonations() {
  const blood = me.hist.filter(h => h.t === "sangue");
  const given = me.hist.filter(h => h.t === "doacao");

  $("dstats").innerHTML = `
    <div class="stat"><b>${blood.length}</b><span>Doações de sangue</span></div>
    <div class="stat"><b>${blood.reduce((sum, h) => sum + h.pts, 0)}</b><span>Pontos recebidos</span></div>
    <div class="stat"><b>${given.reduce((sum, h) => sum - h.pts, 0)}</b><span>Pontos doados</span></div>`;

  const items = me.hist.filter(h =>
    donationFilter === "all" ? (h.t === "sangue" || h.t === "doacao") : h.t === donationFilter);

  $("dlist").innerHTML = items.length
    ? `<div class="list">${items.map(historyRow).join("")}</div>`
    : emptyState("Nenhuma doação por aqui ainda.", "Registrar doação", "home");
}

// ----- Aba Resgates -----
function renderRedemptions() {
  const redeemed = me.hist.filter(h => h.t === "resgate");

  $("rstats").innerHTML = `
    <div class="stat"><b>${redeemed.length}</b><span>Resgates feitos</span></div>
    <div class="stat"><b>${redeemed.reduce((sum, h) => sum - h.pts, 0)}</b><span>Pontos gastos</span></div>`;

  $("rlist").innerHTML = redeemed.length
    ? `<div class="list">${redeemed.map(historyRow).join("")}</div>`
    : emptyState("Você ainda não resgatou nenhuma recompensa.", "Ver recompensas", "home");
}


/* =============================================================
   10. AGENDA E CALENDÁRIO
   ============================================================= */

const pad = n => String(n).padStart(2, "0");
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;   // "2026-11-05"
const parseKey = key => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtKey = key => key.split("-").reverse().join("/");                                 // "05/11/2026"
const startOfToday = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };

let calMonth = startOfToday();   // mês exibido no calendário
calMonth.setDate(1);

// Primeira data em que o usuário pode agendar uma doação
function minScheduleDate() {
  const info = getNextDonation();
  const today = startOfToday();
  if (info.ok) return today;
  const next = new Date(info.next.getFullYear(), info.next.getMonth(), info.next.getDate());
  return next > today ? next : today;
}

function changeMonth(step) {
  calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + step, 1);
  renderCalendar();
}

// Calendário: dias em que doou (preenchido), agendados (tracejado) e liberação (verde)
function renderCalendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();

  const donated = new Set(me.hist.filter(h => h.t === "sangue").map(h => dateKey(new Date(h.d))));
  const scheduled = new Set(me.sched.map(s => s.date));
  const info = getNextDonation();
  const eligible = info.ok ? null : dateKey(info.next);
  const today = dateKey(new Date());

  let cells = ["D", "S", "T", "Q", "Q", "S", "S"].map(w => `<span class="wd">${w}</span>`).join("");
  cells += '<span class="cd empty"></span>'.repeat(offset);

  for (let d = 1; d <= total; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`;
    const cls = ["cd", donated.has(key) && "don", scheduled.has(key) && "sch",
                 key === eligible && "elig", key === today && "today"].filter(Boolean).join(" ");
    const tip = donated.has(key) ? "Doação de sangue"
              : scheduled.has(key) ? "Doação agendada"
              : key === eligible ? "Liberada para doar a partir deste dia" : "";
    cells += `<button class="${cls}" title="${tip}" onclick="pickDay('${key}')">${d}</button>`;
  }

  const title = calMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  $("cal").innerHTML = `
    <div class="cal-h">
      <button onclick="changeMonth(-1)" aria-label="Mês anterior">‹</button>
      <b>${title}</b>
      <button onclick="changeMonth(1)" aria-label="Próximo mês">›</button>
    </div>
    <div class="cal-g">${cells}</div>
    <div class="leg">
      <span><i style="background:var(--r)"></i>Doou</span>
      <span><i style="border:2px dashed var(--r)"></i>Agendada</span>
      <span><i style="border:2px solid var(--ok)"></i>Liberada</span>
      <span><i style="border:1px solid var(--mu)"></i>Hoje</span>
    </div>`;
}

// Clique num dia do calendário: preenche a data do agendamento
function pickDay(key) {
  const min = dateKey(minScheduleDate());
  if (key < min) return toast(`Você poderá agendar a partir de ${fmtKey(min)}.`);
  $("sdate").value = key;
  toast(`Data ${fmtKey(key)} selecionada. Escolha o local e confirme.`);
  $("sched-box").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function addSchedule() {
  const date = $("sdate").value;
  const place = $("splace").value;
  const min = dateKey(minScheduleDate());

  if (!date) return toast("Escolha uma data.");
  if (date < min) return toast(`Você poderá doar a partir de ${fmtKey(min)}.`);
  if (me.sched.some(s => s.date === date)) return toast("Você já tem uma doação agendada nesse dia.");

  me.sched.push({ id: Date.now().toString(36), date, place });
  me.sched.sort((a, b) => a.date.localeCompare(b.date));
  saveUsers();
  $("sdate").value = "";
  refresh();
  toast("Doação agendada.");
}

function cancelSchedule(id) {
  me.sched = me.sched.filter(s => s.id !== id);
  saveUsers();
  refresh();
  toast("Agendamento cancelado.");
}

function renderSchedules() {
  $("slist").innerHTML = me.sched.length
    ? me.sched.map(s => `
        <div class="hi">
          <div class="in"><b>${fmtKey(s.date)}</b><small>${esc(s.place)}</small></div>
          <a class="btn sec sm" target="_blank" rel="noopener" href="${buildCalendarLink(parseKey(s.date))}">Agenda</a>
          <button class="btn sec sm" onclick="cancelSchedule('${s.id}')">Cancelar</button>
        </div>`).join("")
    : `<p class="note" style="margin:0">Nenhuma doação agendada.</p>`;
}


/* =============================================================
   11. CHECKLIST "POSSO DOAR?"
   ============================================================= */

function renderChecklist() {
  const group = (title, sub, items) => `
    <div class="grp">
      <h3>${title}<small>${sub}</small></h3>
      ${items.map(i => `
        <label class="ck">
          <input type="checkbox" ${me.check[i.id] ? "checked" : ""} onchange="toggleCheck('${i.id}', this.checked)">
          <span>${i.text}${i.wait ? `<small>${i.wait}</small>` : ""}</span>
        </label>`).join("")}
    </div>`;

  $("chk-groups").innerHTML =
      group("1. Requisitos básicos", "Marque os que se aplicam a você hoje", CHECKLIST.basic)
    + group("2. Impedimentos temporários", "Marque se algum se aplica: você poderá doar depois de esperar", CHECKLIST.temp)
    + group("3. Impedimentos definitivos", "Marque se algum se aplica", CHECKLIST.definitive);

  renderChecklistResult();
}

function toggleCheck(id, checked) {
  me.check[id] = checked;
  saveUsers();
  renderChecklistResult();
}

function resetChecklist() {
  me.check = {};
  saveUsers();
  renderChecklist();
}

// Resultado: definitivo → temporário/intervalo → requisitos faltando → apto
function renderChecklistResult() {
  const on = item => me.check[item.id];
  const definitive = CHECKLIST.definitive.filter(on);
  const temporary = CHECKLIST.temp.filter(on);
  const missing = CHECKLIST.basic.filter(i => !on(i));
  const answered = Object.values(me.check).some(Boolean);
  const info = getNextDonation();
  const list = items => `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
  let cls, title, body;

  if (definitive.length) {
    cls = "bad";
    title = "Há impedimento definitivo";
    body = `<p>Pelo que você marcou, a doação não é permitida. Cada caso é avaliado pelo médico da triagem, então vale conversar com o hemocentro.</p>`
         + list(definitive.map(i => i.text));
  } else if (temporary.length || !info.ok) {
    cls = "warn";
    title = "Adie a doação por enquanto";
    const items = temporary.map(i => `${i.text}: <em>${i.wait}</em>`);
    if (!info.ok) items.push(`Intervalo entre doações: você poderá doar a partir de ${formatDate(info.next)}`);
    body = list(items);
  } else if (!answered) {
    cls = "idle";
    title = "Responda o checklist abaixo";
    body = `<p>Marque o que se aplica a você e o resultado aparece aqui.</p>`;
  } else if (missing.length) {
    cls = "idle";
    title = `Falta confirmar ${missing.length} ${missing.length === 1 ? "requisito básico" : "requisitos básicos"}`;
    body = list(missing.map(i => i.text));
  } else {
    cls = "good";
    title = "Pelo checklist, você parece apto(a) a doar";
    body = `<p>Procure um hemocentro com documento com foto. A confirmação final é feita na triagem.</p>
            <button class="btn sm" style="margin-top:10px" onclick="goSchedule()">Agendar doação</button>`;
  }

  $("chk-result").innerHTML = `
    <div class="verdict ${cls}">
      <h3>${title}</h3>${body}
      <p class="note" style="margin:10px 0 0">Orientação baseada nas regras gerais do Ministério da Saúde. Os prazos podem variar entre hemocentros, e a decisão final é sempre da triagem clínica.</p>
    </div>`;
}


/* =============================================================
   12. PERFIL E COMPATIBILIDADE
   ============================================================= */

function ageFrom(birthKey) {
  if (!birthKey) return null;
  const b = parseKey(birthKey), n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}

function renderProfile() {
  const p = me.profile;
  const age = ageFrom(p.birth);
  const blood = me.hist.filter(h => h.t === "sangue");
  const info = getNextDonation();

  const bloodOptions = ["", ...BLOOD_TYPES]
    .map(t => `<option value="${t}" ${p.blood === t ? "selected" : ""}>${t || "Não informado"}</option>`).join("");

  const hints = [];
  if (age !== null && (age < 16 || age > 69)) hints.push("Idade fora do intervalo geral para doação (16 a 69 anos).");
  if (age !== null && age >= 16 && age < 18) hints.push("Menores de 18 anos precisam de autorização dos responsáveis.");
  if (p.weight && Number(p.weight) <= 50) hints.push("Para doar, o peso precisa ser maior que 50 kg.");

  const compat = BLOOD_COMPAT[p.blood];
  const compatHtml = compat
    ? `<p style="margin-top:14px;font-size:.9rem"><b>${p.blood}</b> pode doar para: ${compat.give.join(", ")}<br>
       pode receber de: ${compat.get.join(", ")}</p>
       <p class="note" style="margin:4px 0 0">Compatibilidade de concentrado de hemácias.</p>`
    : `<p class="note" style="margin-top:14px">Informe seu tipo sanguíneo para ver a compatibilidade.</p>`;

  $("prof").innerHTML = `
    <div class="cols">
      <div class="box" style="max-width:none">
        <div class="fgrid">
          <div><label for="pname">Nome</label><input id="pname" value="${esc(me.name)}" autocomplete="name"></div>
          <div><label for="pmail">E-mail</label><input id="pmail" value="${esc(meEmail)}" readonly></div>
          <div><label for="psex">Sexo</label>
            <select id="psex">
              <option value="M" ${me.sex === "M" ? "selected" : ""}>Masculino</option>
              <option value="F" ${me.sex === "F" ? "selected" : ""}>Feminino</option>
            </select></div>
          <div><label for="pblood">Tipo sanguíneo</label><select id="pblood">${bloodOptions}</select></div>
          <div><label for="pbirth">Data de nascimento</label><input id="pbirth" type="date" value="${p.birth || ""}" max="${dateKey(new Date())}"></div>
          <div><label for="pweight">Peso (kg)</label><input id="pweight" type="number" min="20" max="300" step="0.1" value="${p.weight || ""}"></div>
          <div><label for="pcity">Cidade</label><input id="pcity" value="${esc(p.city ?? "Recife")}"></div>
        </div>
        <button class="btn" style="justify-self:start" onclick="saveProfile()">Salvar perfil</button>
      </div>

      <div class="box" style="max-width:none">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar">${esc(me.name.trim().charAt(0).toUpperCase())}</div>
          <div><b>${esc(me.name)}</b><br><small style="color:var(--mu)">${me.sex === "F" ? "Doa a cada 90 dias" : "Doa a cada 60 dias"}</small></div>
        </div>
        <div class="kv">
          <div><span>Tipo sanguíneo</span><b>${p.blood || "—"}</b></div>
          <div><span>Idade</span><b>${age !== null ? age + " anos" : "—"}</b></div>
          <div><span>Doações de sangue</span><b>${blood.length}</b></div>
          <div><span>Última doação</span><b>${blood.length ? formatDate(new Date(blood[0].d)) : "—"}</b></div>
          <div><span>Próxima liberada</span><b>${info.ok ? "Agora" : formatDate(info.next)}</b></div>
          <div><span>Pontos</span><b>${me.points}</b></div>
          <div><span>Membro desde</span><b>${formatDate(new Date(me.created))}</b></div>
        </div>
        ${hints.map(h => `<p class="warnnote">${h}</p>`).join("")}
        ${compatHtml}
      </div>
    </div>`;
}

function saveProfile() {
  const name = $("pname").value.trim();
  const birth = $("pbirth").value;
  const weight = $("pweight").value;

  if (name.length < 2) return toast("Informe seu nome.");
  if (birth && birth > dateKey(new Date())) return toast("A data de nascimento não pode estar no futuro.");
  if (weight && (Number(weight) < 20 || Number(weight) > 300)) return toast("Informe um peso válido.");

  me.name = name;
  me.sex = $("psex").value;
  me.profile = { blood: $("pblood").value, birth, weight, city: $("pcity").value.trim() };
  saveUsers();
  $("uname").textContent = name.split(" ")[0];
  refresh();
  toast("Perfil salvo.");
}


/* =============================================================
   13. INICIALIZAÇÃO
   ============================================================= */

function init() {
  initTheme();
  renderInstitutions();
  const email = storage.get(STORAGE_KEYS.session);
  if (email && users[email]) startSession(email);
}

init();
