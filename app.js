// =====================================================
//  Haversine para distância em km
// =====================================================
function haversineKm(a, b) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// =====================================================
//  SUPABASE
// =====================================================
const supabase = window.supabase;

// Lista de lugares vinda do banco
let PLACES = [];
let isLoadingPlaces = true;
let lastLoadError = null;

// Usuário logado + preferências (para recomendações)
let CURRENT_USER = null;
let USER_PREFS = null; // { favCategories, budgetLevel, homeLat, homeLng, maxDistanceKm, featureWeights }

// =====================================================
//  MAPA
// =====================================================
let map, markersLayer;

// Filtro atual de categoria (chips)
let selectedFilter = "todos";

// Filtro de preço (média + tolerância). null = sem filtro
let priceFilter = null;

// ===== FILTROS POR DIFERENCIAL =====
const selectedFeatures = new Set(); // chips ativos (diferenciais)

// util: normaliza "Jogos", "Área ao ar livre" -> "ao_ar_livre"
function slugFeature(str){
  if (!str) return "";
  return String(str)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // tira acentos
    .toLowerCase()
    .replace(/\s+/g,"_")
    .replace(/[^a-z0-9_]/g,"")
    .replace(/^area_ao_ar_livre$/,"ao_ar_livre");
}

// Normaliza categorias ("Cafés" → "cafe", "Bares" → "bar")
function normalizeCategory(str) {
  if (!str) return "";
  const s = String(str).toLowerCase().trim();

  if (s.startsWith("caf"))   return "cafe";    // café, cafés, cafe
  if (s.startsWith("bar"))   return "bar";     // bar, bares
  if (s.startsWith("parq"))  return "parque";  // parque, parques
  if (s.startsWith("mus"))   return "museu";   // museu, museus

  return s;
}

// =====================================================
//  CARREGAR PREFERÊNCIAS DO USUÁRIO (para recomendação)
// =====================================================
async function loadCurrentUserPrefs() {
  if (!supabase || !supabase.auth) {
    console.warn("[reco] Supabase não está disponível para carregar prefs.");
    return;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("[reco] erro em getUser()", error);
      return;
    }

    const user = data?.user;
    if (!user) {
      console.log("[reco] usuário anônimo (sem recomendações personalizadas).");
      return;
    }

    CURRENT_USER = user;

    // profile, prefs de features e tabela de features
    const [
      { data: profile, error: pErr },
      { data: prefs,   error: prefErr },
      { data: feats,   error: fErr }
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("budget_level, home_lat, home_lng, max_distance_km, fav_categories")
        .eq("id", user.id)
        .single(),
      supabase
        .from("user_feature_prefs")
        .select("feature_id, weight")
        .eq("user_id", user.id),
      supabase
        .from("features")
        .select("id, slug")
    ]);

    if (pErr)  console.warn("[reco] erro carregando profile", pErr);
    if (prefErr) console.warn("[reco] erro carregando user_feature_prefs", prefErr);
    if (fErr)  console.warn("[reco] erro carregando features", fErr);

    const featureById = new Map((feats || []).map(f => [f.id, f.slug]));
    const featureWeights = new Map();

    (prefs || []).forEach(p => {
      const slug = featureById.get(p.feature_id);
      if (!slug) return;
      featureWeights.set(slugFeature(slug), Number(p.weight) || 1);
    });

    USER_PREFS = {
      favCategories: profile?.fav_categories || [],
      budgetLevel: profile?.budget_level ?? null,
      homeLat: profile?.home_lat != null ? Number(profile.home_lat) : null,
      homeLng: profile?.home_lng != null ? Number(profile.home_lng) : null,
      maxDistanceKm: profile?.max_distance_km != null ? Number(profile.max_distance_km) : null,
      featureWeights
    };

    console.log("[reco] preferências do usuário carregadas:", USER_PREFS);
  } catch (err) {
    console.error("[reco] erro inesperado ao carregar preferências", err);
  }
}

