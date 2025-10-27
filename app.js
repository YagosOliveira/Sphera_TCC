// Dados de exemplo para Brasília
const PLACES = [
  { id: 1, nome: "Café do Ponto", categoria: "cafe", lat: -15.8127502, lng: -47.8937088, endereco: "Setor Comercial Sul, Brasília", nota: 4.5, preco: 65, features: ["wifi","happy_hour","musica_ao_vivo"] },
  { id: 2, nome: "Parque da Cidade Sarah Kubitschek", categoria: "parque", lat: -15.798206, lng: -47.913692, endereco: "Eixo Monumental, Brasília", nota: 4.8, preco: 50, features: ["area_kids", "sinuca"] },
  { id: 3, nome: "Museu Nacional da República", categoria: "museu", lat: -15.800879, lng: -47.882250, endereco: "Setor Cultural Sul, Brasília", nota: 4.7, preco: 35, features: ["jogos", "happy_hour"] },
  { id: 4, nome: "Ernesto Café", categoria: "cafe", lat: -15.810704, lng: -47.882897, endereco: "Asa Sul, Brasília", nota: 4.4, preco: 40, features: ["wifi","musica_ao_vivo"] },
  { id: 5, nome: "Jardim Botânico de Brasília", categoria: "parque", lat: -15.876054, lng: -47.835682, endereco: "Lago Sul, Brasília", nota: 4.6, preco: 100, features: ["area_kids", "musica_ao_vivo", "ao_ar_livre"] }
];

let map, markersLayer;

// Filtro atual de categoria (chips)
let selectedFilter = "todos";

// Filtro de preço (média + tolerância). null = sem filtro
// Ex.: { media: 50, tol: 10 }  => faixa válida: [40, 60]
let priceFilter = null;

function initMap() {
  // Centraliza em Brasília
  map = L.map("map", { zoomControl: true }).setView([-15.793889, -47.882778], 13);

  L.tileLayer("https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  render();
}

function render() {
  const q = document.getElementById("q").value.trim().toLowerCase();
  const lista = document.getElementById("lista");

  const filtrados = PLACES.filter(p => {
    const matchTexto = !q ||
      p.nome.toLowerCase().includes(q) ||
      p.endereco.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q);

    const matchCategoria = selectedFilter === "todos" || p.categoria === selectedFilter;

    const matchPreco = (() => {
      if (!priceFilter) return true;
      const { media, tol } = priceFilter;
      const min = media - tol;
      const max = media + tol;
      return Number(p.preco) >= min && Number(p.preco) <= max; // <-- usa 'preco'
    })();

    return matchTexto && matchCategoria && matchPreco && matchFeatures(p); // <-- diferenciais
  });

  lista.innerHTML = "";
  markersLayer.clearLayers();

  if (filtrados.length === 0) {
    lista.innerHTML = '<p class="meta">Nenhum lugar encontrado.</p>';
    return;
  }

  const bounds = [];
  console.debug('features selecionadas:', [...selectedFeatures]);

  filtrados.forEach((p) => {
    const el = document.createElement("article");
    el.className = "card";
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.dataset.id = p.id;

    // monta tags de features (opcional)
    const feats = (p.features||[]).map(f=>`<span class="tag">${slugFeature(f).replace(/_/g,' ')}</span>`).join(' ');

    el.innerHTML = `
      <h3>${p.nome}</h3>
      <span class="badge">${Number(p.nota).toFixed(1)} • R$ ${Number(p.preco).toFixed(0)}</span>
      <div class="meta">${p.endereco} • ${p.categoria}</div>
      ${feats ? `<div class="tags">${feats}</div>` : ""}
    `;

    el.addEventListener("click", () => focusPlace(p));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") focusPlace(p); });

    lista.appendChild(el);

    const marker = L.marker([p.lat, p.lng])
      .bindPopup(`<strong>${p.nome}</strong><br>${p.endereco}<br><small>${p.categoria} • ★ ${p.nota}</small><br>R$ ${p.preco}<br>`);

    marker.on("click", () => highlightCard(p.id));
    markersLayer.addLayer(marker);

    bounds.push([p.lat, p.lng]);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [40, 40] });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 15);
  }
}

function focusPlace(p) {
  map.setView([p.lat, p.lng], 16);
  markersLayer.eachLayer((layer) => {
    const ll = layer.getLatLng();
    if (ll.lat === p.lat && ll.lng === p.lng) {
      layer.openPopup();
    }
  });
  highlightCard(p.id);
}

