// Albor América · comportamento da página

// WhatsApp do treino: o P&D informa o número antes do encontro 1.
// Formato: só números, com 55 e DDD. Ex.: "5512900000000".
// Enquanto estiver vazio, o botão abre o WhatsApp com a mensagem pronta
// e a pessoa escolhe o contato.
const NUMERO_WHATSAPP = "";
const MENSAGEM_WHATSAPP = "Olá! Quero saber mais sobre o Albor América.";

const raiz = document.documentElement;
const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (a, b, v) => { const t = limitar((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/* =========================================================
   Nuvens de verdade: ruído em camadas, base mais achatada e
   sombra embaixo. A abertura e a galeria usam a mesma fábrica.
   ========================================================= */
let texturasDeNuvem = null;
function texturaDeNuvem(semente) {
  const w = 160, h = 80;
  const peq = document.createElement("canvas");
  peq.width = w; peq.height = h;
  const g = peq.getContext("2d");
  const img = g.createImageData(w, h);
  const ruido = new Float32Array(w * h);
  let aleatorio = semente * 9973 + 1;
  const rnd = () => { aleatorio = (aleatorio * 16807) % 2147483647; return aleatorio / 2147483647; };
  for (const [celula, peso] of [[20, 0.55], [9, 0.28], [4, 0.17]]) {
    const gw = Math.ceil(w / celula) + 2, gh = Math.ceil(h / celula) + 2;
    const grade = Array.from({ length: gw * gh }, rnd);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const gx = x / celula, gy = y / celula, x0 = Math.floor(gx), y0 = Math.floor(gy);
      const fx = gx - x0, fy = gy - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = grade[y0 * gw + x0], b = grade[y0 * gw + x0 + 1], c = grade[(y0 + 1) * gw + x0], d = grade[(y0 + 1) * gw + x0 + 1];
      ruido[y * w + x] += peso * (a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy);
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x / w - 0.5) / 0.5, dy = (y / h - 0.58) / (y / h > 0.58 ? 0.32 : 0.6);
    const forma = 1 - (dx * dx + dy * dy);
    const dens = ruido[y * w + x] * 0.95 + forma * 0.75 - 0.62;
    const a = limitar(dens / 0.3);
    const sombra = limitar((y / h - 0.3) * 1.1) * 0.22;
    const i = (y * w + x) * 4;
    // o claro da nuvem é o off-white da página, para a emenda com as partes claras sumir
    img.data[i] = 247 - sombra * 180;
    img.data[i + 1] = 245 - sombra * 132;
    img.data[i + 2] = 240 - sombra * 92;
    img.data[i + 3] = a * a * (3 - 2 * a) * 255;
  }
  g.putImageData(img, 0, 0);
  const grande = document.createElement("canvas");
  grande.width = 640; grande.height = 320;
  const gg = grande.getContext("2d");
  gg.imageSmoothingQuality = "high";
  gg.drawImage(peq, 0, 0, 640, 320);
  return grande.toDataURL("image/png");
}

// monta um céu de nuvens dentro de "palco" e devolve atualizar(p): 0 fechado, 1 aberto.
// Por quadro só mudam transform e opacity, que a placa de vídeo resolve sem redesenhar a página.
function criarNuvens(palco) {
  if (!texturasDeNuvem) texturasDeNuvem = [1, 2, 3, 4, 5].map(texturaDeNuvem);
  const base = document.createElement("div");
  base.className = "nuvens__base";
  palco.appendChild(base);
  const nuvens = [];
  const linhas = 4, colunas = 4;
  for (let l = 0; l < linhas; l++) for (let c = 0; c < colunas; c++) {
    const el = document.createElement("div");
    el.className = "nuvem";
    el.style.backgroundImage = `url(${texturasDeNuvem[(l * colunas + c) % texturasDeNuvem.length]})`;
    palco.appendChild(el);
    nuvens.push({
      el,
      x: (c + 0.5) / colunas + (Math.random() - 0.5) * 0.16,
      y: (l + 0.5) / linhas + (Math.random() - 0.5) * 0.18,
      tamanho: 0.8 + Math.random() * 0.4,
      velocidade: 0.75 + Math.random() * 0.6,
      espelho: Math.random() < 0.5 ? -1 : 1,
    });
  }
  palco.style.background = "transparent";

  let W = 0, H = 0;
  function medir() {
    W = palco.clientWidth || window.innerWidth;
    H = palco.clientHeight || window.innerHeight;
    for (const n of nuvens) {
      n.w = Math.max(W, 700) * n.tamanho;
      n.h = n.w / 2;
      n.el.style.width = `${n.w}px`;
      n.el.style.height = `${n.h}px`;
      const dx = n.x - 0.5, dy = (n.y - 0.48) * 0.8;
      const d = Math.hypot(dx, dy) || 0.01;
      n.dirX = dx / d; n.dirY = dy / d;
      n.baseX = n.x * W - n.w / 2;
      n.baseY = n.y * H - n.h / 2;
    }
  }
  medir();
  window.addEventListener("resize", medir);

  let ultimo = -1;
  return function atualizar(p) {
    if (Math.abs(p - ultimo) < 0.0008) return;
    ultimo = p;
    const abre = suave(0.06, 0.78, p);
    base.style.opacity = (1 - suave(0, 0.3, p)).toFixed(3);
    const alcance = Math.max(W, H) * 1.05;
    const anda0 = Math.pow(abre, 1.6) * alcance;
    const escala = 1 + abre * 0.9;
    const alfa = (1 - Math.pow(abre, 2.2)).toFixed(3);
    for (const n of nuvens) {
      const anda = anda0 * n.velocidade;
      n.el.style.transform = `translate3d(${(n.baseX + n.dirX * anda).toFixed(1)}px, ${(n.baseY + n.dirY * anda - abre * 60).toFixed(1)}px, 0) scale(${(escala * n.espelho).toFixed(3)}, ${escala.toFixed(3)})`;
      n.el.style.opacity = alfa;
    }
  };
}

/* =========================================================
   Entrada: os textos são digitados no branco e, em seguida,
   as nuvens se abrem e a câmera pousa na torre.
   ========================================================= */
(function entrada() {
  if (!raiz.classList.contains("entrada")) return; // pediu menos movimento

  // troca a segurança do cabeçalho por uma mais folgada, agora que o script carregou
  clearTimeout(window.__entradaSeguranca);
  window.__entradaSeguranca = setTimeout(() => terminar(), 20000);

  const COR = "246, 244, 239"; // o off-white da página
  const NUVENS_MS = 3600;
  const textos = [
    { el: document.querySelector(".abertura__lugar"), ms: 32 },
    { el: document.querySelector("#abertura-titulo"), ms: 62 },
    { el: document.querySelector(".abertura__apoio"), ms: 20 },
  ];
  let pulou = false;
  let acabou = false;

  // guarda o texto e o espaço de cada linha, para a página não pular enquanto digita
  async function preparar() {
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), esperar(1500)]);
    textos.forEach((t) => {
      t.texto = t.el.textContent;
      t.el.style.minHeight = t.el.offsetHeight + "px";
      t.el.setAttribute("aria-label", t.texto);
      t.el.textContent = "";
    });
    raiz.classList.add("pronta");
  }

  async function digitar() {
    await preparar();
    await esperar(400);
    for (const t of textos) {
      t.el.classList.add("digitando");
      for (let i = 1; i <= t.texto.length && !pulou; i++) {
        t.el.textContent = t.texto.slice(0, i);
        await esperar(t.ms);
      }
      t.el.textContent = t.texto;
      if (!pulou) await esperar(380);
      t.el.classList.remove("digitando");
    }
    if (!pulou) await esperar(450);
  }

  /* ---------- nuvens ---------- */
  const tela = document.getElementById("nuvens");
  let atualizarNuvens = () => {};
  function prepararNuvens() { atualizarNuvens = criarNuvens(tela); atualizarNuvens(0); }

  function abrirNuvens(duracao) {
    return new Promise((resolver) => {
      let inicio = null;
      const passo = (agora) => {
        if (inicio === null) inicio = agora;
        const t = Math.min((agora - inicio) / duracao, 1);
        atualizarNuvens(t); // a fábrica já suaviza o começo e o fim
        if (t < 1 && !acabou) requestAnimationFrame(passo);
        else resolver();
      };
      requestAnimationFrame(passo);
    });
  }

  function terminar() {
    if (acabou) return;
    acabou = true;
    clearTimeout(window.__entradaSeguranca);
    raiz.classList.remove("entrada", "nuvens", "pronta");
    textos.forEach((t) => {
      if (t.texto) t.el.textContent = t.texto;
      t.el.style.minHeight = "";
      t.el.removeAttribute("aria-label");
      t.el.classList.remove("digitando");
    });
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.removeEventListener(ev, pular));
  }

  // quem tem pressa pode pular: rolar, tocar ou apertar uma tecla acelera tudo
  function pular() { pulou = true; }
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, pular, { passive: true }));

  const foto = document.querySelector(".abertura__imagem");
  const fotoPronta = (foto.decode ? foto.decode() : Promise.resolve()).catch(() => {});

  (async () => {
    prepararNuvens();
    await digitar();
    await Promise.race([fotoPronta, esperar(2500)]);
    raiz.classList.add("nuvens");
    await abrirNuvens(pulou ? 1400 : NUVENS_MS);
    terminar();
  })();
})();

