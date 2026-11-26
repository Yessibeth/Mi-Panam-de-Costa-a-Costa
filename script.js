'use strict';
/* =====================================================================
   RED «Comarcas de Panamá» · Sendero del Saber
   JavaScript puro: sin Supabase, sin login, sin localStorage.
   ===================================================================== */

/* ---------- 1. DATOS (edita aquí las islas) ---------- */
// x, y, w = posición y ancho de cada isla en % (solo escritorio).
const ISLAS = [
  { nombre: 'Isla de las Provincias', emoji: '🗺️', img: 'images/isla-provincias.png', x: 12, y: 8,  w: 22,
    resumen: 'Descubre las provincias de Panamá.' },
  { nombre: 'Isla de las Comarcas',   emoji: '🌿', img: 'images/isla-comarcas.png',   x: 56, y: 0,  w: 22,
    resumen: 'Las comarcas son unidades político-administrativas especiales. ¡En Panamá hay 6!' },
  { nombre: 'Isla de la Cápsula',     emoji: '🎬', img: 'images/isla-capsula.png',    x: 22, y: 54, w: 22,
    resumen: 'Mira un video corto con lo más importante.' },
  { nombre: 'Isla de los Retos',      emoji: '🏆', img: 'images/isla-retos.png',      x: 62, y: 50, w: 22,
    resumen: 'Pon a prueba lo que aprendiste y gana medallas.' }
];

const ANIMOS = [
  '¡Tú puedes lograrlo! ⭐', '¡Sigue explorando, campeón! 💪',
  'Toca las islas para aprender 🏝️', '¡Cada paso cuenta! 🌟'
];

// Orden lineal para los botones Atrás / Siguiente
const SECUENCIA = ['inicio', 'mapa', ...ISLAS.map((_, i) => 'mod' + i), 'creditos'];

const estado = { pos: 0, mudo: false, volumen: 0.7, animo: 0, intro: false };
const $ = id => document.getElementById(id);

/* ---------- 2. NAVEGACIÓN ENTRE PANTALLAS ---------- */
function ir(clave, primera = false) {
  const i = SECUENCIA.indexOf(clave);
  if (i < 0) return;
  estado.pos = i;
  const esMod = clave.startsWith('mod');
  const idPantalla = esMod ? 'pantalla-modulo' : 'pantalla-' + clave;

  document.querySelectorAll('.pantalla').forEach(p => { p.hidden = (p.id !== idPantalla); });
  if (esMod) pintarModulo(Number(clave.slice(3)));

  $('btnAtras').disabled = (i === 0);
  $('btnSiguiente').disabled = (i === SECUENCIA.length - 1);
  $('navInicio').toggleAttribute('aria-current', clave === 'inicio');

  window.scrollTo(0, 0);
  foxyDecir(mensajeFoxy(clave));
  if (clave === 'inicio') ajustarBosque();

  if (!primera) {                       // lleva el foco al título (lectores de pantalla)
    const h = document.querySelector('#' + idPantalla + ' h1, #' + idPantalla + ' h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  if (clave === 'mapa' && !estado.intro) abrirDialogo();   // guía de Foxy la primera vez
}

function mensajeFoxy(clave) {
  if (clave === 'inicio')   return '¡Hola! Soy Foxy. Toca EMPIEZA para explorar las comarcas 🦊';
  if (clave === 'mapa')     return 'Toca una isla para explorar. ¡Tú eliges por dónde empezar!';
  if (clave === 'creditos') return 'Estas son las fuentes que usamos. ¡Gracias por aprender conmigo! 💛';
  return '¡Bienvenida a ' + ISLAS[Number(clave.slice(3))].nombre + '! 🌟';
}

function pintarModulo(i) {
  const m = ISLAS[i];
  $('pantalla-modulo').dataset.isla = i;
  $('moduloEmoji').textContent = m.emoji;
  $('moduloTitulo').textContent = m.nombre;
  $('moduloResumen').textContent = m.resumen;
  const soloArmario = (i === 3);   // en la Isla de los Retos solo se ve el armario
    $('pantalla-modulo').classList.toggle('modo-armario', soloArmario);
  ['moduloEmoji', 'moduloTitulo', 'moduloResumen'].forEach(id => { $(id).style.display = soloArmario ? 'none' : ''; });
  const c = $('moduloContenido');
  if (i === 0) iniciarProvincias(c);
  else if (i === 1) iniciarComarcas(c);
  else if (i === 2) iniciarCapsula(c);
    else if (i === 3) iniciarRetos(c);
  else c.textContent = 'Estamos preparando esta isla. ¡Muy pronto podrás explorarla!';
}

/* ---------- 3. MAPA DE ISLAS ---------- */
function crearIslas() {
  const cont = $('islas');
  ISLAS.forEach((m, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'red-isla';
    b.style.cssText = `--x:${m.x}%;--y:${m.y}%;--w:${m.w}%;--d:${(i * 0.7).toFixed(1)}s`;
    b.innerHTML =
      `<img src="${m.img}" alt="Isla: ${m.nombre}">` +
      `<span class="red-isla-emoji" aria-hidden="true">${m.emoji}</span>` +
      `<span class="red-isla-nombre" aria-hidden="true">${m.nombre}</span>`;
    const img = b.querySelector('img');
    const sinImagen = () => b.classList.add('sin-img');   // nunca un ícono roto
    img.addEventListener('error', sinImagen);
    if (img.complete && img.naturalWidth === 0) sinImagen();
    b.addEventListener('click', () => { sonido('ok'); ir('mod' + i); });
    cont.appendChild(b);
  });
}

/* ---------- 4. FOXY ---------- */
function foxyDecir(texto) {
  if (!$('foxy-text')) return;          // el Foxy flotante ya no existe: solo habla en el diálogo
  $('foxy-text').textContent = texto;
  $('foxy-bubble').classList.remove('hidden');
}
function initFoxy() {
  if (!$('foxy-btn')) return;
  $('foxy-btn').addEventListener('click', () => {
    estado.animo = (estado.animo + 1) % ANIMOS.length;
    foxyDecir(ANIMOS[estado.animo]);
  });
  $('close-foxy').addEventListener('click', () => $('foxy-bubble').classList.add('hidden'));
}

/* ---------- 4b. DIÁLOGO DE FOXY (estilo novela visual) ---------- */
// Edita aquí lo que dice Foxy. Cada línea es una «página» del diálogo.
const GUIA = [
  { img: 'images/foxy/foxy-saluda.png',
    texto: '¡Hola! Soy Foxy, tu guía. Hoy vamos a recorrer Panamá de costa a costa: sus provincias y sus comarcas. 🦊' },
  { img: 'images/foxy/foxy-piensa.png',
    texto: 'En el mapa hay cuatro islas: Provincias, Comarcas, Cápsula (videos) y Retos. Tu meta es ubicar las provincias y las seis comarcas, y conocer su relieve, su vegetación y sus ríos.' },
  { img: 'images/foxy/foxy-bolsillo.png',
    texto: 'Arriba tienes Inicio, Atrás y Siguiente para moverte. Toca ❓ si necesitas ayuda, 🔊 para silenciar y la barra para subir o bajar el volumen.' },
  { img: 'images/foxy/foxy-despide.png',
    texto: 'Toca una isla para empezar. ¡Tú eliges por dónde! 🏝️' }
];

const dlg = { i: 0, timer: null, tecleando: false };

function abrirDialogo() {
  if (!$('dialogo')) { estado.intro = true; return; }   // si falta el diálogo en el HTML, no estorba
  dlg.i = 0;
  $('dialogo').hidden = false;
  document.body.classList.add('dialogo-activo');
  mostrarLinea();
  $('dlgSig').focus();
}
function mostrarLinea() {
  const linea = GUIA[dlg.i], texto = linea.texto, letras = Array.from(texto), el = $('dlgTexto');
  clearInterval(dlg.timer);
  $('dlgLeer').textContent = texto;               // lectores de pantalla: texto completo
  const foxy = $('dlgFoxy');                      // cambia la pose de Foxy
  if (foxy && foxy.getAttribute('src') !== linea.img) foxy.src = linea.img;
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();                     // corta la línea anterior
    if (!estado.mudo) {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-419'; u.volume = estado.volumen;
      speechSynthesis.speak(u);
    }
  }
  const ultima = dlg.i === GUIA.length - 1;
  $('dlgSig').textContent = ultima ? '✔' : '▼';
  $('dlgSig').setAttribute('aria-label', ultima ? 'Empezar a explorar' : 'Continuar');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = texto; dlg.tecleando = false; return;
  }
  let n = 0; el.textContent = ''; dlg.tecleando = true;
  dlg.timer = setInterval(() => {
    n++; el.textContent = letras.slice(0, n).join('');
    if (n >= letras.length) { clearInterval(dlg.timer); dlg.tecleando = false; }
  }, 22);
}
function avanzarDialogo() {
  if (dlg.tecleando) {                            // 1.er toque: completa el texto
    clearInterval(dlg.timer); dlg.tecleando = false;
    $('dlgTexto').textContent = GUIA[dlg.i].texto; return;
  }
  if (dlg.i < GUIA.length - 1) { dlg.i++; mostrarLinea(); } else cerrarDialogo();
}
function cerrarDialogo() {
  clearInterval(dlg.timer);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('dialogo').hidden = true;
  document.body.classList.remove('dialogo-activo');
  estado.intro = true;
  foxyDecir(mensajeFoxy('mapa'));
  const primera = document.querySelector('.red-isla');
  if (primera) primera.focus();
}
function initDialogo() {
  $('dlgSig').addEventListener('click', avanzarDialogo);
  $('dlgTexto').addEventListener('click', avanzarDialogo);
  $('dlgSaltar').addEventListener('click', cerrarDialogo);
  $('dlgEscuchar').addEventListener('click', () => hablar(GUIA[dlg.i].texto));
  document.addEventListener('keydown', e => {
    if ($('dialogo').hidden) return;
    if (e.key === 'Escape') { cerrarDialogo(); return; }
    if (e.key === 'Tab') {                        // mantiene el foco dentro del diálogo
      const bs = ['dlgEscuchar', 'dlgSaltar', 'dlgSig'].map($);
      const k = bs.indexOf(document.activeElement);
      e.preventDefault();
      bs[(k + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
    }
  });
  $('verGuia').addEventListener('click', () => {
    $('dlgAyuda').close();
    if (estado.pos !== 1) { estado.intro = true; ir('mapa'); }
    abrirDialogo();
  });
}

/* ---------- 5. AUDIO (voz + efectos) ---------- */
function hablar(texto) {
  if (!('speechSynthesis' in window)) return;
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }  // 2.º clic = detener
  if (estado.mudo) return;
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'es'; u.volume = estado.volumen;
  speechSynthesis.speak(u);
}

let ctxAudio = null;
function sonido(tipo) {               // 'ok' = acierto, 'error' = fallo (Web Audio API)
  if (estado.mudo || estado.volumen === 0) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctxAudio = ctxAudio || new AC();
  const t = ctxAudio.currentTime;
  (tipo === 'ok' ? [523, 659, 784] : [220, 165]).forEach((f, i) => {
    const o = ctxAudio.createOscillator(), g = ctxAudio.createGain();
    const ini = t + i * 0.12;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(Math.max(0.0001, 0.2 * estado.volumen), ini);
    g.gain.exponentialRampToValueAtTime(0.0001, ini + 0.2);
    o.connect(g); g.connect(ctxAudio.destination);
    o.start(ini); o.stop(ini + 0.22);
  });
}

function initAudio() {
  $('btnMute').addEventListener('click', () => {
    estado.mudo = !estado.mudo;
    if (estado.mudo && 'speechSynthesis' in window) speechSynthesis.cancel();
    $('btnMute').textContent = estado.mudo ? '🔇' : '🔊';
    $('btnMute').setAttribute('aria-pressed', String(estado.mudo));
    $('btnMute').setAttribute('aria-label', estado.mudo ? 'Activar sonido' : 'Silenciar sonido');
  });
  $('volumen').addEventListener('input', e => { estado.volumen = Number(e.target.value); });
}

/* ---------- 6. PARTÍCULAS DEL BOSQUE (hojas y luciérnagas) ---------- */
let ajustarBosque = () => {};
function iniciarBosque() {
  const c = $('forestCanvas'), g = c.getContext('2d');
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, ps = [];

  const nueva = () => ({
    x: Math.random() * W, y: Math.random() * H * 0.7, s: Math.random() * 6 + 2.5,
    vy: Math.random() * 1.1 + 0.5, vx: Math.random() * 1.8 - 0.9,
    a: Math.random() * 6.28, va: Math.random() * 0.04 - 0.02,
    o: Math.random() * 0.65 + 0.35, h: Math.random() < 0.65 ? 85 : 48, luz: Math.random() >= 0.75
  });
  function dibujar(p) {
    g.save(); g.globalAlpha = p.o; g.translate(p.x, p.y); g.rotate(p.a);
    g.beginPath();
    if (p.luz) { g.fillStyle = '#fffb8a'; g.shadowBlur = 18; g.shadowColor = '#ffeb3b'; g.arc(0, 0, p.s * 0.75, 0, 6.283); }
    else { g.fillStyle = `hsl(${p.h},75%,52%)`; g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); }
    g.fill(); g.restore();
  }
  function paso() {
    if (!$('pantalla-inicio').hidden && W > 0) {
      g.clearRect(0, 0, W, H);
      ps.forEach(p => {
        if (!reducido) {
          p.y += p.vy; p.x += p.vx; p.a += p.va; p.vx += Math.sin(p.a) * 0.012;
          if (p.y > H + 30) Object.assign(p, nueva(), { y: -10 });
        }
        dibujar(p);
      });
    }
    if (!reducido) requestAnimationFrame(paso);
  }
  ajustarBosque = () => {
    W = c.width = c.offsetWidth; H = c.height = c.offsetHeight;
    ps = Array.from({ length: innerWidth < 768 ? 50 : 85 }, nueva);
    if (reducido) paso();               // con movimiento reducido: imagen fija
  };
  ajustarBosque();
  if (!reducido) requestAnimationFrame(paso);
  addEventListener('resize', ajustarBosque);
}