// =====================================================
//  FUNÇÃO DE SCORE (RECOMENDAÇÃO)
// =====================================================
function computeRecommendationScore(place) {
  if (!USER_PREFS) return 0;

  let score = 0;

  // 1) Categoria favorita
  const favCats = USER_PREFS.favCategories || [];
  if (favCats.length && place.categoria) {
    const catNorm = normalizeCategory(place.categoria);
    const hasCat = favCats.some(c => normalizeCategory(c) === catNorm);
    if (hasCat) score += 3;
  }

  // 2) Orçamento (quanto mais próximo, melhor)
  if (USER_PREFS.budgetLevel != null && place.preco != null) {
    const budget = Number(USER_PREFS.budgetLevel);
    const price  = Number(place.preco);
    if (Number.isFinite(budget) && Number.isFinite(price)) {
      const diff = Math.abs(price - budget);
      if (diff <= 10)      score += 3;
      else if (diff <= 25) score += 2;
      else if (diff <= 50) score += 1;
      else                 score -= 1;
    }
  }

  // 3) Diferenciais (features) marcados pelo usuário
  if (USER_PREFS.featureWeights && USER_PREFS.featureWeights.size > 0) {
    const feats = (place.features || []).map(slugFeature);
    feats.forEach(f => {
      const w = USER_PREFS.featureWeights.get(f);
      if (w) score += w; // soma o peso de cada feature que bate
    });
  }

  // 4) Distância da casa (se tiver home_lat/home_lng e max_distance_km)
  if (
    USER_PREFS.homeLat != null && USER_PREFS.homeLng != null &&
    USER_PREFS.maxDistanceKm != null &&
    Number.isFinite(place.lat) && Number.isFinite(place.lng)
  ) {
    const home = { lat: USER_PREFS.homeLat, lng: USER_PREFS.homeLng };
    const dist = haversineKm(home, { lat: place.lat, lng: place.lng });
    const maxD = Number(USER_PREFS.maxDistanceKm);

    if (Number.isFinite(dist) && Number.isFinite(maxD) && maxD > 0) {
      if (dist > maxD) {
        // muito longe → desprioriza totalmente
        score -= 999;
      } else {
        // quanto mais perto do limite, menor o bônus
        const proximityBonus = 1 + Math.max(0, (maxD - dist) / maxD); // entre 1 e 2
        score += proximityBonus;
      }
    }
  }

  return score;
}

// =====================================================
//  CARREGAR DADOS DO SUPABASE (LUGARES)
// =====================================================
async function loadPlacesFromSupabase(){
  if (!supabase) {
    console.error("[map] Supabase não encontrado em window.supabase");
    isLoadingPlaces = false;
    lastLoadError = "Supabase não carregado.";
    render();
    return;
  }

  isLoadingPlaces = true;
  lastLoadError = null;
  render(); // mostra "Carregando..."

  try {
    // 1) Busca os venues
    const { data: venues, error: vErr } = await supabase
      .from("venues")
      .select("id,name,category,address,lat,lng,avg_price,rating,logo_url,image_url,status,slug")
      .order("name", { ascending: true });

    if (vErr) throw vErr;

    // 2) Busca os slugs de features por venue
    const { data: feats, error: fErr } = await supabase
      .from("venue_features_view")
      .select("venue_id,slug");

    if (fErr) throw fErr;

    const featsByVenue = new Map();
    (feats || []).forEach(row => {
      const list = featsByVenue.get(row.venue_id) || [];
      list.push(row.slug);
      featsByVenue.set(row.venue_id, list);
    });

    // 3) Monta PLACES no formato usado no app + score de recomendação
    PLACES = (venues || [])
      .filter(v => v.is_active !== false) // se tiver essa flag
      .map(v => {
        const place = {
          id: v.id,
          nome: v.name,
          slug: v.slug,
          categoria: v.category || "outro",
          lat: Number(v.lat),
          lng: Number(v.lng),
          endereco: v.address || "",
          nota: v.rating ?? 0,
          preco: v.avg_price ?? 0,
          logo_url: v.logo_url || null,
          image_url: v.image_url || null,
          features: featsByVenue.get(v.id) || []
        };

        place.score = computeRecommendationScore(place);
        return place;
      });

    console.log("[map] venues carregados:", PLACES.length);
  } catch (err) {
    console.error("[map] erro ao carregar lugares:", err);
    lastLoadError = "Erro ao carregar lugares. Tente novamente mais tarde.";
  } finally {
    isLoadingPlaces = false;
    render();
  }
}

