// /nav.js (versão robusta)

const NAV_CSS = `
.navbar{
  position:sticky; top:0; z-index:30;
  background:#dc2626; color:#fff;
  box-shadow:0 1px 0 rgba(0,0,0,.06);
  min-height:64px;
}
.navbar .nav-wrap{
  max-width:1120px; margin:0 auto; padding:0 16px;
  height:64px; display:flex; align-items:center; justify-content:space-between;
}
.navbar .brand{
  font-weight:800; letter-spacing:.04em; font-size:18px;
  color:#fff; text-decoration:none;
}

/* reserva espaço para o badge no meio */
.navbar .nav-center{
  display:flex; gap:94px;
  padding:0 96px;                     /* << mais espaço lateral pro badge */
}
.navbar .nav-link{
  color:#fff; text-decoration:none; opacity:.9; padding:8px 0;
  border-bottom:2px solid transparent; font-weight:700;
}
.navbar .nav-link.is-active{ opacity:1; border-color:#fff; }

.navbar .nav-right{ display:flex; align-items:center; gap:12px; }
.navbar .nav-login{
  background:rgba(255,255,255,.08);
  padding:8px 12px; border-radius:10px;
  color:#fff; font-weight:600; text-decoration:none;
  display:inline-flex; align-items:center; gap:8px;
}
.navbar .nav-avatar{
  width:28px; height:28px; border-radius:999px; background:#fff; color:#dc2626;
  display:inline-flex; align-items:center; justify-content:center; font-weight:800;
}

/* badge central */
.navbar .nav-badge{
  width:64px; height:64px; border-radius:999px;
  background:#dc2626;                 /* << mesma cor da barra */
  border:2px solid #dc2626;
  display:flex; align-items:center; justify-content:center;
  margin:-60px auto 0;                 /* “pendura” 32px sobre a barra */
  position:relative; z-index:1;
  box-shadow:0 6px 18px rgba(0,0,0,.12);
}
.navbar .nav-badge img{
  width:30px; height:30px; display:block;
  /* deixa QUALQUER imagem branca */
}

/* responsivo */
@media (max-width:720px){
  .navbar .nav-center{ gap:18px; padding:0 84px; }
  .navbar .nav-badge{ width:56px; height:56px; margin:-28px auto 0; }
  .navbar .nav-badge img{ width:26px; height:26px; }
}
`;

// injeta CSS uma única vez
(function injectStyleOnce(){
  if (document.getElementById("__nav_css__")) return;
  const style = document.createElement("style");
  style.id = "__nav_css__";
  style.textContent = NAV_CSS;
  document.head.appendChild(style);
})();

function inferActive(){
  const p = location.pathname.toLowerCase();
  if (p.includes("/feed")) return "feed";
  if (p.includes("/menu")) return "menu";
  return "";
}

// render imediato SEM depender do Supabase
export function mountNav({ active = "", logoSrc = "/assets/logo.svg", target = "#app-nav" } = {}){
  const host = document.querySelector(target);
  if (!host) {
    console.warn("[nav] alvo não encontrado:", target);
    return;
  }

  // base já renderiza
  host.innerHTML = `
    <div class="nav-wrap" role="navigation" aria-label="Barra de navegação">
      <a class="brand" href="/">SPHERA</a>
      <nav class="nav-center">
        <a href="/menu.html" class="nav-link" data-key="menu">Menu</a>
        <a href="/feed.html" class="nav-link" data-key="feed">Feed</a>
      </nav>
      <div class="nav-right">
        <a class="nav-login" href="/login.html">Login</a>
      </div>
    </div>
    <div class="nav-badge">
      <img src="${logoSrc}" alt="Sphera">
    </div>
  `;

  // marca ativo
  const key = active || inferActive();
  host.querySelector(`.nav-link[data-key="${key}"]`)?.classList.add("is-active");

  // tenta atualizar lado direito quando o Supabase estiver disponível
  tryUpdateRight(host);
  // e fica escutando mudanças de sessão (se/assim que supabase existir)
  startAuthWatcher(host);
}

// tenta montar o lado direito (perfil/login) se supabase existir
async function updateRight(host){
  const right = host.querySelector(".nav-right");
  if (!right) return;

  const supabase = window.supabase;
  if (!supabase) { // sem supabase → mostra Login
    right.innerHTML = `<a class="nav-login" href="/login.html">Login</a>`;
    return;
  }

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) {
    right.innerHTML = `<a class="nav-login" href="/login.html">Login</a>`;
    return;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("role,name")
      .eq("id", user.id)
      .single();
    const role = (data?.role || "USER").toUpperCase();
    const initial = (data?.name?.trim()?.[0] || user.email?.[0] || "U").toUpperCase();
    const profileLink = role === "OWNER" ? "/owner.html" : "/user.html";
    right.innerHTML = `<a class="nav-login" href="${profileLink}" title="Seu perfil"><span class="nav-avatar">${initial}</span></a>`;
  } catch {
    right.innerHTML = `<a class="nav-login" href="/user.html"><span class="nav-avatar">U</span></a>`;
  }
}

// chama updateRight assim que o supabase existir (ou já de cara)
function tryUpdateRight(host){
  if (window.supabase) return updateRight(host);
  // espera um pouco pelo client do head (2s máx)
  let tries = 0;
  const id = setInterval(() => {
    tries++;
    if (window.supabase || tries > 20){ // 20 * 100ms = 2s
      clearInterval(id);
      updateRight(host);
    }
  }, 100);
}

// escuta mudanças de auth quando disponível
function startAuthWatcher(host){
  if (!window.supabase) {
    // tenta de novo em 500ms
    setTimeout(() => startAuthWatcher(host), 500);
    return;
  }
  window.supabase.auth.onAuthStateChange(() => updateRight(host));
}