/* ---------- 6b. ISLA DE LAS PROVINCIAS ---------- */
// forma = lista de polígonos [x,y] (mapa de 2110 x 880). etq = posición del nombre.
const PROVINCIAS = [
  { nombre: 'Bocas del Toro', capital: 'Bocas del Toro', color: '#81c784', etq: [735, 450],
    dato: 'Es un archipiélago: tiene muchas islas en el mar Caribe.',
    forma: [
      [[310,125],[345,135],[400,150],[445,140],[470,200],[520,300],[580,335],[660,365],[740,395],[830,410],[895,415],[890,455],[915,515],[790,500],[720,500],[650,490],[580,465],[575,425],[520,405],[440,395],[360,365],[330,335],[287,310],[287,160]],
      [[510,205],[540,200],[555,225],[530,240],[510,225]],
      [[560,225],[590,230],[580,270],[555,255]],
      [[640,285],[670,280],[690,310],[705,335],[670,320]]
    ] },
  { nombre: 'Chiriquí', capital: 'David', color: '#90b8d3', etq: [640, 560],
    dato: 'Aquí está el volcán Barú, el punto más alto de Panamá.',
    forma: [[[360,365],[440,395],[520,405],[575,425],[580,465],[650,490],[720,500],[790,500],[787,560],[775,625],[745,650],[745,695],[715,665],[640,635],[560,625],[520,600],[470,605],[430,590],[350,600],[310,665],[300,670],[295,620],[245,575],[290,520],[300,470],[290,430],[305,385]]] },
  { nombre: 'Veraguas', capital: 'Santiago', color: '#ffc947', etq: [930, 600],
    dato: 'Aquí está la isla Coiba, un parque nacional muy famoso.',
    forma: [[[895,420],[960,395],[1010,385],[1075,430],[1060,470],[1020,490],[1040,540],[1080,590],[1065,640],[1050,650],[1020,690],[1000,730],[985,770],[1015,810],[1065,855],[1075,930],[1100,965],[1090,972],[990,968],[975,930],[950,860],[900,805],[850,805],[800,800],[760,765],[748,700],[745,660],[775,625],[787,560],[790,500],[915,515],[890,455]]] },
  { nombre: 'Coclé', capital: 'Penonomé', color: '#e0776d', etq: [1150, 525],
    dato: 'Aquí está El Valle de Antón, un pueblo dentro del cráter de un antiguo volcán.',
    forma: [[[1060,470],[1075,430],[1128,372],[1190,360],[1250,330],[1270,400],[1285,480],[1300,555],[1240,590],[1200,615],[1150,655],[1065,640],[1080,590],[1040,540],[1020,490]]] },
  { nombre: 'Colón', capital: 'Colón', color: '#b5ad52', etq: [1185, 335],
    dato: 'Aquí está la entrada del Canal de Panamá por el mar Caribe.',
    forma: [[[1010,385],[1060,340],[1130,315],[1200,300],[1250,262],[1300,230],[1340,215],[1380,195],[1410,160],[1440,130],[1500,155],[1560,195],[1620,190],[1640,140],[1645,185],[1600,215],[1530,225],[1470,235],[1420,260],[1390,290],[1340,315],[1290,335],[1250,330],[1190,360],[1128,372],[1075,430]]] },
  { nombre: 'Panamá Oeste', capital: 'La Chorrera', color: '#7fd1c4', etq: [1350, 430], lineas: ['Panamá', 'Oeste'], fs: 28,
    dato: 'Es la provincia más nueva: se creó en el año 2014.',
    forma: [[[1250,330],[1290,335],[1340,315],[1390,290],[1430,300],[1475,330],[1480,360],[1445,385],[1415,420],[1405,470],[1395,495],[1345,515],[1320,545],[1300,555],[1285,480],[1270,400]]] },
  { nombre: 'Panamá', capital: 'Panamá', color: '#94d6cf', etq: [1700, 305], fs: 40,
    dato: 'Aquí está la ciudad de Panamá, la capital del país.',
    forma: [[[1390,290],[1420,260],[1470,235],[1530,225],[1600,215],[1645,185],[1700,195],[1770,225],[1855,255],[1950,300],[1995,340],[1950,365],[1900,390],[1860,400],[1850,440],[1855,500],[1870,540],[1850,505],[1800,470],[1750,420],[1700,402],[1640,392],[1580,382],[1520,372],[1480,362],[1475,330],[1430,300]]] },
  { nombre: 'Darién', capital: 'La Palma', color: '#fff59d', etq: [2060, 650], fs: 40,
    dato: 'Es la provincia más grande de Panamá y tiene mucha selva.',
    forma: [[[1995,340],[1950,365],[1900,390],[1860,400],[1850,440],[1855,500],[1880,540],[1900,600],[1870,680],[1900,720],[1950,770],[1990,830],[2040,900],[2070,950],[2090,900],[2130,850],[2180,820],[2230,760],[2270,720],[2320,700],[2270,600],[2210,520],[2205,485],[2190,478],[2110,430],[2030,370]]] },
  { nombre: 'Herrera', capital: 'Chitré', color: '#f7b199', etq: [1075, 745], fs: 26,
    dato: 'Está en la península de Azuero y es una de las provincias más pequeñas.',
    forma: [[[1050,650],[1150,655],[1180,690],[1130,740],[1110,790],[1115,810],[1065,855],[1015,810],[985,770],[1000,730],[1020,690]]] },
  { nombre: 'Los Santos', capital: 'Las Tablas', color: '#d4e157', etq: [1180, 855], lineas: ['Los', 'Santos'], fs: 30,
    dato: 'En La Villa de Los Santos se dio el Grito de Independencia de 1821.',
    forma: [[[1180,690],[1210,705],[1260,780],[1310,845],[1320,880],[1250,900],[1180,930],[1100,965],[1075,930],[1065,855],[1115,810],[1110,790],[1130,740]]] }
];