/* =========================================================
   Rolagem: um ciclo só por quadro. As posições são medidas uma
   vez (e de novo quando a página muda de tamanho); a cada quadro
   só se escrevem transform e opacity, que não redesenham a página.
   ========================================================= */
const topo = document.getElementById("topo");
const foto = document.getElementById("abertura-foto");
const conteudo = document.getElementById("abertura-conteudo");
const elevacao = document.getElementById("elevacao");
const diferenciais = document.getElementById("diferenciais");
const miolo = diferenciais.querySelector(".diferenciais__miolo");
const arco = document.getElementById("arco");
const arcoTexto = arco.querySelector("text");
const trilho = document.getElementById("trilho-progresso");
const tracado = document.getElementById("tracado");
const ceu = document.getElementById("ceu");
const ceuNuvens = document.getElementById("ceu-nuvens");
const ceuImagem = document.getElementById("ceu-imagem");
const ceuTexto = document.getElementById("ceu-texto");
const ceuPalco = ceu.querySelector(".ceu__palco");
const fotoContato = document.getElementById("contato-foto");
const fotoContatoImg = fotoContato.querySelector("img");
const legendaContato = fotoContato.querySelector(".contato__legenda");
const fotosEmMovimento = [...document.querySelectorAll(".cartao__foto img, .mosaico img")];

