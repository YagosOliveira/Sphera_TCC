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
  $("#hero").style.backgroundImage = venue.cover_url
    ? `url("${venue.cover_url}")` : "linear-gradient(90deg,#ddd,#eee)";
  $("#avatar").style.backgroundImage = venue.logo_url
    ? `url("${venue.logo_url}")` : "url('/assets/images/placeholder-logo.png')";
}

function renderHeader(venue){
  $("#name").textContent   = venue.name || "Sem nome";
  $("#rating").textContent = venue.rating?.toFixed?.(1) ?? (venue.rating ?? "—");
  $("#status").textContent = badgeStatus(venue.status);

  const actions = $("#actions");
  actions.innerHTML = "";

  // helper pra montar os botões
  const buildAction = (label, href, iconHtml) => {
    if (!href) return; // se não tiver link, nem mostra o botão

    const a = document.createElement("a");
    a.className = "action";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = `
      <div class="icon">${iconHtml}</div>
      <div class="label">${label}</div>
    `;
    actions.appendChild(a);
  };

  // Se você salva só o número no Whats, monta o link aqui
  let wa = venue.whatsapp_url;
  if (wa && !wa.startsWith("http")) {
    wa = `https://wa.me/55${wa.replace(/\D/g, "")}`;
  } 

  // aqui você escolhe os ícones – usei emoji pra ficar plug-and-play
  buildAction("", venue.map_url,    `<img src="./assets/icons/pin.svg" alt="Localização">`);
  buildAction("",    venue.menu_url,   `<img src="./assets/icons/menu.svg" alt="Cardápio">`);
  buildAction("",    venue.whatsapp_url, `<img src="./assets/icons/whatsapp.svg" alt="Whatsapp">`);
  buildAction("",   venue.instagram_url, `<img src="./assets/icons/instagram.svg" alt="Instagram">`);
  buildAction("",    venue.hours_url,  `<img src="./assets/icons/clock.svg" alt="Horários">`);
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

function renderPosts(posts = []) {
  const grid = document.getElementById('posts');
  if (!Array.isArray(posts)) posts = [];  // Garantir que seja um array
  grid.innerHTML = posts.length ? posts.map(p => `
    <article class="post-card">
      <div class="post-head">
        <div>${p.title || '(Sem título)'}</div>
        ${p.published ? '' : '<span class="status-pill" style="margin-left:8px;">Rascunho</span>'}
      </div>
      <div class="post-body">
        ${p.image_url ? `<div class="post-img" style="background-image:url('${p.image_url}')"></div>` : ''}
        ${p.body ? `<div class="post-text">${p.body}</div>` : ''}
      </div>
    </article>
  `).join('') : `<p class="meta">Sem postagens ainda.</p>`;  // Caso esteja vazio
}

// ========PARA BAIXO É A EDIÇÃO ==========
// ========PARA BAIXO É A EDIÇÃO ==========
// ========PARA BAIXO É A EDIÇÃO ==========


/** =========================
 *  EDIT MODE (apenas owner)
 *  ========================= */
function buildEditModal(venue, catalog, selectedIds){
  const body = document.getElementById('modalBody');
  body.innerHTML = `
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
          <option value="aberto"  ${(venue.status?.toLowerCase()==="aberto")?"selected":""}>Aberto</option>
          <option value="fechado" ${(venue.status?.toLowerCase()==="fechado")?"selected":""}>Fechado</option>
        </select>
      </div>
      <div>
        <label>Nota (0–5)</label>
        <input id="ed_rating" type="number" min="0" max="5" step="0.1" value="${venue.rating ?? ""}" />
      </div>

      <div>
        <label>Preço médio (R$)</label>
        <input id="ed_price" type="number" min="0" step="1" value="${venue.avg_price ?? venue.price ?? ""}" />
      </div>
      <div>
        <label>Imagem (banner) URL</label>
        <input id="ed_image" value="${venue.cover_url ?? venue.image_url ?? ""}" placeholder="https://..." />
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
          <input id="ed_lat" type="number" step="0.000001" value="${venue.lat ?? venue.latitude ?? ""}" />
        </div>
        <div>
          <label>Longitude</label>
          <input id="ed_lng" type="number" step="0.000001" value="${venue.lng ?? venue.longitude ?? ""}" />
        </div>
      </div>
    </div>

    <label style="margin-top:14px;display:block;">Diferenciais</label>
    <div class="features" id="ed_features"></div>

    <div style="display:flex; gap:8px; margin-top:14px;">
      <button id="saveVenue" class="btn">Salvar</button>
      <button id="cancelEdit" class="btn ghost">Cancelar</button>
    </div>
    <p class="meta" id="saveMsg" style="margin-top:8px;display:none;"></p>
  `;

  // fecha modal
  document.getElementById('modalClose').onclick = closeModal;
  body.querySelector('#cancelEdit').onclick = closeModal;

  // chips de features
  const box = body.querySelector("#ed_features");
  catalog.forEach(f=>{
    const w = document.createElement("label");
    w.className = "chip"; w.style.cursor = "pointer";
    const checked = selectedIds.includes(f.id) ? "checked" : "";
    w.innerHTML = `<input type="checkbox" data-id="${f.id}" ${checked}/> ${f.label}`;
    box.appendChild(w);
  });

  // salvar
  body.querySelector("#saveVenue").addEventListener("click", async ()=>{
    const msg = body.querySelector("#saveMsg");
    msg.style.display="none";

    const payload = {
      name: body.querySelector("#ed_name").value.trim(),
      category: body.querySelector("#ed_category").value.trim(),
      status: body.querySelector("#ed_status").value,
      rating: Number(body.querySelector("#ed_rating").value) || null,
      avg_price: Number(body.querySelector("#ed_price").value) || null,
      cover_url: body.querySelector("#ed_image").value.trim() || null,  // banner/capa
      logo_url:  body.querySelector("#ed_logo").value.trim()  || null,
      address:   body.querySelector("#ed_address").value.trim() || null,
      lat: body.querySelector("#ed_lat").value ? Number(body.querySelector("#ed_lat").value) : null,
      lng: body.querySelector("#ed_lng").value ? Number(body.querySelector("#ed_lng").value) : null,
      //updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await supabase.from("venues").update(payload).eq("id", venue.id);
    if (upErr){
      msg.textContent = "Erro ao salvar: " + upErr.message;
      msg.style.color = "#b91c1c"; msg.style.display="block"; return;
    }

    // features
    const checkedIds = [...body.querySelectorAll("input[type=checkbox][data-id]")]
      .filter(c=>c.checked).map(c=>Number(c.dataset.id));
    const { error: delErr } = await supabase.from("venue_features").delete().eq("venue_id", venue.id);
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

    // re-render da página
    const merged = { ...venue, ...payload };
    renderHero(merged);
    renderHeader(merged);
    renderFeatures(catalog, checkedIds);

    setTimeout(closeModal, 700);
  });

  openModal();
}



// ========PARA BAIXO É O GRID DE POSTS ==========
// ========PARA BAIXO É O GRID DE POSTS ==========
// ========PARA BAIXO É O GRID DE POSTS ==========


// ===== Upload helper (bucket 'posts')
async function uploadPostImage(file, userId, venueId){
  if (!file) return null;
  const path = `${userId}/${venueId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage
      .from('posts')
      .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from('posts').getPublicUrl(path);
  return pub.publicUrl;
}

// ===== Modal de nova postagem
function buildPostModal(venue){
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div class="cols">
      <div style="grid-column:1/-1">
        <label>Título</label>
        <input id="post_title" placeholder="Ex.: Combo Happy Hour" />
      </div>
      <div style="grid-column:1/-1">
        <label>Descrição</label>
        <textarea id="post_body" placeholder="Texto da sua postagem"></textarea>
      </div>
      <div>
        <label>Imagem (opcional)</label>
        <input type="file" id="post_image" accept="image/*" />
      </div>
      <div>
        <label>Publicar agora?</label>
        <select id="post_published">
          <option value="true" selected>Sim</option>
          <option value="false">Salvar como rascunho</option>
        </select>
      </div>
    </div>

    <div style="display:flex; gap:8px; margin-top:14px;">
      <button id="btnPublish" class="btn">Publicar</button>
      <button id="btnCancelPost" class="btn ghost">Cancelar</button>
    </div>
    <p class="meta" id="postMsg" style="margin-top:8px; display:none;"></p>
  `;

  document.getElementById('editTitle').textContent = 'Nova postagem';
  document.getElementById('modalClose').onclick = closeModal;
  body.querySelector('#btnCancelPost').onclick = closeModal;

  body.querySelector('#btnPublish').addEventListener('click', async ()=>{
    const msg = body.querySelector('#postMsg');
    msg.style.display = 'none';

    const title = body.querySelector('#post_title').value.trim();
    const text  = body.querySelector('#post_body').value.trim();
    const file  = body.querySelector('#post_image').files?.[0] || null;
    const published = body.querySelector('#post_published').value === 'true';

    if (!title){
      msg.textContent = 'Informe um título.'; msg.style.color = '#b91c1c'; msg.style.display='block'; return;
    }

    const { data:{ user } } = await supabase.auth.getUser();
    if (!user){ msg.textContent = 'Sessão expirada.'; msg.style.color='#b91c1c'; msg.style.display='block'; return; }

    // upload (se houver)
    let imageUrl = null;
    try{
      if (file) imageUrl = await uploadPostImage(file, user.id, venue.id);
    }catch(e){
      msg.textContent = 'Erro ao enviar imagem: ' + e.message;
      msg.style.color = '#b91c1c'; msg.style.display='block'; return;
    }

    // grava o post
    const { error: insErr } = await supabase.from('posts').insert([{
      venue_id: venue.id,
      title,
      body: text || null,
      image_url: imageUrl,
      published
    }]);

    if (insErr){
      msg.textContent = 'Erro ao salvar postagem: ' + insErr.message;
      msg.style.color = '#b91c1c'; msg.style.display = 'block'; return;
    }

    msg.textContent = published ? 'Post publicado!' : 'Rascunho salvo.';
    msg.style.color = '#065f46'; msg.style.display = 'block';

    // recarrega posts visíveis
    setTimeout(async ()=>{
      await loadAndRenderPosts(venue);
      closeModal();
    }, 600);
  });

  openModal();
}

// ===== Buscar e renderizar posts
async function fetchPosts(venueId, isOwner){
  let q = supabase.from('posts')
    .select('id, title, body, image_url, created_at, published')
    .eq('venue_id', venueId)
    .order('created_at', { ascending: false });

  if (!isOwner) q = q.eq('published', true);

  const { data, error } = await q;
  if (error) {
    console.error('Erro ao buscar posts:', error);
    return []; // <- garante que retorna um array
  }
  return data || [];
  console.log(posts); // <- evita undefined
}

async function loadAndRenderPosts(venue) {
  const owner = await isOwner(venue);
  let posts = await fetchPosts(venue.id, owner);
  posts = posts || [];  // Garantir que seja um array vazio se não houver posts
  renderPosts(posts);  // Agora chamamos a função de renderização com o array de posts
}






/** =========================
 *  OWNER CHECK
 *  ========================= */
async function isOwner(venue){
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return user.id === venue.owner_id;
}

function openModal(){
  const bd = document.getElementById('editModalBackdrop');
  bd.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeModal(){
  const bd = document.getElementById('editModalBackdrop');
  bd.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
document.addEventListener('click', (e)=>{
  // clique fora fecha
  if (e.target?.id === 'editModalBackdrop') closeModal();
});
document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') closeModal();
});


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
    await loadAndRenderPosts(venue);

    console.log('Venue carregado:', venue);
    console.log('Owner:', await isOwner(venue));

    // 6) se for owner, monta painel de edição
    if (await isOwner(venue)){
      // adiciona um botão "Editar" nas ações do cabeçalho
      const actions = document.getElementById('actions');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn ghost';
      editBtn.textContent = 'Editar';
      editBtn.style.marginLeft = '8px';
      editBtn.onclick = () => buildEditModal(venue, catalog, selectedIds);
      actions.appendChild(editBtn);

    // adiciona um botão "Nova postagem" nas ações do cabeçalho
      const postBtn = document.createElement('button');
      postBtn.className = 'btn ghost';
      postBtn.textContent = 'Nova postagem';
      postBtn.style.marginLeft = '8px';
      postBtn.onclick = () => buildPostModal(venue);
      actions.appendChild(postBtn);
    }

  }catch(err){
    console.error(err);
    alert("Erro ao carregar o perfil: " + err.message);
  }
})();