// Adorno: se ve pero no se toca
const DECO = [
  { color: '#fcd9b6', forma: [[[230,110],[310,120],[287,160],[287,310],[360,365],[305,385],[290,430],[300,470],[290,520],[245,575],[295,620],[300,680],[230,700]]] },
  { color: '#fcd9b6', forma: [[[2245,450],[2205,485],[2210,520],[2270,600],[2320,700],[2270,720],[2230,760],[2180,820],[2130,850],[2090,880],[2070,950],[2070,990],[2340,990],[2340,450]]] },
  { color: '#2bbfa0', forma: [[[1640,140],[1700,150],[1760,185],[1850,215],[1950,260],[2040,330],[2120,395],[2200,440],[2245,450],[2215,485],[2190,478],[2110,430],[2030,370],[1950,300],[1855,255],[1770,225],[1700,195],[1645,185]]] },
  { color: '#d2b48c', forma: [[[660,840],[700,830],[730,850],[720,890],[750,925],[720,935],[690,900],[655,880]]] },
  { color: '#fff59d', forma: [[[1680,535],[1715,530],[1730,560],[1710,610],[1685,600]],[[1625,545],[1640,550],[1635,570]]] }
];
const pm = { modo: 'explorar', cola: [], n: 0, aciertos: 0, fallo: false };
const mezclar = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

function mostrarFoxy(html) {
  $('provCaja').innerHTML =
    '<img src="images/foxy.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'prov-emoji\',textContent:\'🦊\'}))">' +
    '<div>' + html + '</div>';
}

function iniciarProvincias(cont) {
  cont.innerHTML =
    '<div class="prov-tabs">' +
      '<button type="button" data-modo="explorar">Explorar</button>' +
      '<button type="button" data-modo="donde">📍 ¿Dónde está?</button>' +
      '<button type="button" data-modo="capitales">🏙️ Capitales</button>' +
    '</div>' +
    '<div class="prov-mapa" id="provMapa"></div>' +
    '<div class="prov-caja" id="provCaja" aria-live="polite"></div>';

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  };
  const trazo = formas => formas.map(f => 'M' + f.map(p => p.join(',')).join('L') + 'Z').join('');

  const svg = mk('svg', { viewBox: '230 110 2110 880', role: 'group', 'aria-label': 'Mapa de Panamá' });
  svg.appendChild(mk('rect', { x: 230, y: 110, width: 2110, height: 880, fill: '#d9f1fa' }));
  DECO.forEach(d => {
    const p = mk('path', { d: trazo(d.forma), fill: d.color, stroke: '#0a1428', 'stroke-width': 2, 'aria-hidden': 'true' });
    svg.appendChild(p);
  });

  PROVINCIAS.forEach(p => {
    const g = mk('g', { class: 'prov', tabindex: '0', role: 'button', 'aria-label': p.nombre });
    g.appendChild(mk('path', { d: trazo(p.forma), fill: p.color }));
    const t = mk('text', { class: 'etq', 'text-anchor': 'middle', 'font-size': p.fs || 32 });
    (p.lineas || [p.nombre]).forEach((txt, i) => {
      const s = mk('tspan', { x: p.etq[0], y: p.etq[1] + i * ((p.fs || 32) + 4) });
      s.textContent = txt;
      t.appendChild(s);
    });
    g.appendChild(t);
    g.addEventListener('click', () => tocarProvincia(p, g));
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocarProvincia(p, g); }
    });
    svg.appendChild(g);
  });
  $('provMapa').appendChild(svg);

  cont.querySelectorAll('[data-modo]').forEach(t =>
    t.addEventListener('click', () => cambiarModo(t.dataset.modo)));
  cambiarModo('explorar');
}

function cambiarModo(m) {
  pm.modo = m;
  document.querySelectorAll('.prov-tabs button').forEach(t =>
    t.classList.toggle('activo', t.dataset.modo === m));
  const mapa = $('provMapa');
  mapa.hidden = (m === 'capitales');
  mapa.classList.toggle('sin-nombres', m === 'donde');
  mapa.querySelectorAll('.prov').forEach(b => b.classList.remove('ok', 'mal'));
  if (m === 'explorar') {
    mostrarFoxy('<h3>¡Toca una provincia!</h3><p>Te cuento su capital y un dato curioso.</p>');
  } else {
    pm.cola = mezclar(PROVINCIAS); pm.n = 0; pm.aciertos = 0; pm.fallo = false;
    siguientePregunta();
  }
}

function tocarProvincia(p, b) {
  if (pm.modo === 'explorar') {
     sonido('ok');
    abrirFicha(p);
    return;
  }
  if (pm.modo !== 'donde' || pm.n >= PROVINCIAS.length) return;
  if (p === pm.cola[pm.n]) {
    sonido('ok');
   if (!pm.fallo) { pm.aciertos++; ganarPuntos(2); }
    b.classList.add('ok');
    pm.n++; pm.fallo = false;
    siguientePregunta();
  } else {
    sonido('error');
    pm.fallo = true;
    b.classList.add('mal');
    setTimeout(() => b.classList.remove('mal'), 600);
  }
}

function siguientePregunta() {
  if (pm.n >= PROVINCIAS.length) { finJuego(); return; }
  if (pm.modo === 'donde') {
    mostrarFoxy('<h3>¿Dónde está ' + pm.cola[pm.n].nombre + '?</h3><p>Aciertos: ' + pm.aciertos + ' de ' + PROVINCIAS.length + '</p>');
  } else {
    preguntaCapital();
  }
}

function preguntaCapital() {
  const p = pm.cola[pm.n];
  const otras = mezclar(PROVINCIAS.filter(x => x.capital !== p.capital)).slice(0, 3).map(x => x.capital);
  const ops = mezclar([p.capital, ...otras]);
  mostrarFoxy(
    '<h3>¿Cuál es la capital de ' + p.nombre + '?</h3>' +
    '<div class="prov-ops">' + ops.map(o => '<button type="button" class="btn-gold" data-cap="' + o + '">' + o + '</button>').join('') + '</div>' +
    '<p>Aciertos: ' + pm.aciertos + ' de ' + PROVINCIAS.length + '</p>');
  $('provCaja').querySelectorAll('[data-cap]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.cap === p.capital) {
      sonido('ok');
if (!pm.fallo) { pm.aciertos++; ganarPuntos(2); }
      pm.n++; pm.fallo = false;
      siguientePregunta();
    } else {
      sonido('error');
      pm.fallo = true;
      b.disabled = true;
    }
  }));
}

function finJuego() {
  const t = PROVINCIAS.length;
  const msg = pm.aciertos >= 8 ? '¡Excelente, explorador! 🏆'
            : pm.aciertos >= 5 ? '¡Muy bien! Sigue practicando 💪'
            : '¡Buen intento! Inténtalo otra vez 🌟';
  mostrarFoxy('<h3>' + msg + '</h3><p>Acertaste ' + pm.aciertos + ' de ' + t + ' a la primera.</p>' +
    '<button type="button" class="btn-gold" id="provOtra">🔄 Jugar otra vez</button>');
  $('provOtra').addEventListener('click', () => cambiarModo(pm.modo));
}