// o domo: um círculo liso que sobe e cresce (só escala, sem recorte)
const domo = document.createElement("div");
domo.className = "diferenciais__domo";
diferenciais.prepend(domo);
if (!menosMovimento) raiz.classList.add("arco-ativo");

/* ---------- o traçado: os 24 andares, de baixo para cima ---------- */
const andares = tracado.querySelector(".torre__andares");
for (let i = 0; i < 24; i++) {
  const y = (418 - (i + 1) * (272 / 24)).toFixed(1);
  const de = 0.6 + i * 0.011;
  const linha = document.createElementNS("http://www.w3.org/2000/svg", "path");
  linha.setAttribute("class", "traco traco--fino");
  linha.setAttribute("pathLength", "1");
  linha.setAttribute("d", `M668 ${y} H772`);
  linha.dataset.de = de.toFixed(3);
  linha.dataset.ate = (de + 0.03).toFixed(3);
  andares.appendChild(linha);
}
const rota = tracado.querySelector(".traco--rota");
const tracosDaTorre = [...tracado.querySelectorAll(".torre .traco")].map((t) => ({ el: t, de: +t.dataset.de, ate: +t.dataset.ate, ultimo: -1 }));
const pontos = [...tracado.querySelectorAll(".ponto")].map((el) => ({ el, em: +el.dataset.em, aceso: false }));
const desenho = tracado.querySelector(".tracado__desenho");

