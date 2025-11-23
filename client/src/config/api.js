export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:4000";

export const resolveImageUrl = (u) => {
  if (!u) return "";
  return u.startsWith("/uploads/") ? `${API_BASE}${u}` : u;
};