/* ---------- 6c. FICHA DE PROVINCIA (ventana emergente) ---------- */
// Edita aquí la información de cada provincia. [emoji, texto]
const FICHAS = {
  'Bocas del Toro': [
    ['🏝️', 'Es un archipiélago en el mar Caribe, con muchas islas.'],
    ['🌴', 'Es famosa por sus playas, su vida marina y el cultivo de banano.'],
    ['🏞️', 'Comparte con Chiriquí el Parque Internacional La Amistad.']
  ],
  'Chiriquí': [
    ['🌋', 'Aquí está el volcán Barú, el punto más alto de Panamá.'],
    ['☕', 'Boquete es muy conocido por su café y sus tierras altas.'],
    ['🇨🇷', 'Es la provincia que limita con Costa Rica.']
  ],
  'Veraguas': [
    ['🐢', 'Aquí está la isla Coiba, un parque nacional reconocido por la UNESCO.'],
    ['🌊', 'Tiene costas en el mar Caribe y en el océano Pacífico.'],
    ['⛰️', 'Su capital, Santiago, es un punto clave en el camino hacia el interior.']
  ],
  'Coclé': [
    ['🌄', 'El Valle de Antón está dentro del cráter de un antiguo volcán.'],
    ['🏺', 'En Sitio Conte se encontraron tesoros de culturas indígenas antiguas.'],
    ['🏖️', 'Tiene playas en el Pacífico, como Farallón.']
  ],
  'Colón': [
    ['🚢', 'Aquí está la entrada del Canal de Panamá por el mar Caribe.'],
    ['🏰', 'Portobelo guarda fortificaciones coloniales declaradas Patrimonio de la Humanidad.'],
    ['🛍️', 'Aquí funciona la Zona Libre de Colón, un centro de comercio.']
  ],
  'Panamá Oeste': [
    ['🎉', 'Es la provincia más nueva: comenzó a funcionar en 2014.'],
    ['🏙️', 'Su capital es La Chorrera.'],
    ['🗺️', 'Tiene cinco distritos: Arraiján, Capira, Chame, La Chorrera y San Carlos.']
  ],
  'Panamá': [
    ['🏙️', 'Aquí está la ciudad de Panamá, la capital del país.'],
    ['🚢', 'Aquí está la entrada del Canal por el océano Pacífico.'],
    ['🏛️', 'Tiene el Casco Antiguo y Panamá Viejo, lugares muy históricos.']
  ],
  'Darién': [
    ['🌳', 'Es la provincia más grande de Panamá y tiene mucha selva.'],
    ['🦜', 'El Parque Nacional Darién es Patrimonio de la Humanidad.'],
    ['🛶', 'Allí viven pueblos indígenas como los emberá y los wounaan.']
  ],
  'Herrera': [
    ['🏺', 'En La Arena, cerca de Chitré, se hace cerámica tradicional.'],
    ['🎶', 'Está en la península de Azuero, tierra de folclor y tradiciones.'],
    ['📏', 'Es una de las provincias más pequeñas del país.']
  ],
  'Los Santos': [
    ['📜', 'En La Villa de Los Santos se dio el Grito de Independencia de 1821.'],
    ['🎭', 'Las Tablas es famosa por sus Carnavales.'],
    ['🏄', 'Tiene playas muy conocidas, como Playa Venao.']
  ]
};

function abrirFicha(p) {
  let d = $('fichaProv');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'fichaProv';
    d.className = 'ficha';
    d.addEventListener('click', e => { if (e.target === d) d.close(); });   // clic fuera = cerrar
    document.body.appendChild(d);
  }
  const slug = p.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
  const datos = (FICHAS[p.nombre] || []).map(f => '<li>' + f[0] + ' ' + f[1] + '</li>').join('');
  d.setAttribute('aria-label', p.nombre);
  d.innerHTML =
    '<button type="button" class="ficha-x" aria-label="Cerrar">✕</button>' +
    '<img class="ficha-img" src="images/provincias/' + slug + '.jpg" alt="Foto de ' + p.nombre + '">' +
    '<div class="ficha-cuerpo">' +
      '<h2>' + p.nombre + '</h2>' +
      '<p class="ficha-capital">📍 Capital: ' + p.capital + '</p>' +
      '<ul class="ficha-lista">' + datos + '</ul>' +
      '<div class="ficha-foxy">' +
        '<img src="images/foxy.png" alt="">' +
        '<div><strong>Dato curioso de Foxy</strong><p>' + p.dato + '</p></div>' +
      '</div>' +
      '<div class="red-centro"><button type="button" class="btn-gold ficha-cerrar">Seguir explorando</button></div>' +
    '</div>';

  // Si la foto no existe, se muestra un bloque de color de la provincia (nunca un ícono roto)
  const img = d.querySelector('.ficha-img');
  img.addEventListener('error', () => {
    const v = document.createElement('div');
    v.className = 'ficha-img-vacia';
    v.style.background = p.color;
    v.textContent = '🏞️';
    img.replaceWith(v);
  });
  const fox = d.querySelector('.ficha-foxy img');
  fox.addEventListener('error', () => fox.remove());

  d.querySelector('.ficha-x').addEventListener('click', () => d.close());
  d.querySelector('.ficha-cerrar').addEventListener('click', () => d.close());
  d.showModal();
  d.scrollTop = 0;
}
/* ---------- 6d. ISLA DE LAS COMARCAS ---------- */
// forma = polígonos sobre el mismo mapa de las provincias. etq = posiciones del nombre.
// ficha = datos de la ventana emergente (edítalos con tu libro del MEDUCA).
const COMARCAS = [
  { nombre: 'Guna Yala', capital: 'El Porvenir', color: '#ef5350', etq: [[2035, 345]], fs: 26,
    dato: 'Las mujeres gunas hacen las molas, telas de colores con dibujos muy bonitos.',
    forma: DECO[2].forma,
    ficha: { creacion: 'Reserva en 1938 y comarca en 1953 (la primera de Panamá)', pueblo: 'Guna', idioma: 'Guna (dulegaya)',
      relieve: 'Una franja angosta con montañas bajas (serranía de San Blas) y más de 300 islas en el Caribe',
      vegetacion: 'Bosque húmedo tropical, manglares y palmas de coco',
      rios: 'Ríos cortos que bajan de la serranía hacia el mar Caribe' } },
  { nombre: 'Emberá-Wounaan', capital: 'Unión Chocó', color: '#ffa726', etq: [[2050, 495], [1985, 720]], lineas: ['Emberá-', 'Wounaan'], fs: 28,
    dato: 'Los emberá y los wounaan tejen canastas con fibras de palma. ¡Cada una es una obra de arte!',
    forma: [
      [[1985,420],[2060,400],[2120,450],[2150,500],[2100,560],[2020,570],[1960,520]],
      [[1900,640],[1980,620],[2050,660],[2070,730],[2030,800],[1980,790],[1945,745],[1895,690]]
    ],
    ficha: { creacion: '1983', pueblo: 'Emberá y Wounaan', idioma: 'Emberá y wounaan',
      relieve: 'Llanuras y colinas bajas. Tiene dos áreas separadas: Cémaco y Sambú',
      vegetacion: 'Selva tropical húmeda y manglares en la costa del Pacífico',
      rios: 'Río Sambú y otros ríos que sirven de «caminos» para viajar en piragua' } },
  { nombre: 'Ngäbe-Buglé', capital: 'Chichica', color: '#66bb6a', etq: [[690, 462]], fs: 34,
    dato: 'Es la comarca más grande de Panamá y está en tres provincias: Bocas del Toro, Chiriquí y Veraguas.',
    forma: [[[430,330],[520,320],[600,350],[700,390],[830,420],[895,450],[890,500],[790,530],[720,540],[650,530],[580,510],[520,480],[470,440],[430,400]]],
    ficha: { creacion: '1997', pueblo: 'Ngäbe y Buglé', idioma: 'Ngäbere y buglere',
      relieve: 'Montañoso: forma parte de la cordillera Central, con cerros y valles',
      vegetacion: 'Bosque húmedo tropical y bosque de montaña',
      rios: 'Tabasará y Cricamola' } },
  { nombre: 'Madungandí', capital: 'Akua Yala', color: '#ab47bc', etq: [[1785, 372]], fs: 20,
    dato: 'Es una comarca guna, pero no está en la costa como Guna Yala: está tierra adentro.',
    forma: [[[1730,330],[1800,345],[1830,390],[1790,395],[1740,375]]],
    ficha: { creacion: '1996', pueblo: 'Guna', idioma: 'Guna',
      relieve: 'Colinas y llanuras alrededor del lago Bayano',
      vegetacion: 'Selva tropical húmeda',
      rios: 'Río Bayano y lago Bayano' } },
  { nombre: 'Wargandí', capital: 'Nurra', color: '#26c6da', etq: [[1862, 308]], fs: 20,
    dato: 'Es una de las comarcas más pequeñas y se creó en el año 2000.',
    forma: [[[1830,270],[1880,285],[1900,325],[1860,335],[1825,310]]],
    ficha: { creacion: '2000', pueblo: 'Guna', idioma: 'Guna',
      relieve: 'Colinas y selva en el este de la provincia de Panamá',
      vegetacion: 'Selva tropical húmeda',
      rios: 'Ríos de la cuenca del Chucunaque' } },
  { nombre: 'Naso Tjër Di', capital: 'Sieyic', color: '#fdd835', etq: [[385, 268]], lineas: ['Naso', 'Tjër Di'], fs: 22,
    dato: 'El pueblo naso tiene un rey que lo representa.',
    forma: [[[330,220],[400,215],[440,250],[430,310],[370,330],[325,300]]],
    ficha: { creacion: '2020 (la más reciente)', pueblo: 'Naso', idioma: 'Naso',
      relieve: 'Montañas y valles cerca de la cordillera de Talamanca',
      vegetacion: 'Bosque tropical húmedo, junto al Parque Internacional La Amistad',
      rios: 'Río Teribe (Tjër Di)' } }
];