/* ---------- medidas guardadas ---------- */
const M = {};
function medir() {
  const y = window.scrollY;
  const topoDe = (el) => el.getBoundingClientRect().top + y;
  M.vw = window.innerWidth;
  M.vh = window.innerHeight;
  M.total = Math.max(1, document.documentElement.scrollHeight - M.vh);

  desenho.setAttribute("viewBox", M.vw < 700 ? "500 70 440 470" : "0 60 1440 480");

  // domo e frase curva
  M.sobe = raiz.classList.contains("arco-ativo") ? -parseFloat(getComputedStyle(diferenciais).marginTop) || 0 : 0;
  M.r0 = Math.max(M.vw * 0.62, 300);
  M.r1 = Math.hypot(M.vw, M.vh) * 3;
  domo.style.width = domo.style.height = `${2 * M.r0}px`;
  domo.style.marginLeft = `${-M.r0}px`;
  domo.style.top = `${M.sobe}px`;
  // abaixo do centro do círculo a parte é sempre off-white; acima, só o domo pinta
  diferenciais.style.setProperty("--corte", `${M.sobe + M.r0}px`);
  M.arcoLargura = Math.max((M.r0 - 46) * 1000 / 420, 360);
  M.arcoS = M.arcoLargura / 1000;
  arco.style.width = `${M.arcoLargura}px`;
  arco.style.height = `${220 * M.arcoS}px`;
  arcoTexto.style.fontSize = `${(M.vw < 700 ? 15 : 21) / M.arcoS}px`;

  M.tracado = { top: topoDe(tracado), h: tracado.offsetHeight };
  M.ceu = { top: topoDe(ceu), h: ceu.offsetHeight };
  M.contato = { top: topoDe(fotoContato), h: fotoContato.offsetHeight };
  M.contatoLargura = M.vw > 700 ? Math.min(1065, M.vw * 0.74) : M.vw - 32;
  M.fotos = fotosEmMovimento.map((img) => ({ img, top: topoDe(img.parentElement), h: img.parentElement.offsetHeight }));
  ultimoY = -1;
}

const curso = (m, y) => limitar((y - m.top) / Math.max(1, m.h - M.vh));
const perto = (m, y) => y > m.top - M.vh * 1.2 && y < m.top + m.h + M.vh * 0.2;

/* ---------- o quadro ---------- */
let ultimoY = -1;
let rolado = null;
let abrirNuvensDoCeu = null;

