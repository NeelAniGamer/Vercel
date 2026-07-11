/* Traffic Academy Theme Tokens — mirrors :root CSS vars from Academy.html */

export const t = {
  bg: '#f5f0e8',
  card: '#ffffff',
  text: '#1a1a1a',
  muted: '#888888',
  muted2: '#aaaaaa',
  border: '#e0e0e0',
  accent: '#3b8c66',
  accent2: '#60c8a0',
  green: '#00c851',
  red: '#ff3b30',
  hover: '#e8e3d8',
  glass: 'rgba(255,255,255,0.55)',
  glass2: 'rgba(255,255,255,0.85)',
}

/* Shared style fragments */
export const btn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 20px',
  borderRadius: 12,
  border: 'none',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all .15s',
}

export const card: React.CSSProperties = {
  background: t.card,
  padding: 20,
  borderRadius: 16,
  border: `1px solid ${t.border}`,
  width: '100%',
}

export const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: t.muted,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  marginBottom: 4,
}