// Preguntas del reto: [pregunta, respuesta correcta, [respuestas incorrectas]]
const RETOS_COM = [
  ['¿Cuál es la comarca más grande de Panamá?', 'Ngäbe-Buglé', ['Guna Yala', 'Wargandí', 'Madungandí']],
  ['¿Qué comarca está en el mar Caribe y tiene más de 300 islas?', 'Guna Yala', ['Ngäbe-Buglé', 'Naso Tjër Di', 'Emberá-Wounaan']],
  ['¿En qué provincia está la comarca Emberá-Wounaan?', 'Darién', ['Chiriquí', 'Colón', 'Herrera']],
  ['¿Qué río da nombre a la comarca Naso Tjër Di?', 'Teribe', ['Chagres', 'Tabasará', 'Bayano']],
  ['¿Cuál fue la primera comarca que se creó?', 'Guna Yala', ['Ngäbe-Buglé', 'Naso Tjër Di', 'Wargandí']],
  ['¿Cuál es la comarca más reciente?', 'Naso Tjër Di', ['Guna Yala', 'Madungandí', 'Emberá-Wounaan']],
  ['¿Qué río cruza la comarca Ngäbe-Buglé?', 'Tabasará', ['Bayano', 'Chagres', 'Teribe']],
  ['¿Cerca de qué lago está la comarca Madungandí?', 'Lago Bayano', ['Lago Gatún', 'Lago Alajuela', 'Lago Barú']],
  ['¿Cómo es la vegetación de la comarca Emberá-Wounaan?', 'Selva tropical húmeda', ['Desierto', 'Sabana seca', 'Páramo de alta montaña']]
];

const cm = { modo: 'explorar', cola: [], n: 0, aciertos: 0, fallo: false, retos: [] };

function mostrarCom(html) {
  $('comCaja').innerHTML =
    '<img src="images/foxy.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'prov-emoji\',textContent:\'🦊\'}))">' +
    '<div>' + html + '</div>';
}

function iniciarComarcas(cont) {
  cont.innerHTML =
    '<div class="prov-tabs">' +
      '<button type="button" data-modo="explorar">Explorar</button>' +
      '<button type="button" data-modo="donde">📍 ¿Dónde está?</button>' +
      '<button type="button" data-modo="retos">🏆 Retos</button>' +
    '</div>' +
    '<div class="prov-mapa" id="comMapa"></div>' +
    '<div class="prov-caja" id="comCaja" aria-live="polite"></div>';

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    return e;
  };
  const trazo = formas => formas.map(f => 'M' + f.map(p => p.join(',')).join('L') + 'Z').join('');

  const svg = mk('svg', { viewBox: '230 110 2110 880', role: 'group', 'aria-label': 'Mapa de las comarcas de Panamá' });
  svg.appendChild(mk('rect', { x: 230, y: 110, width: 2110, height: 880, fill: '#d9f1fa' }));
  DECO.forEach((d, i) => {                       // el adorno 2 es Guna Yala: ahora es una comarca
    if (i === 2) return;
    svg.appendChild(mk('path', { d: trazo(d.forma), fill: d.color, stroke: '#0a1428', 'stroke-width': 2, 'aria-hidden': 'true' }));
  });
  PROVINCIAS.forEach(p =>                        // provincias de fondo, en gris claro
    svg.appendChild(mk('path', { d: trazo(p.forma), fill: '#e4e9ee', stroke: '#9fb0c0', 'stroke-width': 2, 'aria-hidden': 'true' })));

  COMARCAS.forEach(c => {
    const g = mk('g', { class: 'prov', tabindex: '0', role: 'button', 'aria-label': c.nombre });
    g.appendChild(mk('path', { d: trazo(c.forma), fill: c.color }));
    c.etq.forEach(pos => {
      const t = mk('text', { class: 'etq', 'text-anchor': 'middle', 'font-size': c.fs || 28 });
      (c.lineas || [c.nombre]).forEach((txt, i) => {
        const s = mk('tspan', { x: pos[0], y: pos[1] + i * ((c.fs || 28) + 4) });
        s.textContent = txt;
        t.appendChild(s);
      });
      g.appendChild(t);
    });
    g.addEventListener('click', () => tocarComarca(c, g));
    g.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocarComarca(c, g); }
    });
    svg.appendChild(g);
  });
  $('comMapa').appendChild(svg);

  cont.querySelectorAll('[data-modo]').forEach(t =>
    t.addEventListener('click', () => cambiarModoCom(t.dataset.modo)));
  cambiarModoCom('explorar');
}

function cambiarModoCom(m) {
  cm.modo = m;
  document.querySelectorAll('#moduloContenido .prov-tabs button').forEach(t =>
    t.classList.toggle('activo', t.dataset.modo === m));
  const mapa = $('comMapa');
  mapa.hidden = (m === 'retos');
  mapa.classList.toggle('sin-nombres', m === 'donde');
  mapa.querySelectorAll('.prov').forEach(b => b.classList.remove('ok', 'mal'));
  cm.n = 0; cm.aciertos = 0; cm.fallo = false;
  if (m === 'explorar') {
    mostrarCom('<h3>¡Toca una comarca!</h3><p>Te cuento quiénes viven allí, cómo es su relieve, su vegetación y sus ríos.</p>');
  } else if (m === 'donde') {
    cm.cola = mezclar(COMARCAS);
    siguientePreguntaCom();
  } else {
    cm.retos = mezclar(RETOS_COM).slice(0, 6);
    siguientePreguntaCom();
  }
}

function tocarComarca(c, b) {
  if (cm.modo === 'explorar') { sonido('ok'); abrirFichaComarca(c); return; }
  if (cm.modo !== 'donde' || cm.n >= COMARCAS.length) return;
  if (c === cm.cola[cm.n]) {
    sonido('ok');
  if (!cm.fallo) { cm.aciertos++; ganarPuntos(2); }
    b.classList.add('ok');
    cm.n++; cm.fallo = false;
    siguientePreguntaCom();
  } else {
    sonido('error');
    cm.fallo = true;
    b.classList.add('mal');
    setTimeout(() => b.classList.remove('mal'), 600);
  }
}

function siguientePreguntaCom() {
  const total = cm.modo === 'donde' ? COMARCAS.length : cm.retos.length;
  if (cm.n >= total) { finJuegoCom(total); return; }
  if (cm.modo === 'donde') {
    mostrarCom('<h3>¿Dónde está ' + cm.cola[cm.n].nombre + '?</h3><p>Aciertos: ' + cm.aciertos + ' de ' + total + '</p>');
    return;
  }
  const r = cm.retos[cm.n];
  const ops = mezclar([r[1], ...r[2]]);
  mostrarCom(
    '<h3>' + r[0] + '</h3>' +
    '<div class="prov-ops">' + ops.map(o => '<button type="button" class="btn-gold" data-op="' + o + '">' + o + '</button>').join('') + '</div>' +
    '<p>Pregunta ' + (cm.n + 1) + ' de ' + total + ' · Aciertos: ' + cm.aciertos + '</p>');
  $('comCaja').querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.op === r[1]) {
      sonido('ok');
  if (!cm.fallo) { cm.aciertos++; ganarPuntos(2); }
      cm.n++; cm.fallo = false;
      siguientePreguntaCom();
    } else {
      sonido('error');
      cm.fallo = true;
      b.disabled = true;
    }
  }));
}

function finJuegoCom(total) {
  const f = cm.aciertos / total;
  const msg = f >= 0.8 ? '¡Excelente, explorador! 🏆'
            : f >= 0.5 ? '¡Muy bien! Sigue practicando 💪'
            : '¡Buen intento! Inténtalo otra vez 🌟';
  mostrarCom('<h3>' + msg + '</h3><p>Acertaste ' + cm.aciertos + ' de ' + total + ' a la primera.</p>' +
    '<button type="button" class="btn-gold" id="comOtra">🔄 Jugar otra vez</button>');
  $('comOtra').addEventListener('click', () => cambiarModoCom(cm.modo));
}

