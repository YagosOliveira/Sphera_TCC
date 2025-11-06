// recommend.js
// Util de distância (km)
function haversineKm(lat1, lon1, lat2, lon2){
  if([lat1,lon1,lat2,lon2].some(v=>v==null)) return null;
  const toRad = d=>d*Math.PI/180, R=6371;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

// Constrói um Map slug->peso a partir de user_feature_prefs
export async function loadUserContext(supabase){
  const { data: { user } } = await supabase.auth.getUser();
  const ctx = { user, prefs: new Map(), profile: null };
  if (!user) return ctx;

  const [{ data: prof }, { data: prefs }] = await Promise.all([
    supabase.from('profiles')
      .select('home_lat,home_lng,max_distance_km,budget_level').eq('id', user.id).single(),
    supabase.from('user_feature_prefs')
      .select('feature_id, weight')
      .eq('user_id', user.id)
  ]);

  ctx.profile = prof || null;

  // precisamos mapear feature_id -> slug
  const { data: feats } = await supabase.from('features').select('id,slug');
  const idToSlug = new Map((feats||[]).map(f=>[f.id, f.slug]));
  (prefs||[]).forEach(r=>{
    const slug = idToSlug.get(r.feature_id);
    if (slug) ctx.prefs.set(slug, r.weight);
  });

  return ctx;
}

// Calcula score para um venue
export function scoreVenue(venue, userProfile, userPrefMap){
  let score = 0;

  // 1) match de features
  const slugs = venue.feature_slugs || [];
  for (const s of slugs){
    const w = userPrefMap?.get(s) || 0;
    score += w * 10;
  }

  // 2) distância
  const lat = userProfile?.home_lat, lng = userProfile?.home_lng;
  const maxD = userProfile?.max_distance_km;
  const d = (lat!=null && lng!=null) ? haversineKm(lat, lng, venue.lat, venue.lng) : null;
  if (d!=null && maxD){
    const f = Math.max(0, 1 - (d / maxD)); // 1 perto → 0 longe
    score += f * 20;
  }

  // 3) preço (aproximação)
  const budget = userProfile?.budget_level;
  const price  = venue.avg_price ?? venue.price ?? null;
  if (budget!=null && price!=null){
    const diff = Math.abs(budget - price);
    score += Math.max(0, 10 - diff*2);
  }

  // 4) bônus
  if ((venue.status||'').toLowerCase()==='aberto') score += 5;
  if (venue.rating!=null) score += Number(venue.rating);

  return score;
}

// Anota e ordena
export function scoreAndSort(venues, userProfile, userPrefMap){
  return (venues||[]).map(v=>({
    ...v,
    _score: scoreVenue(v, userProfile, userPrefMap)
  })).sort((a,b)=> b._score - a._score);
}