// =====================================================
//  MAPA / RENDERIZAÇÃO
// =====================================================
function initMap() {
  // Centraliza em Brasília
  map = L.map("map", { zoomControl: true }).setView([-15.793889, -47.882778], 13);

  L.tileLayer("https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
}

// Função para saber se um lugar bate com os diferenciais selecionados
function matchFeatures(place){
  if (selectedFeatures.size === 0) return true;
  const feats = new Set((place.features || []).map(slugFeature));
  for (const f of selectedFeatures) {
    if (!feats.has(slugFeature(f))) return false;
  }
  return true;
}

function render() {
  const q = document.getElementById("q")?.value.trim().toLowerCase() || "";
  const lista = document.getElementById("lista");
  if (!lista) return;

  lista.innerHTML = "";
  markersLayer && markersLayer.clearLayers();

  // Estados de carregamento/erro
  if (isLoadingPlaces) {
    lista.innerHTML = '<p class="meta">Carregando lugares...</p>';
    return;
  }
  if (lastLoadError) {
    lista.innerHTML = `<p class="meta">${lastLoadError}</p>`;
    return;
  }
  if (!PLACES || PLACES.length === 0) {
    lista.innerHTML = '<p class="meta">Nenhum lugar cadastrado ainda.</p>';
    return;
  }

  const filtrados = PLACES.filter(p => {
    const matchTexto = !q ||
      p.nome.toLowerCase().includes(q) ||
      p.endereco.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q);

    const matchCategoria = selectedFilter === "todos" || normalizeCategory(p.categoria) === selectedFilter;

    const matchPreco = (() => {
      if (!priceFilter) return true;
      const { media, tol } = priceFilter;
      const min = media - tol;
      const max = media + tol;
      return Number(p.preco) >= min && Number(p.preco) <= max;
    })();

    return matchTexto && matchCategoria && matchPreco && matchFeatures(p);
  });

  if (filtrados.length === 0) {
    lista.innerHTML = '<p class="meta">Nenhum lugar encontrado com esses filtros.</p>';
    return;
  }

  const bounds = [];

  // Garante que todos têm um score atualizado
  const enriched = filtrados.map(p => {
    if (typeof p.score !== "number") {
      p.score = computeRecommendationScore(p);
    }
    return p;
  });

  const hasPrefs =
    !!USER_PREFS &&
    (
      (USER_PREFS.favCategories && USER_PREFS.favCategories.length > 0) ||
      (USER_PREFS.featureWeights && USER_PREFS.featureWeights.size > 0) ||
      USER_PREFS.budgetLevel != null ||
      (USER_PREFS.homeLat != null && USER_PREFS.homeLng != null && USER_PREFS.maxDistanceKm != null)
    );

  let recs = [];
  const recIds = new Set();

  if (hasPrefs) {
    recs = enriched
      .filter(p => (p.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5); // top 5 recomendados

    recs.forEach(r => recIds.add(r.id));
  }

  const restantes = enriched.filter(p => !recIds.has(p.id));

  function addPlace(p, { isRecommended = false } = {}) {
    const el = document.createElement("article");
    el.className = "card" + (isRecommended ? " card--recommended" : "");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.dataset.id = p.id;

    const feats = (p.features || [])
      .map(f => `<span class="tag">${slugFeature(f).replace(/_/g, " ")}</span>`)
      .join(" ");

    const logo = p.logo_url || p.image_url || p.cover_url || "https://via.placeholder.com/80x80?text=SP";

    el.innerHTML = `
      <div class="card-media">
        <img class="card-avatar" src="${logo}" alt="${p.nome}">
      </div>
      <div class="card-info">
        <div class="card-header">
          <h3>${p.nome}</h3>
          <span class="badge">
            ${p.nota != null ? Number(p.nota).toFixed(1) : "–"} •
            R$ ${p.preco != null ? Number(p.preco).toFixed(0) : "–"}
          </span>
        </div>
        <div class="meta">${p.endereco} • ${p.categoria}</div>
        ${feats ? `<div class="tags">${feats}</div>` : ""}
      </div>
    `;
    // ao clicar no card, vai para a página de perfil do local
    function goToProfile() {
      if (p.slug) {
        // se quiser absoluto, pode usar: "http://127.0.0.1:5500/profile.html"
        const baseUrl = "http://127.0.0.1:5500/profile.html";
        const url = `${baseUrl}?slug=${encodeURIComponent(p.slug)}`;
        window.location.href = url;
      } else {
        // se algum lugar estiver sem slug, mantém o comportamento antigo
        console.warn("Lugar sem slug, focando no mapa:", p);
        focusPlace(p);
      }
    }

    el.addEventListener("click", goToProfile);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToProfile();
    });

    lista.appendChild(el);

    if (markersLayer && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      const marker = L.marker([p.lat, p.lng])
        .bindPopup(`
          <strong>${p.nome}</strong><br>
          ${p.endereco || ""}<br>
          <small>${p.categoria || ""} • ★ ${Number(p.nota).toFixed(1)}</small><br>
          R$ ${Number(p.preco).toFixed(0)}
        `);

      marker.on("click", () => highlightCard(p.id));
      markersLayer.addLayer(marker);
      bounds.push([p.lat, p.lng]);
    }
  }

  if (recs.length) {
    const titleRecs = document.createElement("div");
    titleRecs.className = "section-title";
    titleRecs.textContent = "Recomendados para você";
    lista.appendChild(titleRecs);

    recs.forEach(p => addPlace(p, { isRecommended: true }));

    const titleAll = document.createElement("div");
    titleAll.className = "section-title";
    titleAll.textContent = "Todos os lugares";
    lista.appendChild(titleAll);

    restantes.forEach(p => addPlace(p, { isRecommended: false }));
  } else {
    // Sem prefs ou sem score positivo → lista normal
    enriched.forEach(p => addPlace(p, { isRecommended: false }));
  }

  if (map && bounds.length > 1) {
    map.fitBounds(bounds, { padding: [40, 40] });
  } else if (map && bounds.length === 1) {
    map.setView(bounds[0], 15);
  }
}