function abrirFichaComarca(c) {
  let d = $('fichaProv');
  if (!d) {
    d = document.createElement('dialog');
    d.id = 'fichaProv';
    d.className = 'ficha';
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    document.body.appendChild(d);
  }
  const slug = c.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
  const f = c.ficha;
  const filas = [
    ['📅', 'Creación: ' + f.creacion],
    ['👥', 'Pueblo: ' + f.pueblo],
    ['🗣️', 'Idioma: ' + f.idioma],
    ['⛰️', 'Relieve: ' + f.relieve],
    ['🌳', 'Vegetación: ' + f.vegetacion],
    ['🌊', 'Ríos: ' + f.rios]
  ].map(x => '<li>' + x[0] + ' ' + x[1] + '</li>').join('');
  d.setAttribute('aria-label', c.nombre);
  d.innerHTML =
    '<button type="button" class="ficha-x" aria-label="Cerrar">✕</button>' +
    '<img class="ficha-img" src="images/comarcas/' + slug + '.jpg" alt="Foto de la comarca ' + c.nombre + '">' +
    '<div class="ficha-cuerpo">' +
      '<h2>' + c.nombre + '</h2>' +
      '<p class="ficha-capital">📍 Capital: ' + c.capital + '</p>' +
      '<ul class="ficha-lista">' + filas + '</ul>' +
      '<div class="ficha-foxy">' +
        '<img src="images/foxy.png" alt="">' +
        '<div><strong>Dato curioso de Foxy</strong><p>' + c.dato + '</p></div>' +
      '</div>' +
      '<div class="red-centro"><button type="button" class="btn-gold ficha-cerrar">Seguir explorando</button></div>' +
    '</div>';

  const img = d.querySelector('.ficha-img');
  img.addEventListener('error', () => {
    const v = document.createElement('div');
    v.className = 'ficha-img-vacia';
    v.style.background = c.color;
    v.textContent = '🌿';
    img.replaceWith(v);
  });
  const fox = d.querySelector('.ficha-foxy img');
  fox.addEventListener('error', () => fox.remove());

  d.querySelector('.ficha-x').addEventListener('click', () => d.close());
  d.querySelector('.ficha-cerrar').addEventListener('click', () => d.close());
  d.showModal();
  d.scrollTop = 0;
}
/* ---------- 6e. ISLA DE LA CÁPSULA ---------- */
const CAPSULA = { subtitulo: 'Cápsula de aprendizaje' };

// Un elemento por video. Cambia el título y pega el código en videoId
// (lo que va después de v= en el enlace de YouTube).
const CAPSULAS = [
{ titulo: 'Video 1', videoId: 'C3vBX4JQ6n4' },
{ titulo: 'Video 2', videoId: 'mOXTpHuEfS0' },
{ titulo: 'Video 3', videoId: 'AzlNrwwpuCQ' }
];

// Ideas clave que salen debajo del video: [emoji, texto]
const CAPSULA_IDEAS = [
  ['🌿', 'Panamá tiene 6 comarcas indígenas.'],
  ['📏', 'La comarca más grande es la Ngäbe-Buglé.'],
  ['🏝️', 'Guna Yala fue la primera comarca (1953) y está en el mar Caribe.'],
  ['👥', 'Cada comarca tiene sus pueblos, sus idiomas y sus tradiciones.']
];

function iniciarCapsula(cont) {
  cont.innerHTML =
    '<p class="red-sub">' + CAPSULA.subtitulo + '</p>' +
    '<div class="prov-tabs" id="capTabs">' +
      CAPSULAS.map((v, i) => '<button type="button" data-v="' + i + '">🎬 ' + (i + 1) + '. ' + v.titulo + '</button>').join('') +
    '</div>' +
    '<div id="capVideo"></div>' +
    '<div class="red-guia-grid">' +
      CAPSULA_IDEAS.map(i => '<div class="red-card">' + i[0] + ' ' + i[1] + '</div>').join('') +
    '</div>' +
    '<div class="prov-caja" id="capCaja" aria-live="polite"></div>';

  cont.querySelectorAll('[data-v]').forEach(b =>
    b.addEventListener('click', () => mostrarVideo(Number(b.dataset.v))));
  mostrarVideo(0);
  preguntaCapsula();
}

function mostrarVideo(i) {
  const v = CAPSULAS[i];
  document.querySelectorAll('#capTabs button').forEach(b =>
    b.classList.toggle('activo', Number(b.dataset.v) === i));
  $('capVideo').innerHTML =
    '<h3 class="red-h2" style="font-size:clamp(1.3rem,3.5vw,2rem)">' + v.titulo + '</h3>' +
    (v.videoId
      ? '<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/' + v.videoId +
        '" title="' + v.titulo + '" allow="encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>'
      : '<div class="red-card" style="text-align:center"><p style="font-size:3rem">🎬</p><p>Video próximamente</p></div>');
}

function mostrarCap(html) {
  $('capCaja').innerHTML =
    '<img src="images/foxy.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'prov-emoji\',textContent:\'🦊\'}))">' +
    '<div>' + html + '</div>';
}

function preguntaCapsula() {
  const ops = mezclar(['4', '5', '6', '7']);
  mostrarCap(
    '<h3>¿Cuántas comarcas indígenas hay en Panamá?</h3>' +
    '<div class="prov-ops">' + ops.map(o => '<button type="button" class="btn-gold" data-op="' + o + '">' + o + '</button>').join('') + '</div>');
  $('capCaja').querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.op === '6') {
      sonido('ok');
      const premio = !pt.capsula;
      if (premio) { pt.capsula = true; ganarPuntos(5); }
      mostrarCap('<h3>¡Correcto! 🏆</h3><p>Panamá tiene 6 comarcas.' + (premio ? ' ¡Ganaste 5 ⭐!' : '') + ' Ahora ve a la Isla de los Retos.</p>');
    } else {
      sonido('error');
      b.disabled = true;
    }
  }));
}
/* ---------- 6f. ISLA DE LOS RETOS ---------- */
// Preguntas extra de provincias: [pregunta, correcta, [incorrectas]]
const RETOS_PROV = [
  ['¿En qué provincia está el volcán Barú?', 'Chiriquí', ['Veraguas', 'Colón', 'Darién']],
  ['¿Cuál es la provincia más nueva de Panamá?', 'Panamá Oeste', ['Colón', 'Herrera', 'Los Santos']],
  ['¿Cuál es la provincia más grande de Panamá?', 'Darién', ['Herrera', 'Coclé', 'Chiriquí']],
  ['¿En qué provincia está la isla Coiba?', 'Veraguas', ['Bocas del Toro', 'Colón', 'Los Santos']],
  ['¿En qué provincia se dio el Grito de Independencia de 1821?', 'Los Santos', ['Chiriquí', 'Darién', 'Colón']],
  ['¿Qué provincia es un archipiélago en el mar Caribe?', 'Bocas del Toro', ['Herrera', 'Coclé', 'Panamá']]
];

