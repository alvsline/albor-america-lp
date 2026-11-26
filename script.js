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
  const ctx = tela.getContext("2d");

  // desenha uma nuvem macia (vários círculos esfumados) num quadro à parte, uma vez só
  function moldeDeNuvem(semente) {
    const t = 256;
    const c = document.createElement("canvas");
    c.width = c.height = t;
    const g = c.getContext("2d");
    const blocos = 9 + Math.floor(semente * 5);
    for (let i = 0; i < blocos; i++) {
      const ang = (i / blocos) * Math.PI * 2 + semente * 3;
      const dist = 30 + Math.random() * 40;
      const x = t / 2 + Math.cos(ang) * dist;
      const y = t / 2 + Math.sin(ang) * dist * 0.6;
      const r = 50 + Math.random() * 40;
      const grad = g.createRadialGradient(x, y - r * 0.15, 0, x, y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, .95)`);
      grad.addColorStop(0.55, `rgba(${COR}, .75)`);
      grad.addColorStop(1, `rgba(${COR}, 0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // miolo cheio, para a nuvem não ficar oca
    const miolo = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t * 0.42);
    miolo.addColorStop(0, `rgba(255, 255, 255, 1)`);
    miolo.addColorStop(0.6, `rgba(${COR}, .6)`);
    miolo.addColorStop(1, `rgba(${COR}, 0)`);
    g.fillStyle = miolo;
    g.fillRect(0, 0, t, t);
    return c;
  }

  let nuvens = [];
  let moldes = [];
  function prepararNuvens() {
    const caixa = tela.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    tela.width = Math.round(caixa.width * dpr);
    tela.height = Math.round(caixa.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = caixa.width, H = caixa.height;
    moldes = [0.1, 0.45, 0.8].map(moldeDeNuvem);

    // um tapete de nuvens cobrindo a tela inteira, maiores perto das bordas
    const quantidade = Math.round(Math.min(90, Math.max(40, (W * H) / 22000)));
    const cx = W / 2, cy = H * 0.45;
    nuvens = Array.from({ length: quantidade }, (_, i) => {
      const x = Math.random() * W * 1.2 - W * 0.1;
      const y = Math.random() * H * 1.2 - H * 0.1;
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      return {
        x, y,
        dirX: dx / d, dirY: dy / d,
        tamanho: Math.max(W, H) * (0.28 + Math.random() * 0.32),
        velocidade: 0.7 + Math.random() * 0.7,
        atraso: Math.random() * 0.25,
        molde: moldes[i % moldes.length],
        giro: Math.random() * Math.PI * 2,
      };
    });
    desenhar(0);
    tela.style.background = "transparent";
  }

  // p vai de 0 (tudo coberto) a 1 (céu aberto)
  function desenhar(p) {
    const W = tela.clientWidth, H = tela.clientHeight;
    ctx.clearRect(0, 0, W, H);
    // fundo liso que some primeiro, deixando só as nuvens
    const fundo = Math.max(0, 1 - p * 3.2);
    if (fundo > 0) {
      ctx.fillStyle = `rgba(${COR}, ${fundo})`;
      ctx.fillRect(0, 0, W, H);
    }
    const alcance = Math.max(W, H) * 1.1;
    for (const n of nuvens) {
      const q = Math.min(1, Math.max(0, (p - n.atraso) / (1 - n.atraso)));
      const anda = q * q * alcance * n.velocidade; // acelera ao abrir, como atravessar a nuvem
      const escala = 1 + q * 1.2;
      const alfa = Math.max(0, 1 - q * 1.15);
      if (alfa <= 0) continue;
      const s = n.tamanho * escala;
      ctx.globalAlpha = alfa;
      ctx.save();
      ctx.translate(n.x + n.dirX * anda, n.y + n.dirY * anda - q * 40);
      ctx.rotate(n.giro);
      ctx.drawImage(n.molde, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function abrirNuvens(duracao) {
    return new Promise((resolver) => {
      let inicio = null;
      const passo = (agora) => {
        if (inicio === null) inicio = agora;
        const t = Math.min((agora - inicio) / duracao, 1);
        const suave = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        desenhar(suave);
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
   Rolagem: foto da abertura em paralaxe, texto saindo,
   o arco que sobe e cresce, e o trilho de progresso.
   ========================================================= */
const topo = document.getElementById("topo");
const foto = document.getElementById("abertura-foto");
const conteudo = document.getElementById("abertura-conteudo");
const elevacao = document.getElementById("elevacao");
const diferenciais = document.getElementById("diferenciais");
const arco = document.getElementById("arco");
const arcoTexto = arco.querySelector("text");
const trilho = document.getElementById("trilho-progresso");

if (!menosMovimento && "CSS" in window && CSS.supports("clip-path", "circle(10px at 50% 50%)")) {
  raiz.classList.add("arco-ativo");
}

let pedido = false;
function aoRolar() {
  pedido = false;
  const y = window.scrollY;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  topo.classList.toggle("is-rolado", y > 40);

  const total = document.documentElement.scrollHeight - vh;
  trilho.style.setProperty("--progresso", total > 0 ? (y / total).toFixed(4) : 0);

  if (menosMovimento) return;

  // a foto anda mais devagar que a página; o texto sobe e se apaga
  if (y < vh * 1.2) {
    foto.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
    const saida = Math.min(y / (vh * 0.6), 1);
    conteudo.style.transform = `translate3d(0, ${-y * 0.18}px, 0)`;
    conteudo.style.opacity = (1 - saida).toFixed(3);
    elevacao.style.opacity = (1 - saida).toFixed(3);
  }

  // o arco: nasce escondido na base da foto, sobe e cresce até cobrir tudo
  if (raiz.classList.contains("arco-ativo")) {
    const sobe = parseFloat(getComputedStyle(diferenciais).marginTop) * -1 || vh * 0.45;
    const p = Math.min(Math.max(y / (vh * 0.85), 0), 1);
    const e = p * p * (3 - 2 * p);
    const r0 = Math.max(vw * 0.62, 300);
    const r1 = Math.hypot(vw, vh) * 3;
    const raio = r0 + (r1 - r0) * Math.pow(e, 2.2);
    const alto = (1 - e) * sobe;            // onde fica o topo do arco, dentro da parte
    diferenciais.style.setProperty("--raio", `${raio}px`);
    diferenciais.style.setProperty("--cy", `${alto + raio}px`);
    diferenciais.classList.toggle("is-aberta", p >= 1);

    // a frase curva acompanha o topo do arco e some à medida que ele cresce
    const largura = Math.max((r0 - 46) * 1000 / 420, 360);
    const s = largura / 1000;
    arco.style.width = `${largura}px`;
    arco.style.height = `${220 * s}px`;
    arco.style.top = `${alto + 64 - 50 * s}px`;
    arcoTexto.style.fontSize = `${(vw < 700 ? 15 : 21) / s}px`;
    arco.style.opacity = Math.max(0, 1 - e * 1.5).toFixed(3);
  }
}

function pedirQuadro() {
  if (!pedido) { pedido = true; requestAnimationFrame(aoRolar); }
}
aoRolar();
window.addEventListener("scroll", pedirQuadro, { passive: true });
window.addEventListener("resize", pedirQuadro);

/* =========================================================
   Galeria: o traçado que desenha a torre, as nuvens que se
   abrem sobre a foto, e as fotos que se movem na moldura.
   ========================================================= */
const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = (a, b, v) => { const t = limitar((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const progressoDoPalco = (el) => {
  const r = el.getBoundingClientRect();
  return limitar(-r.top / Math.max(1, r.height - window.innerHeight));
};

/* ---------- o traçado ---------- */
const tracado = document.getElementById("tracado");
const andares = tracado.querySelector(".torre__andares");
// os 24 andares, desenhados de baixo para cima, como a obra sobe
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
const tracosDaTorre = [...tracado.querySelectorAll(".torre .traco")];
const pontos = [...tracado.querySelectorAll(".ponto")];

// no celular, o desenho se aproxima da torre para ela não ficar miúda
const desenho = tracado.querySelector(".tracado__desenho");
let enquadramento = "";
function enquadrarTracado() {
  const novo = window.innerWidth < 700 ? "500 70 440 450" : "0 0 1440 560";
  if (novo !== enquadramento) { desenho.setAttribute("viewBox", novo); enquadramento = novo; }
}

function desenharTracado() {
  enquadrarTracado();
  const p = menosMovimento ? 1 : progressoDoPalco(tracado);
  rota.style.setProperty("--falta", (1 - suave(0, 0.8, p)).toFixed(4));
  tracosDaTorre.forEach((t) => {
    const de = +t.dataset.de, ate = +t.dataset.ate;
    t.style.setProperty("--falta", (1 - limitar((p - de) / (ate - de))).toFixed(4));
  });
  pontos.forEach((pt) => pt.classList.toggle("is-aceso", p >= +pt.dataset.em));
}

/* ---------- as nuvens ---------- */
const ceu = document.getElementById("ceu");
const ceuNuvens = document.getElementById("ceu-nuvens");
const ceuImagem = document.getElementById("ceu-imagem");
const ceuTexto = document.getElementById("ceu-texto");
let nuvensDoCeu = null;
let baseDoCeu = null;

// desenha uma nuvem de verdade: ruído em camadas, base mais achatada e sombra embaixo
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
    img.data[i] = 255 - sombra * 190;
    img.data[i + 1] = 255 - sombra * 140;
    img.data[i + 2] = 255 - sombra * 100;
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

function montarNuvens() {
  const texturas = [1, 2, 3, 4, 5].map(texturaDeNuvem);
  baseDoCeu = document.createElement("div");
  baseDoCeu.className = "ceu__base";
  ceuNuvens.appendChild(baseDoCeu);
  nuvensDoCeu = [];
  const linhas = 4, colunas = 4;
  for (let l = 0; l < linhas; l++) for (let c = 0; c < colunas; c++) {
    for (let k = 0; k < 2; k++) {
      const el = document.createElement("div");
      el.className = "nuvem";
      el.style.backgroundImage = `url(${texturas[(l * colunas + c + k) % texturas.length]})`;
      ceuNuvens.appendChild(el);
      nuvensDoCeu.push({
        el,
        x: (c + 0.5) / colunas + (Math.random() - 0.5) * 0.18,
        y: (l + 0.5) / linhas + (Math.random() - 0.5) * 0.2,
        tamanho: 0.62 + Math.random() * 0.4,
        velocidade: 0.75 + Math.random() * 0.6,
        espelho: Math.random() < 0.5 ? -1 : 1,
      });
    }
  }
}

function abrirCeu() {
  const r = ceu.getBoundingClientRect();
  if (r.bottom < -50 || r.top > window.innerHeight * 1.5) return; // longe da tela: não gasta nada
  if (!nuvensDoCeu) montarNuvens();
  const p = menosMovimento ? 1 : progressoDoPalco(ceu);
  const W = window.innerWidth, H = window.innerHeight;
  const abre = suave(0.06, 0.78, p);
  baseDoCeu.style.opacity = (1 - suave(0, 0.3, p)).toFixed(3);
  const alcance = Math.max(W, H) * 1.05;
  for (const n of nuvensDoCeu) {
    const w = Math.max(W, 700) * n.tamanho, h = w / 2;
    const cx = n.x * W, cy = n.y * H;
    const dx = n.x - 0.5, dy = (n.y - 0.48) * 0.8;
    const d = Math.hypot(dx, dy) || 0.01;
    const anda = Math.pow(abre, 1.6) * alcance * n.velocidade;
    const escala = 1 + abre * 0.9;
    n.el.style.width = `${w}px`;
    n.el.style.height = `${h}px`;
    n.el.style.transform = `translate3d(${cx - w / 2 + (dx / d) * anda}px, ${cy - h / 2 + (dy / d) * anda - abre * 60}px, 0) scale(${escala * n.espelho}, ${escala})`;
    n.el.style.opacity = (1 - Math.pow(abre, 2.2)).toFixed(3);
  }
  ceuImagem.style.setProperty("--zoom", (1.3 - 0.3 * suave(0.08, 0.95, p)).toFixed(4));
  ceuTexto.style.setProperty("--texto", suave(0.6, 0.82, p).toFixed(3));
  ceu.querySelector(".ceu__palco").style.setProperty("--fundo", suave(0.78, 1, p).toFixed(3));
}

/* ---------- as fotos se movem dentro da moldura ---------- */
const fotosEmMovimento = [...document.querySelectorAll(".cartao__foto img, .mosaico img, .contato__imagem img")];
function moverFotos() {
  if (menosMovimento) return;
  const vh = window.innerHeight;
  for (const img of fotosEmMovimento) {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const rel = (r.top + r.height / 2 - vh / 2) / vh; // -1 em cima, 1 embaixo
    img.style.setProperty("--py", `${(-rel * 6).toFixed(2)}%`);
  }
}

let pedidoGaleria = false;
function quadroGaleria() {
  pedidoGaleria = false;
  desenharTracado();
  abrirCeu();
  moverFotos();
}
const pedirGaleria = () => { if (!pedidoGaleria) { pedidoGaleria = true; requestAnimationFrame(quadroGaleria); } };
quadroGaleria();
window.addEventListener("scroll", pedirGaleria, { passive: true });
window.addEventListener("resize", pedirGaleria);

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