function focusPlace(p) {
  if (!map) return;
  if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
    map.setView([p.lat, p.lng], 16);
  }
  markersLayer?.eachLayer((layer) => {
    const ll = layer.getLatLng?.();
    if (ll && ll.lat === p.lat && ll.lng === p.lng) {
      layer.openPopup();
    }
  });
  highlightCard(p.id);
}

function highlightCard(id) {
  document.querySelectorAll('.card').forEach(c => {
    c.classList.toggle('active', c.dataset.id == id);
  });
}

// =====================================================
//  MODAL DE PREÇO
// =====================================================
function openPriceModal() {
  const backdrop = document.getElementById('priceModalBackdrop');
  backdrop?.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('mediaPreco')?.focus(), 0);
}

function closePriceModal() {
  const backdrop = document.getElementById('priceModalBackdrop');
  backdrop?.setAttribute('aria-hidden', 'true');
}

// =====================================================
//  BIND DE UI (busca, chips, modal, etc.)
// =====================================================
function bindUI() {
  const form = document.getElementById("formBusca");
  const input = document.getElementById("q");
  const btnLimpar = document.getElementById("btnLimpar");

  form?.addEventListener("submit", (e) => e.preventDefault());
  input?.addEventListener("input", render);
  btnLimpar?.addEventListener("click", () => {
    input.value = "";
    render();
    input.focus();
  });

  // Chips: categorias comuns + chip de preço
  document.querySelectorAll('.chips .chip').forEach(chip => {
    const filter = chip.dataset.filter;
    if (!filter) return;

    // Chip especial de preço abre modal
    if (filter === 'preco') {
      chip.addEventListener('click', () => {
        openPriceModal();
        document.getElementById('mediaPreco').value = priceFilter?.media ?? '';
        document.getElementById('toleranciaPreco').value = priceFilter?.tol ?? '';
      });
    } else {
      chip.addEventListener('click', () => {
        selectedFilter = filter;
        document.querySelectorAll('.chips .chip').forEach(c => {
          if (c.dataset.filter !== 'preco') {
            c.setAttribute('aria-pressed', String(c === chip));
          }
        });
        render();
      });
    }
  });

  // Modal de preço
  const priceForm  = document.getElementById('priceForm');
  const cancelBtn  = document.getElementById('cancelPrice');
  const clearBtn   = document.getElementById('clearPrice');
  const backdrop   = document.getElementById('priceModalBackdrop');

  priceForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mediaVal = Number(document.getElementById('mediaPreco').value);
    const tolInput = document.getElementById('toleranciaPreco').value;
    const tolVal   = tolInput === '' ? 10 : Number(tolInput);

    if (Number.isFinite(mediaVal) && mediaVal >= 0 && Number.isFinite(tolVal) && tolVal >= 0) {
      priceFilter = { media: mediaVal, tol: tolVal };
      closePriceModal();
      render();
    } else {
      alert('Informe números válidos para a média e a tolerância.');
    }
  });

  cancelBtn?.addEventListener('click', () => {
    closePriceModal();
  });

  clearBtn?.addEventListener('click', () => {
    priceFilter = null;
    document.getElementById('mediaPreco').value = '';
    document.getElementById('toleranciaPreco').value = '';
    closePriceModal();
    render();
  });

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closePriceModal();
  });

  window.addEventListener('keydown', (e) => {
    const isOpen = document.getElementById('priceModalBackdrop')?.getAttribute('aria-hidden') === 'false';
    if (isOpen && e.key === 'Escape') closePriceModal();
  });

  // Chips de diferenciais (extras)
  document.querySelectorAll('.chips--extras .chip--extra').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = slugFeature(btn.dataset.feature || btn.textContent);
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', pressed ? 'false' : 'true');
      if (pressed) selectedFeatures.delete(f);
      else selectedFeatures.add(f);
      render();
    });
  });
}

// =====================================================
//  BOOT
// =====================================================
window.addEventListener("DOMContentLoaded", async () => {
  console.log("[boot] DOM pronto");
  bindUI();
  initMap();
  await loadCurrentUserPrefs();    // <- NOVO: carrega prefs do usuário logado
  await loadPlacesFromSupabase();  // carrega lugares já com score calculado
});