const BASE_FOXY = 'images/armario/foxy-base.png';
// capa = PNG transparente del mismo tamaño que images/foxy.png, con solo la prenda
const PRENDAS = [
  { id: 'urbano', emoji: '🧢', nombre: 'Look urbano',
    foto: 'images/armario/urbano.png', icono: 'images/armario/urbano.png' },
  { id: 'sombrero', emoji: '👒', nombre: 'Panameño',
    foto: 'images/armario/sombrero.png', icono: 'images/armario/sombrero.png' },
  { id: 'robin', emoji: '🦸', nombre: 'Robin de Batman',
    foto: 'images/armario/robin.png', icono: 'images/armario/robin.png' },
  { id: 'aventurero-arnes', emoji: '🧭', nombre: 'Uncharted',
    foto: 'images/armario/aventurero-arnes.png', icono: 'images/armario/aventurero-arnes.png' },
  { id: 'aventurero-caja', emoji: '📦', nombre: 'Tanjiro de Demon Slayer',
    foto: 'images/armario/aventurero-caja.png', icono: 'images/armario/aventurero-caja.png' },
  { id: 'capa-verde', emoji: '🧣', nombre: 'Aventurero de la capa verde',
    foto: 'images/armario/capa-verde.png', icono: 'images/armario/capa-verde.png' },
  { id: 'aventurero-chaleco', emoji: '🦺', nombre: 'Flynn de Enredados',
    foto: 'images/armario/aventurero-chaleco.png', icono: 'images/armario/aventurero-chaleco.png' },
  { id: 'mochila-espada', emoji: '🎒', nombre: 'Finn de Hora de Aventura',
    foto: 'images/armario/mochila-espada.png', icono: 'images/armario/mochila-espada.png' },
  { id: 'pirata', emoji: '🏴‍☠️', nombre: 'Jack Sparrow de Piratas del Caribe',
    foto: 'images/armario/pirata.png', icono: 'images/armario/pirata.png' },
  { id: 'uniforme', emoji: '🎩', nombre: 'Spider-Man',
    foto: 'images/armario/uniforme.png', icono: 'images/armario/uniforme.png' },
  { id: 'explorador-espadas', emoji: '⚔️', nombre: 'Eren de Shingeki no Kyojin',
    foto: 'images/armario/explorador-espadas.png', icono: 'images/armario/explorador-espadas.png' },
  { id: 'ninja', emoji: '🥷', nombre: 'Itadori de Jujutsu Kaisen',
    foto: 'images/armario/ninja.png', icono: 'images/armario/ninja.png' },
  { id: 'guerrero', emoji: '🥋', nombre: 'Goku de Dragon ball',
    foto: 'images/armario/guerrero.png', icono: 'images/armario/guerrero.png' },
  { id: 'fantasia', emoji: '🏹', nombre: 'Link de The Legend of Zelda',
    foto: 'images/armario/fantasia.png', icono: 'images/armario/fantasia.png' },
  { id: 'explorador-mochila', emoji: '🌿', nombre: 'Explorador verde',
    foto: 'images/armario/explorador-mochila.png', icono: 'images/armario/explorador-mochila.png' },
  { id: 'alien', emoji: '👽', nombre: 'Alien secreto', codigo: 'mariel',
    foto: 'images/armario/alien.png', icono: 'images/armario/alien.png' },
  { id: 'isaias', emoji: '🤓', nombre: 'Isaías', codigo: 'isaias',
    foto: 'images/armario/isaias.png', icono: 'images/armario/isaias.png' },
  { id: 'aventurero-capa2', emoji: '🧣', nombre: 'Explorador con capa',
    foto: 'images/armario/aventurero-capa2.png', icono: 'images/armario/aventurero-capa2.png' },
  { id: 'foxy-chandal-verde', emoji: '🟢', nombre: 'El Juego del Calamar',
    foto: 'images/armario/foxy-chandal-verde.png', icono: 'images/armario/foxy-chandal-verde.png' },
  { id: 'foxy-explorador', emoji: '🥾', nombre: 'Go, Diego, Go',
    foto: 'images/armario/foxy-explorador.png', icono: 'images/armario/foxy-explorador.png' },
  { id: 'foxy-futurista', emoji: '🚀', nombre: 'Los Hermanos Kratt',
    foto: 'images/armario/foxy-futurista.png', icono: 'images/armario/foxy-futurista.png' },
  { id: 'foxy-grinch', emoji: '💚', nombre: 'Grinch',
    foto: 'images/armario/foxy-grinch.png', icono: 'images/armario/foxy-grinch.png' },
  { id: 'foxy-hada', emoji: '🧚', nombre: 'Terrence de Tinker Bell',
    foto: 'images/armario/foxy-hada.png', icono: 'images/armario/foxy-hada.png' },
  { id: 'foxy-mago', emoji: '🧙', nombre: 'Harry Potter',
    foto: 'images/armario/foxy-mago.png', icono: 'images/armario/foxy-mago.png' },
  { id: 'foxy-rojo', emoji: '🔴', nombre: 'El Juego del Calamar',
    foto: 'images/armario/foxy-rojo.png', icono: 'images/armario/foxy-rojo.png' },
  { id: 'foxy-santa', emoji: '🎅', nombre: 'Santa',
    foto: 'images/armario/foxy-santa.png', icono: 'images/armario/foxy-santa.png' },
  { id: 'foxy-sudadera-roja', emoji: '🧥', nombre: 'Alvin y las ardillas',
    foto: 'images/armario/foxy-sudadera-roja.png', icono: 'images/armario/foxy-sudadera-roja.png' },
];

// Precio en estrellas de cada prenda. Lo que NO esté aquí es gratis desde el inicio
// (por eso «urbano» es gratis).
const PRECIOS = {
  'sombrero': 10,
  'robin': 15,
  'aventurero-arnes': 15,
  'aventurero-caja': 15,
  'capa-verde': 20,
  'aventurero-chaleco': 20,
  'mochila-espada': 20,
  'pirata': 25,
  'uniforme': 25,
  'explorador-espadas': 30,
  'ninja': 30,
  'guerrero': 35,
  'fantasia': 35,
  'explorador-mochila': 40,
  'aventurero-capa2': 20,
  'foxy-chandal-verde': 25,
  'foxy-explorador': 30,
  'foxy-futurista': 35,
  'foxy-grinch': 35,
  'foxy-hada': 40,
  'foxy-mago': 40,
  'foxy-rojo': 25,
  'foxy-santa': 45,
  'foxy-sudadera-roja': 25,
};

// Puntos del jugador
const pt = { puntos: 0, capsula: false };
function actualizarPuntos() {
  const el = $('puntos');                 // si no existe en el HTML, no pasa nada
  if (el) el.textContent = pt.puntos;
}
function ganarPuntos(n) {
  pt.puntos += n;
  actualizarPuntos();
}

const botin = new Set(PRENDAS.filter(p => !p.codigo && !PRECIOS[p.id]).map(p => p.id))

// Gana la siguiente prenda que falte. Devuelve la prenda, o null si ya las tiene todas.
function ganarPrenda() {
  const nueva = PRENDAS.find(p => !botin.has(p.id));
  if (nueva) botin.add(nueva.id);
  return nueva || null;
}
const rt = { modo: 'final', preguntas: [], n: 0, aciertos: 0, fallo: false, sel: null, hechos: [], errores: 0, der: [], aviso: null, look: {}, cat: 'cabeza', guardado: null };
function mostrarRet(html) {
  $('retCaja').innerHTML =
    '<img src="images/foxy.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'prov-emoji\',textContent:\'🦊\'}))">' +
    '<div style="flex:1">' + html + '</div>';
}

function iniciarRetos(cont) {
  cont.innerHTML = '<div class="prov-caja" id="retCaja"></div>';
  rt.modo = 'armario';
  armarioRender();
}

function cambiarModoRet(m) {
  rt.modo = m;
  document.querySelectorAll('#moduloContenido .prov-tabs button').forEach(t =>
    t.classList.toggle('activo', t.dataset.modo === m));
  rt.n = 0; rt.aciertos = 0; rt.fallo = false; rt.aviso = null;
  if (m === 'final') {
    // 3 de capitales + 3 de provincias + 4 de comarcas = 10 preguntas al azar
    const caps = mezclar(PROVINCIAS).slice(0, 3).map(p => [
      '¿Cuál es la capital de ' + p.nombre + '?', p.capital,
      mezclar(PROVINCIAS.filter(x => x.capital !== p.capital)).slice(0, 3).map(x => x.capital)]);
    rt.preguntas = mezclar([...caps, ...mezclar(RETOS_PROV).slice(0, 3), ...mezclar(RETOS_COM).slice(0, 4)]);
    mostrarRet('<h3>¡Reto final!</h3><p>Son ' + rt.preguntas.length + ' preguntas. Cada acierto a la primera te regala una prenda para Foxy 👒</p>' +
      '<button type="button" class="btn-gold" id="retEmpezar">▶ Empezar</button>');
    $('retEmpezar').addEventListener('click', siguientePreguntaRet);
  } else if (m === 'pares') {
    rt.sel = null; rt.hechos = []; rt.errores = 0;
    rt.der = mezclar(COMARCAS.map(c => c.capital));
    paresRender();
  } else {
    armarioRender();
  }
}

function siguientePreguntaRet() {
  const total = rt.preguntas.length;
  if (rt.n >= total) { finRet(total); return; }
  const r = rt.preguntas[rt.n];
  const ops = mezclar([r[1], ...r[2]]);
  const aviso = rt.aviso ? '<p>🎁 ¡Ganaste: ' + rt.aviso.emoji + ' ' + rt.aviso.nombre + '!</p>' : '';
  rt.aviso = null;
  mostrarRet(
    aviso +
    '<h3>' + r[0] + '</h3>' +
    '<div class="prov-ops">' + ops.map(o => '<button type="button" class="btn-gold" data-op="' + o + '">' + o + '</button>').join('') + '</div>' +
    '<p>Pregunta ' + (rt.n + 1) + ' de ' + total + ' · Aciertos: ' + rt.aciertos + '</p>');
  $('retCaja').querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.op === r[1]) {
      sonido('ok');
  if (!rt.fallo) { rt.aciertos++; ganarPuntos(3); rt.aviso = { emoji: '⭐', nombre: '3 estrellas' }; }   // acierto a la primera = 3 estrellas
      rt.n++; rt.fallo = false;
      siguientePreguntaRet();
    } else {
      sonido('error');
      rt.fallo = true;
      b.disabled = true;
    }
  }));
}

function finRet(total) {
  const a = rt.aciertos;
  const m = a >= 9 ? ['🥇', 'Oro', '¡Explorador de las comarcas!']
          : a >= 6 ? ['🥈', 'Plata', '¡Casi un experto!']
          :          ['🥉', 'Bronce', '¡Sigue explorando!'];
  const aviso = rt.aviso ? '<p style="text-align:center">🎁 ¡Ganaste: ' + rt.aviso.emoji + ' ' + rt.aviso.nombre + '!</p>' : '';
  rt.aviso = null;
  mostrarRet(
    aviso +
    '<p style="font-size:4rem;text-align:center">' + m[0] + '</p>' +
    '<h3 style="text-align:center">Medalla de ' + m[1] + ': ' + m[2] + '</h3>' +
    '<p style="text-align:center">Acertaste ' + a + ' de ' + total + ' a la primera. Prendas: ' + botin.size + ' de ' + PRENDAS.length + '</p>' +
    '<div class="red-centro">' +
      '<button type="button" class="btn-gold" id="retOtra">🔄 Intentar otra vez</button> ' +
      '<button type="button" class="btn-gold" id="retArm">👒 Ver mi armario</button>' +
    '</div>');
  $('retOtra').addEventListener('click', () => cambiarModoRet('final'));
  $('retArm').addEventListener('click', () => cambiarModoRet('armario'));
}