function quadro() {
  pedido = false;
  const y = window.scrollY;
  if (y === ultimoY) return;
  ultimoY = y;
  const { vw, vh } = M;

  const r = y > 40;
  if (r !== rolado) { topo.classList.toggle("is-rolado", r); rolado = r; }
  trilho.style.transform = `scaleY(${(y / M.total).toFixed(4)})`;

  if (menosMovimento) return;

  // abertura: a foto anda mais devagar que a página; o texto sobe e se apaga
  if (y < vh * 1.3) {
    const saida = Math.min(y / (vh * 0.6), 1);
    foto.style.transform = `translate3d(0, ${(y * 0.35).toFixed(1)}px, 0)`;
    conteudo.style.transform = `translate3d(0, ${(-y * 0.18).toFixed(1)}px, 0)`;
    conteudo.style.opacity = (1 - saida).toFixed(3);
    elevacao.style.opacity = (1 - saida).toFixed(3);

    // o domo nasce escondido na base da foto, sobe e cresce até cobrir tudo
    const p = Math.min(Math.max(y / (vh * 0.85), 0), 1);
    const e = p * p * (3 - 2 * p);
    const raio = M.r0 + (M.r1 - M.r0) * Math.pow(e, 2.2);
    const alto = (1 - e) * M.sobe;
    domo.style.transform = `translate3d(0, ${(alto - M.sobe).toFixed(1)}px, 0) scale(${(raio / M.r0).toFixed(4)})`;
    arco.style.transform = `translate3d(-50%, ${(alto + 64 - 50 * M.arcoS).toFixed(1)}px, 0)`;
    arco.style.opacity = Math.max(0, 1 - e * 1.5).toFixed(3);
    miolo.style.opacity = suave(0.45, 0.8, p).toFixed(3);
  } else if (miolo.style.opacity !== "1") {
    miolo.style.opacity = "1";
  }

  // o traçado: a linha corre e a torre sobe andar por andar
  if (perto(M.tracado, y)) {
    const p = curso(M.tracado, y);
    rota.style.strokeDashoffset = (1 - suave(0, 0.8, p)).toFixed(4);
    for (const t of tracosDaTorre) {
      const f = (1 - limitar((p - t.de) / (t.ate - t.de))).toFixed(4);
      if (f !== t.ultimo) { t.el.style.strokeDashoffset = f; t.ultimo = f; }
    }
    for (const pt of pontos) {
      const aceso = p >= pt.em;
      if (aceso !== pt.aceso) { pt.el.classList.toggle("is-aceso", aceso); pt.aceso = aceso; }
    }
  }

  // o céu: as nuvens se abrem sobre a foto
  if (perto(M.ceu, y)) {
    if (!abrirNuvensDoCeu) abrirNuvensDoCeu = criarNuvens(ceuNuvens);
    const p = curso(M.ceu, y);
    abrirNuvensDoCeu(p);
    ceuImagem.style.transform = `scale(${(1.3 - 0.3 * suave(0.08, 0.95, p)).toFixed(4)})`;
    const t = suave(0.6, 0.82, p);
    ceuTexto.style.opacity = t.toFixed(3);
    ceuTexto.style.transform = `translate3d(0, ${((1 - t) * 30).toFixed(1)}px, 0)`;
    ceuPalco.style.setProperty("--fundo", suave(0.78, 1, p).toFixed(3));
  }

  // as fotos se movem dentro da moldura
  for (const f of M.fotos) {
    if (f.top + f.h < y - 100 || f.top > y + vh + 100) continue;
    const rel = (f.top + f.h / 2 - y - vh / 2) / vh;
    f.img.style.translate = `0 ${(-rel * 6).toFixed(2)}%`;
  }

  // contato: a foto entra larga e se recolhe numa moldura (escala, sem recorte)
  const topoContato = M.contato.top - y;
  if (topoContato < vh && topoContato + M.contato.h > 0) {
    const p = suave(0, 1, (vh - topoContato) / (vh * 0.95));
    const k = 1 - (1 - M.contatoLargura / vw) * p;
    fotoContato.style.transform = `scaleX(${k.toFixed(4)})`;
    fotoContatoImg.style.transform = `scaleX(${(1 / k).toFixed(4)}) scale(${(1.18 - 0.18 * p).toFixed(4)})`;
    legendaContato.style.transform = `scaleX(${(1 / k).toFixed(4)})`;
  }
}

let pedido = false;
function pedirQuadro() { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } }

medir();
quadro();
window.addEventListener("scroll", pedirQuadro, { passive: true });
window.addEventListener("resize", () => { medir(); pedirQuadro(); });
window.addEventListener("load", () => { medir(); pedirQuadro(); });
// se a altura da página mudar (fontes, imagens), mede de novo
if ("ResizeObserver" in window) {
  let alturaAntes = 0;
  new ResizeObserver(() => {
    const a = document.documentElement.scrollHeight;
    if (a !== alturaAntes) { alturaAntes = a; medir(); pedirQuadro(); }
  }).observe(document.body);
}

