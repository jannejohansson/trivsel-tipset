export default function LockBanner() {
  return (
    <div style={{
      background: 'var(--green-dim)',
      border: '1px solid var(--green)',
      color: 'var(--green)',
      padding: '12px 20px',
      borderRadius: 'var(--radius)',
      textAlign: 'center',
      margin: '0 0 24px',
      fontSize: '14px',
    }}>
      🔒 Tipsen är låsta — VM har startat. Du kan fortfarande se dina tips.
    </div>
  );
}