const limpiar = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function armarioRender(msg) {
  const actual = PRENDAS.find(p => p.id === rt.puesto);
  const foto = actual ? actual.foto : BASE_FOXY;

  const casillas = PRENDAS.map(p => {
    const tiene = botin.has(p.id);
    const puesta = rt.puesto === p.id;
    const costo = PRECIOS[p.id] || 0;
    const img = p.icono
      ? '<img class="arm2-icono" src="' + p.icono + '" alt="" onerror="this.replaceWith(document.createTextNode(\'' + p.emoji + '\'))">'
      : p.emoji;
    const etiqueta = tiene ? '' :
      (p.codigo ? '<span class="arm2-precio">🔑 Código secreto</span>'
                : '<span class="arm2-precio">🔒 ' + costo + ' ⭐</span>');
    return '<button type="button" class="arm2-item' + (tiene ? '' : ' bloq') + (puesta ? ' puesta' : '') +
      '" data-p="' + p.id + '"' +
      ' aria-label="' + (tiene ? p.nombre : p.nombre + ', bloqueado, ' + (p.codigo ? 'necesita un código secreto' : 'cuesta ' + costo + ' puntos')) + '" aria-pressed="' + puesta + '">' +
      '<span class="arm2-emoji-item">' + img + '</span>' +
      '<span class="arm2-nom">' + (tiene || !p.codigo ? p.nombre : '???') + '</span>' +
      etiqueta +
      (puesta ? '<span class="arm2-check">✔</span>' : '') + '</button>';
  }).join('');

    $('retCaja').innerHTML =
    '<div class="arm2">' +
      '<div class="arm2-escena">' +
        '<div class="arm2-foxy"><img class="arm2-base" src="' + foto + '" alt="Foxy"></div>' +
        '<div class="arm2-plataforma"></div>' +
      '</div>' +
      '<div class="arm3-izq">' +
        '<button type="button" class="btn-gold" id="armFav">⭐ Mi look favorito</button>' +
        '<button type="button" class="btn-gold" id="armQuitar">🧺 Quitar todo</button>' +
        '<button type="button" class="btn-gold" id="armGuardar">💾 Guardar</button>' +
        '<div class="arm3-codigo">' +
          '<label for="armCodigo">🔑 ¿Código secreto?</label>' +
          '<input type="text" id="armCodigo" placeholder="Escríbelo aquí" autocomplete="off" maxlength="20">' +
          '<button type="button" class="btn-gold" id="armCanjear">Canjear</button>' +
        '</div>' +
        '<p class="arm2-msg" aria-live="polite">' + (msg || '') + '</p>' +
      '</div>' +
      '<div class="arm3-der">' +
        '<p class="arm3-puntos">⭐ Tienes <strong>' + pt.puntos + '</strong> puntos</p>' +
        '<div class="arm2-grid">' + casillas + '</div>' +
      '</div>' +
    '</div>';

  const caja = $('retCaja');
  const base = caja.querySelector('.arm2-base');
  base.addEventListener('error', () => {
    if (!base.src.endsWith('foxy-base.png')) { base.src = BASE_FOXY; return; }
    const s = document.createElement('span');
    s.className = 'prov-emoji';
    s.style.fontSize = '8rem';
    s.textContent = '🦊';
    base.replaceWith(s);
  });

  caja.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
    const p = PRENDAS.find(x => x.id === b.dataset.p);
    if (!botin.has(p.id)) {
      if (p.codigo) {                                         // secreta: solo con código
        sonido('error');
        armarioRender('🔑 Esta prenda es secreta. ¡Necesitas un código!');
        return;
      }
      const costo = PRECIOS[p.id] || 0;
      if (pt.puntos < costo) {
        sonido('error');
        armarioRender('Te faltan ' + (costo - pt.puntos) + ' ⭐. ¡Sigue jugando en las otras islas!');
        return;
      }
      pt.puntos -= costo;
      botin.add(p.id);
      rt.puesto = p.id;
      actualizarPuntos();
      sonido('ok');
      armarioRender('🎉 ¡Compraste ' + p.nombre + '!');
      return;
    }
    sonido('ok');
    rt.puesto = (rt.puesto === p.id) ? null : p.id;
    armarioRender();
  }));

  const canjear = () => {
    const txt = limpiar($('armCodigo').value);
    if (!txt) return;
    const p = PRENDAS.find(x => x.codigo && limpiar(x.codigo) === txt);
    if (!p) { sonido('error'); armarioRender('Ese código no funciona. ¡Inténtalo otra vez!'); return; }
    if (botin.has(p.id)) { armarioRender('Ya tienes ' + p.nombre + ' 😉'); return; }
    botin.add(p.id);
    rt.puesto = p.id;
    sonido('ok');
    armarioRender('🎉 ¡Código correcto! Desbloqueaste: ' + p.nombre);
  };
  $('armCanjear').addEventListener('click', canjear);
  $('armCodigo').addEventListener('keydown', e => { if (e.key === 'Enter') canjear(); });

  $('armQuitar').addEventListener('click', () => { rt.puesto = null; armarioRender(); });
  $('armGuardar').addEventListener('click', () => {
    rt.guardado = rt.puesto;
    sonido('ok');
    armarioRender('💾 ¡Look guardado!');
  });
  $('armFav').addEventListener('click', () => {
    if (!rt.guardado) { sonido('error'); armarioRender('Aún no tienes un look guardado.'); return; }
    rt.puesto = rt.guardado;
    sonido('ok');
    armarioRender('⭐ ¡Look favorito puesto!');
  });
}

// Une cada comarca con su capital: toca una comarca y luego su capital
function paresRender() {
  const btn = (txt, attrs, estilo) =>
    '<button type="button" class="btn-gold" ' + attrs + ' style="' + estilo + '">' + txt + '</button>';
  const izq = COMARCAS.map(c => {
    const h = rt.hechos.includes(c.nombre);
    return btn((h ? '✅ ' : '') + c.nombre, 'data-i="' + c.nombre + '"' + (h ? ' disabled' : ''),
      (h ? 'opacity:.45;' : '') + (rt.sel === c.nombre ? 'outline:4px solid #0a1428;' : ''));
  }).join('');
  const der = rt.der.map(cap => {
    const h = COMARCAS.some(c => c.capital === cap && rt.hechos.includes(c.nombre));
    return btn((h ? '✅ ' : '') + cap, 'data-d="' + cap + '"' + (h ? ' disabled' : ''), h ? 'opacity:.45;' : '');
  }).join('');
  mostrarRet(
    '<h3>Une cada comarca con su capital</h3>' +
    '<p>Toca una comarca y luego su capital. Errores: ' + rt.errores + '</p>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      '<div style="display:grid;gap:8px">' + izq + '</div>' +
      '<div style="display:grid;gap:8px">' + der + '</div>' +
    '</div>');
  $('retCaja').querySelectorAll('[data-i]').forEach(x =>
    x.addEventListener('click', () => { rt.sel = x.dataset.i; paresRender(); }));
  $('retCaja').querySelectorAll('[data-d]').forEach(x =>
    x.addEventListener('click', () => verificarPar(x.dataset.d)));
}

function verificarPar(cap) {
  if (!rt.sel) { sonido('error'); return; }
  const c = COMARCAS.find(x => x.nombre === rt.sel);
  if (c.capital === cap) {
    sonido('ok');
    rt.hechos.push(c.nombre);
    rt.sel = null;
    if (rt.hechos.length === COMARCAS.length) {
      mostrarRet('<h3>¡Pares completos! 🎉</h3><p>Terminaste con ' + rt.errores + ' errores.</p>' +
        '<button type="button" class="btn-gold" id="retOtra">🔄 Jugar otra vez</button>');
      $('retOtra').addEventListener('click', () => cambiarModoRet('pares'));
      return;
    }
  } else {
    sonido('error');
    rt.errores++;
    rt.sel = null;
  }
  paresRender();
}
/* ---------- 7. INICIO ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // 1) La navegación se registra PRIMERO: así los botones siempre responden,
  //    aunque otra parte falle (por ejemplo, si falta algo en el HTML).
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); ir(go.dataset.go); }
    const lee = e.target.closest('[data-lee]');
    if (lee) hablar(document.querySelector(lee.dataset.lee).innerText);
  });
  const enlazar = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  enlazar('btnAtras',     () => ir(SECUENCIA[estado.pos - 1]));
  enlazar('btnSiguiente', () => ir(SECUENCIA[estado.pos + 1]));
  enlazar('btnAyuda',     () => $('dlgAyuda').showModal());
  enlazar('cerrarAyuda',  () => $('dlgAyuda').close());

  // 2) Cada módulo arranca por separado: si uno falla, los demás siguen.
  [crearIslas, initFoxy, initAudio, initDialogo, iniciarBosque].forEach(f => {
    try { f(); } catch (err) { console.error('Error en ' + f.name + ':', err); }
  });
  ir('inicio', true);
});