function highlightCard(id) {
  document.querySelectorAll('.card').forEach(c => c.classList.toggle('active', c.dataset.id == id));
}

function openPriceModal() {
  const backdrop = document.getElementById('priceModalBackdrop');
  backdrop.setAttribute('aria-hidden', 'false');
  // foco no primeiro campo
  setTimeout(() => document.getElementById('mediaPreco').focus(), 0);
}

function closePriceModal() {
  const backdrop = document.getElementById('priceModalBackdrop');
  backdrop.setAttribute('aria-hidden', 'true');
}

function bindUI() {
  const form = document.getElementById("formBusca");
  const input = document.getElementById("q");
  const btnLimpar = document.getElementById("btnLimpar");

  form.addEventListener("submit", (e) => e.preventDefault());
  input.addEventListener("input", render);
  btnLimpar.addEventListener("click", () => { input.value = ""; render(); input.focus(); });

  // Chips: categorias comuns
  document.querySelectorAll('.chip [data-filter]').forEach(chip => {
    // Chip especial de preço abre modal
    if (chip.dataset.filter === 'preco') {
      chip.addEventListener('click', () => {
        openPriceModal();
        // visual: não muda selectedFilter das categorias
        document.getElementById('mediaPreco').value = priceFilter?.media ?? '';
        document.getElementById('toleranciaPreco').value = priceFilter?.tol ?? '';
      });
    } else {
      chip.addEventListener('click', () => {
        selectedFilter = chip.dataset.filter;
        document.querySelectorAll('.chip [data-filter]').forEach(c => {
          // aria-pressed apenas para os que não são o chip de preço
          if (c.dataset.filter !== 'preco') {
            c.setAttribute('aria-pressed', String(c === chip));
          }
        });
        render();
      });
    }
  });

  // Modal de preço
  const priceForm = document.getElementById('priceForm');
  const cancelBtn = document.getElementById('cancelPrice');
  const clearBtn = document.getElementById('clearPrice');
  const backdrop = document.getElementById('priceModalBackdrop');

  priceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const mediaVal = Number(document.getElementById('mediaPreco').value);
    const tolInput = document.getElementById('toleranciaPreco').value;
    const tolVal = tolInput === '' ? 10 : Number(tolInput); // padrão 10

    if (Number.isFinite(mediaVal) && mediaVal >= 0 && Number.isFinite(tolVal) && tolVal >= 0) {
      priceFilter = { media: mediaVal, tol: tolVal };
      closePriceModal();
      render();
    } else {
      alert('Informe números válidos para a média e a tolerância.');
    }
  });

  cancelBtn.addEventListener('click', () => {
    closePriceModal();
  });

  clearBtn.addEventListener('click', () => {
    priceFilter = null;
    // limpa os campos para feedback visual
    document.getElementById('mediaPreco').value = '';
    document.getElementById('toleranciaPreco').value = '';
    closePriceModal();
    render();
  });

  // fechar modal ao clicar fora
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePriceModal();
  });

  // ESC fecha modal
  window.addEventListener('keydown', (e) => {
    const isOpen = document.getElementById('priceModalBackdrop').getAttribute('aria-hidden') === 'false';
    if (isOpen && e.key === 'Escape') closePriceModal();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  bindUI();
  initMap();
});

// ===== FILTROS POR DIFERENCIAL =====
const selectedFeatures = new Set(); // chips ativos (diferenciais)

// util: normaliza "Jogos", "jogos", "Área ao ar livre" -> "ao_ar_livre"
function slugFeature(str){
  if (!str) return "";
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // tira acentos
    .toLowerCase()
    .replace(/\s+/g,"_")
    .replace(/[^a-z0-9_]/g,"")
    // acertos de legado/comuns
    .replace(/^area_ao_ar_livre$/,"ao_ar_livre");
}

// listeners: diferenciais (chips extras)
document.querySelectorAll('.chips--extras .chip--extra').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const f = slugFeature(btn.dataset.feature || btn.textContent); // <-- NORMALIZA AQUI
    const pressed = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
    if (pressed) selectedFeatures.delete(f); else selectedFeatures.add(f);
    render();
  });
});

function matchFeatures(place){
  if (selectedFeatures.size === 0) return true;
  // normaliza tudo que vem do lugar
  const feats = new Set((place.features || []).map(slugFeature));
  // normaliza o que está selecionado (por segurança)
  for (const f of selectedFeatures) {
    if (!feats.has(slugFeature(f))) return false;
  }
  return true;
}