/* ---------- imagens que se revelam ao entrar na tela ---------- */
if (!menosMovimento && "IntersectionObserver" in window) {
  raiz.classList.add("revela-ativo");
  // quem tem o recorte na própria moldura é vigiado pelo bloco em volta,
  // senão o navegador acha que ele nunca entra na tela
  const vigiado = new Map();
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((ent) => {
      if (!ent.isIntersecting) return;
      const alvo = vigiado.get(ent.target) || ent.target;
      const irmaos = [...alvo.parentElement.children];
      const ordem = Math.max(0, irmaos.indexOf(alvo)) % 4;
      alvo.style.transitionDelay = `${ordem * 90}ms`;
      alvo.querySelectorAll("img, .cartao__foto, button").forEach((el) => {
        el.style.transitionDelay = `${ordem * 90}ms`;
      });
      alvo.classList.add("visivel");
      observador.unobserve(ent.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  document.querySelectorAll(".revela").forEach((el) => {
    const quem = el.matches(".contato__imagem") ? el.parentElement : el;
    if (quem !== el) vigiado.set(quem, el);
    observador.observe(quem);
  });
}

/* ---------- menu do celular ---------- */
const menu = document.getElementById("menu");
const abrirMenu = document.getElementById("menu-abrir");
abrirMenu.addEventListener("click", () => {
  const aberto = menu.classList.toggle("is-aberto");
  abrirMenu.setAttribute("aria-expanded", aberto);
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  menu.classList.remove("is-aberto");
  abrirMenu.setAttribute("aria-expanded", "false");
}));

/* ---------- WhatsApp com mensagem pronta ---------- */
document.getElementById("whatsapp").href =
  `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;

/* ---------- galeria em tela cheia ---------- */
const imagens = [...document.querySelectorAll(".mosaico img")];
const tela = document.getElementById("tela-cheia");
const telaImg = document.getElementById("tela-cheia-imagem");
const telaLegenda = document.getElementById("tela-cheia-legenda");
let atual = 0;

function mostrar(indice) {
  atual = (indice + imagens.length) % imagens.length;
  const img = imagens[atual];
  telaImg.src = img.currentSrc || img.src;
  telaImg.alt = img.alt;
  telaLegenda.textContent = `${img.alt} (${atual + 1} de ${imagens.length})`;
  telaImg.style.animation = "none";
  void telaImg.offsetWidth; // reinicia a aproximação suave a cada imagem
  telaImg.style.animation = "";
}

imagens.forEach((img, i) => {
  img.closest("button").addEventListener("click", () => {
    mostrar(i);
    tela.showModal();
  });
});

document.getElementById("tela-cheia-fechar").addEventListener("click", () => tela.close());
document.getElementById("tela-cheia-anterior").addEventListener("click", () => mostrar(atual - 1));
document.getElementById("tela-cheia-proxima").addEventListener("click", () => mostrar(atual + 1));

// Esc fecha (o próprio dialog cuida disso); setas passam
tela.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") mostrar(atual - 1);
  if (e.key === "ArrowRight") mostrar(atual + 1);
});
tela.addEventListener("click", (e) => { if (e.target === tela) tela.close(); });
tela.addEventListener("close", () => imagens[atual].closest("button").focus({ preventScroll: true }));

// arrastar para o lado, no toque
let toqueX = null;
tela.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
tela.addEventListener("touchend", (e) => {
  if (toqueX === null) return;
  const dx = e.changedTouches[0].clientX - toqueX;
  if (Math.abs(dx) > 50) mostrar(dx < 0 ? atual + 1 : atual - 1);
  toqueX = null;
});

/* ---------- formulário ---------- */
const form = document.getElementById("formulario");
const ok = document.getElementById("formulario-ok");
const telefone = document.getElementById("telefone");

// máscara: (12) 90000-0000
telefone.addEventListener("input", () => {
  const d = telefone.value.replace(/\D/g, "").slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  telefone.value = v;
});

const regras = {
  nome: (el) => el.value.trim().length >= 2 || "Escreva o seu nome.",
  telefone: (el) => {
    const n = el.value.replace(/\D/g, "").length;
    return (n === 10 || n === 11) || "Escreva o telefone com DDD, por exemplo (12) 90000-0000.";
  },
  email: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()) || "Escreva um e-mail válido, como nome@exemplo.com.",
  aceite: (el) => el.checked || "Marque o aceite para a equipe poder falar com você.",
};

function validar(id) {
  const el = document.getElementById(id);
  const resultado = regras[id](el);
  const erro = document.getElementById(`${id}-erro`);
  const valido = resultado === true;
  erro.textContent = valido ? "" : resultado;
  el.setAttribute("aria-invalid", valido ? "false" : "true");
  if (!valido) el.setAttribute("aria-describedby", erro.id);
  return valido;
}

Object.keys(regras).forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener(el.type === "checkbox" ? "change" : "blur", () => {
    if (el.getAttribute("aria-invalid") !== null) validar(id);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ids = Object.keys(regras);
  const resultados = ids.map(validar);
  const primeiroErro = ids.find((id, i) => !resultados[i]);
  if (primeiroErro) {
    document.getElementById(primeiroErro).focus();
    return;
  }
  // no treino, não envia de verdade
  form.hidden = true;
  ok.hidden = false;
  ok.focus();
});
