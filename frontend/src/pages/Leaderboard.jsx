const styles = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '80px 20px',
    textAlign: 'center',
  },
  icon: { fontSize: '56px', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' },
  sub: { color: 'var(--text-muted)', fontSize: '14px' },
};

export default function Leaderboard() {
  return (
    <div style={styles.page}>
      <div style={styles.icon}>🏆</div>
      <h1 style={styles.title}>Resultattabell</h1>
      <p style={styles.sub}>Tabellen öppnar efter att VM-gruppspelet startar den 11 juni 2026.</p>
    </div>
  );
}
