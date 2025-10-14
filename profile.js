/* profile.js */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** =========================
 *  CONFIG
 *  ========================= */
const SUPABASE_URL = "https://EZPTLMZXOSDSSQTWQZRG.supabase.co";  // <- seu URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cHRsbXp4b3Nkc3NxdHdxenJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMDkwNDgsImV4cCI6MjA3Mzg4NTA0OH0.rzKy_WfK0Ut6Vc9bm8IbnKTzsFpWgA6b6amW2xgqJec";                   // <- sua anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** =========================
 *  HELPERS
 *  ========================= */
const $  = (sel, p = document) => p.querySelector(sel);
const $$ = (sel, p = document) => [...p.querySelectorAll(sel)];

function getQuery() {
  const u = new URL(location.href);
  return { slug: u.searchParams.get("slug"), id: u.searchParams.get("id") };
}

function fmtMoney(v) {
  if (v == null || isNaN(v)) return "-";
  return Number(v).toFixed(0);
}

function badgeStatus(status) {
  const s = (status || "").toLowerCase();
  return s === "aberto" ? "Aberto" : "Fechado";
}

function ucfirst(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

/** =========================
 *  CARREGA VENUE + FEATURES
 *  ========================= */
async function fetchVenue({ slug, id }) {
  let query = supabase.from("venues").select("*");
  if (slug) query = query.eq("slug", slug).single();
  else if (id) query = query.eq("id", id).single();
  else throw new Error("Passe ?slug=... ou ?id=... na URL.");

  const { data: venue, error } = await query;
  if (error) throw error;
  return venue;
}

async function fetchCatalogFeatures(){
  // catálogo (chip labels)
  const { data, error } = await supabase
    .from("features")
    .select("id, slug, label")
    .order("id");
  if (error) throw error;
  return data;
}

async function fetchVenueFeatures(venueId){
  // slugs do venue (via view ou tabela)
  // Se você tem a view 'venue_features_view' (f.id + f.slug):
  //   select f.slug from venue_features_view vf join features f on f.id = vf.f.id where vf.venue_id=...
  // pra simplificar, leia direto da tabela 'venue_features' + join em JS
  const { data: rows, error } = await supabase
    .from("venue_features")
    .select("feature_id")
    .eq("venue_id", venueId);
  if (error) throw error;
  return rows.map(r=>r.feature_id);
}

/** =========================
 *  RENDER UI
 *  ========================= */
function renderHero(venue){
  $("#hero").style.backgroundImage = venue.image_url
    ? `url("${venue.image_url}")` : "linear-gradient(90deg,#ddd,#eee)";
  $("#avatar").style.backgroundImage = venue.logo_url
    ? `url("${venue.logo_url}")` : "url('/assets/images/placeholder-logo.png')";
}

function renderHeader(venue){
  $("#name").textContent   = venue.name || "Sem nome";
  $("#rating").textContent = venue.rating?.toFixed?.(1) ?? (venue.rating ?? "—");
  $("#status").textContent = badgeStatus(venue.status);

  // Ações (ex.: localização, cardápio, whatsapp, instagram, horários)
  const actions = $("#actions");
  actions.innerHTML = ""; // limpa
  const buildAction = (label, href, iconHtml="")=>{
    if (!href) return;
    const a = document.createElement("a");
    a.className = "action"; a.href = href; a.target = "_blank" ;
    a.innerHTML = `<div class="icon">${iconHtml || "•"}</div><div class="label">${label}</div>`;
    actions.appendChild(a);
  };

  buildAction("Localização", venue.map_url);
  buildAction("Cardápio",    venue.menu_url);
  buildAction("Whatsapp",    venue.whatsapp_url);
  buildAction("Instagram",   venue.instagram_url);
  buildAction("Horários",    venue.hours_url);
}

function renderFeatures(catalog, selectedIds){
  const wrap = $("#features");
  wrap.innerHTML = "";
  catalog.forEach(f=>{
    const isOn = selectedIds.includes(f.id);
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.innerHTML = `<span class="dot"></span> ${f.label}`;
    if (!isOn) chip.style.opacity = .55;
    wrap.appendChild(chip);
  });
}

function renderPosts(posts=[]) {
  // placeholder para quando você ligar com o banco
  const grid = $("#posts");
  grid.innerHTML = "";
  posts.forEach(p=>{
    const el = document.createElement("article");
    el.className = "post-card";
    el.innerHTML = `
      <div class="post-head">${p.title}</div>
      <div class="post-body">
        <div class="post-img" style="background-image:url('${p.image || ''}')"></div>
        <div class="post-text">${p.text || ""}</div>
      </div>`;
    grid.appendChild(el);
  });
}

/** =========================
 *  EDIT MODE (apenas owner)
 *  ========================= */
function buildEditPanel(venue, catalog, selectedIds){
  // cria um drawer simples acima da seção
  const panel = document.createElement("section");
  panel.className = "card";
  panel.style.margin = "8px 0 18px";
  panel.innerHTML = `
    <div class="bar" style="margin-bottom:10px;">
      <h2 style="margin:0;font-size:18px;">Editar informações</h2>
      <div style="display:flex;gap:8px;">
        <button id="saveVenue" class="btn primary">Salvar</button>
      </div>
    </div>

    <div class="cols">
      <div>
        <label>Nome</label>
        <input id="ed_name" value="${venue.name || ""}" />
      </div>
      <div>
        <label>Categoria</label>
        <input id="ed_category" value="${venue.category || ""}" placeholder="bar, restaurante, café..." />
      </div>

      <div>
        <label>Status</label>
        <select id="ed_status">
          <option value="Aberto"   ${venue.status==="Aberto"?"selected":""}>Aberto</option>
          <option value="Fechado"  ${venue.status==="Fechado"?"selected":""}>Fechado</option>
        </select>
      </div>
      <div>
        <label>Nota (0–5)</label>
        <input id="ed_rating" type="number" min="0" max="5" step="0.1" value="${venue.rating ?? ""}" />
      </div>

      <div>
        <label>Preço médio (R$)</label>
        <input id="ed_price" type="number" min="0" step="1" value="${venue.price ?? ""}" />
      </div>
      <div>
        <label>Imagem (banner) URL</label>
        <input id="ed_image" value="${venue.image_url ?? ""}" placeholder="https://..." />
      </div>

      <div class="cols" style="grid-column:1/-1; grid-template-columns:1fr 1fr;">
        <div>
          <label>Logo URL</label>
          <input id="ed_logo" value="${venue.logo_url ?? ""}" placeholder="https://..." />
        </div>
        <div>
          <label>Endereço</label>
          <input id="ed_address" value="${venue.address ?? ""}" />
        </div>
      </div>

      <div class="cols" style="grid-column:1/-1; grid-template-columns:1fr 1fr;">
        <div>
          <label>Latitude</label>
          <input id="ed_lat" type="number" step="0.000001" value="${venue.latitude ?? ""}" />
        </div>
        <div>
          <label>Longitude</label>
          <input id="ed_lng" type="number" step="0.000001" value="${venue.longitude ?? ""}" />
        </div>
      </div>
    </div>

    <label style="margin-top:14px;display:block;">Diferenciais</label>
    <div class="features" id="ed_features"></div>
    <p class="meta" id="saveMsg" style="margin-top:8px;display:none;"></p>
  `;

  // checkboxes de features
  const box = panel.querySelector("#ed_features");
  catalog.forEach(f=>{
    const w = document.createElement("label");
    w.className = "chip";
    w.style.cursor = "pointer";
    const checked = selectedIds.includes(f.id) ? "checked" : "";
    w.innerHTML = `<input type="checkbox" data-id="${f.id}" ${checked}/> ${f.label}`;
    box.appendChild(w);
  });

  // salvar
  panel.querySelector("#saveVenue").addEventListener("click", async ()=>{
    const msg = panel.querySelector("#saveMsg");
    msg.style.display="none";

    const payload = {
      name: $("#ed_name", panel).value.trim(),
      category: $("#ed_category", panel).value.trim(),
      status: $("#ed_status", panel).value,
      rating: Number($("#ed_rating", panel).value) || null,
      price: Number($("#ed_price", panel).value) || null,
      image_url: $("#ed_image", panel).value.trim() || null,
      logo_url: $("#ed_logo", panel).value.trim() || null,
      address: $("#ed_address", panel).value.trim() || null,
      latitude: $("#ed_lat", panel).value ? Number($("#ed_lat", panel).value) : null,
      longitude: $("#ed_lng", panel).value ? Number($("#ed_lng", panel).value) : null,
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from("venues")
      .update(payload)
      .eq("id", venue.id);
    if (upErr){
      msg.textContent = "Erro ao salvar informações do local: " + upErr.message;
      msg.style.color = "#b91c1c"; msg.style.display="block"; return;
    }

    // sincroniza features
    const checkedIds = $$("input[type=checkbox][data-id]", panel)
      .filter(c=>c.checked).map(c=>Number(c.dataset.id));

    // estratégia simples: apaga todas & insere as selecionadas
    const { error: delErr } = await supabase
      .from("venue_features")
      .delete()
      .eq("venue_id", venue.id);
    if (delErr){
      msg.textContent = "Erro ao salvar diferenciais (delete): " + delErr.message;
      msg.style.color = "#b91c1c"; msg.style.display="block"; return;
    }
    if (checkedIds.length){
      const rows = checkedIds.map(fid=>({ venue_id: venue.id, feature_id: fid }));
      const { error: insErr } = await supabase.from("venue_features").insert(rows);
      if (insErr){
        msg.textContent = "Erro ao salvar diferenciais (insert): " + insErr.message;
        msg.style.color = "#b91c1c"; msg.style.display="block"; return;
      }
    }

    msg.textContent = "Informações salvas!";
    msg.style.color = "#065f46"; msg.style.display="block";

    // re-render básico (poderia reconsultar)
    renderHero({ ...venue, ...payload });
    renderHeader({ ...venue, ...payload });
    renderFeatures(catalog, checkedIds);
  });

  // insere logo abaixo do header
  $(".profile-wrap").insertBefore(panel, $(".profile-wrap").children[1]);
}

/** =========================
 *  OWNER CHECK
 *  ========================= */
async function isOwner(venue){
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.id === venue.owner_id;
}

/** =========================
 *  BOOT
 *  ========================= */
(async function main(){
  try{
    // 1) lê params
    const params = getQuery();

    // 2) busca venue
    const venue = await fetchVenue(params);

    // 3) render base
    renderHero(venue);
    renderHeader(venue);

    // 4) features
    const [catalog, selectedIds] = await Promise.all([
      fetchCatalogFeatures(),
      fetchVenueFeatures(venue.id)
    ]);
    renderFeatures(catalog, selectedIds);

    // 5) posts (placeholder - conecte na sua tabela quando tiver)
    renderPosts([
      // { title: "Combo Happy hour", image: "/assets/images/post1.png", text:"..." },
    ]);

    // 6) se for owner, monta painel de edição
    if (await isOwner(venue)){
      buildEditPanel(venue, catalog, selectedIds);
    }
  }catch(err){
    console.error(err);
    alert("Erro ao carregar o perfil: " + err.message);
  }
})();
