const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
async function req(path, opts={}) {
  const r = await fetch(`${API}/api${path}`, { ...opts, headers: { "Content-Type": "application/json", ...(opts.headers||{}) } });
  if (!r.ok) { const t = await r.text(); throw new Error(t); }
  return r.json();
}
export const get = (p) => req(p);
export const post = (p, b) => req(p, { method: "POST", body: JSON.stringify(b) });
export const put  = (p, b) => req(p, { method: "PUT", body: JSON.stringify(b) });
