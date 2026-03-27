// Middleware handles all redirects (/ → /budget or /auth) at the edge.
// This page is never rendered in practice — it's a static fallback only.
export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0C]" />
  );
}
