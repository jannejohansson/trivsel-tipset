const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
    fontWeight: 600,
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    marginTop: '8px',
  },
  page: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    margin: '24px 0 12px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  intro: {
    padding: '20px 22px',
    borderLeft: '3px solid var(--green)',
    color: 'var(--text)',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  pointsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  pointsItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  pointsItemLast: {
    borderBottom: 'none',
  },
  pointBadge: {
    width: '52px',
    height: '52px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(21,163,74,0.25)',
  },
  pointNum: {
    fontSize: '22px',
    lineHeight: 1,
  },
  pointUnit: {
    fontSize: '9px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginTop: '2px',
    opacity: 0.85,
  },
  pointBody: {
    flex: 1,
    minWidth: 0,
  },
  pointName: {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '2px',
  },
  pointDesc: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  maxBanner: {
    background: 'var(--green-dim)',
    color: '#0b6b32',
    padding: '12px 20px',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '0.3px',
  },
  exampleCard: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
  },
  exampleCardLast: {
    borderBottom: 'none',
  },
  exampleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  exampleLabel: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    minWidth: '78px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  scorePill: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '14px',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--text)',
  },
  scorePillActual: {
    background: '#0d1b2a',
    color: '#ffffff',
    borderColor: 'transparent',
  },
  exampleResult: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pointsTag: {
    background: 'var(--green)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '14px',
    padding: '4px 12px',
    borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums',
  },
  pointsTagZero: {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
  },
  exampleBreakdown: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '8px',
    lineHeight: 1.5,
  },
  bullet: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  bulletItem: {
    padding: '14px 20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    borderBottom: '1px solid var(--border)',
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.5,
  },
  bulletDot: {
    width: '8px',
    height: '8px',
    borderRadius: '999px',
    background: 'var(--green)',
    marginTop: '8px',
    flexShrink: 0,
  },
};

const POINTS = [
  {
    points: 1,
    name: 'Rätt 1X2-utgång',
    desc: 'Du har tippat rätt på om matchen slutar med hemmavinst, oavgjort eller bortavinst.',
  },
  {
    points: 1,
    name: 'Rätt antal hemmamål',
    desc: 'Du har gissat hur många mål hemmalaget gör. Räknas separat — du får poängen även om utgången blir fel.',
  },
  {
    points: 1,
    name: 'Rätt antal bortamål',
    desc: 'Du har gissat hur många mål bortalaget gör. Räknas också separat.',
  },
  {
    points: 2,
    name: 'Bonus för exakt resultat',
    desc: 'Får du alla tre delpoängen — alltså exakt rätt slutresultat — får du ytterligare 2 poäng på toppen.',
    bonus: true,
  },
];

const EXAMPLES = [
  {
    tip: { h: 2, a: 1 }, actual: { h: 2, a: 1 }, points: 5,
    breakdown: 'Rätt utgång (1p) + rätt hemmamål (1p) + rätt bortamål (1p) + exakt-bonus (2p).',
  },
  {
    tip: { h: 2, a: 0 }, actual: { h: 2, a: 1 }, points: 2,
    breakdown: 'Rätt utgång (1p) + rätt hemmamål (1p). Bortamål fel — ingen bonus.',
  },
  {
    tip: { h: 3, a: 1 }, actual: { h: 2, a: 1 }, points: 2,
    breakdown: 'Rätt utgång (1p) + rätt bortamål (1p). Hemmamål fel.',
  },
  {
    tip: { h: 2, a: 2 }, actual: { h: 2, a: 1 }, points: 1,
    breakdown: 'Hemmamål rätt (1p). Du tippade oavgjort så utgången blev fel.',
  },
  {
    tip: { h: 0, a: 1 }, actual: { h: 2, a: 1 }, points: 1,
    breakdown: 'Bortamål rätt (1p). Bortavinst blev hemmavinst — utgång fel.',
  },
  {
    tip: { h: 1, a: 2 }, actual: { h: 2, a: 1 }, points: 0,
    breakdown: 'Fel utgång, fel antal mål på båda lagen. Inga poäng den här gången.',
  },
];

function ScorePill({ score, actual }) {
  return (
    <span style={{ ...styles.scorePill, ...(actual ? styles.scorePillActual : {}) }}>
      {score.h} – {score.a}
    </span>
  );
}

export default function Regler() {
  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Regler</h1>
        <p style={styles.sub}>Så fungerar poängräkningen</p>
      </section>

      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.intro}>
            Du tippar ett resultat på varje match i gruppspelet. Poäng delas ut på fyra
            sätt och staplas — du kan alltså få poäng även om du bommar utgången, så
            länge du har rätt antal mål på något av lagen.
          </div>
        </div>

        <div style={styles.sectionTitle}>Så räknas poängen</div>
        <div style={styles.card}>
          <ul style={styles.pointsList}>
            {POINTS.map((p, i) => (
              <li
                key={p.name}
                style={{ ...styles.pointsItem, ...(i === POINTS.length - 1 ? styles.pointsItemLast : {}) }}
              >
                <div style={styles.pointBadge}>
                  <span style={styles.pointNum}>{p.bonus ? `+${p.points}` : p.points}</span>
                  <span style={styles.pointUnit}>poäng</span>
                </div>
                <div style={styles.pointBody}>
                  <div style={styles.pointName}>{p.name}</div>
                  <div style={styles.pointDesc}>{p.desc}</div>
                </div>
              </li>
            ))}
          </ul>
          <div style={styles.maxBanner}>Max 5 poäng per match</div>
        </div>

        <div style={styles.sectionTitle}>Exempel</div>
        <div style={styles.card}>
          {EXAMPLES.map((ex, i) => (
            <div
              key={i}
              style={{ ...styles.exampleCard, ...(i === EXAMPLES.length - 1 ? styles.exampleCardLast : {}) }}
            >
              <div style={styles.exampleRow}>
                <span style={styles.exampleLabel}>Ditt tips</span>
                <ScorePill score={ex.tip} />
                <span style={styles.exampleLabel}>Facit</span>
                <ScorePill score={ex.actual} actual />
                <div style={styles.exampleResult}>
                  <span style={{ ...styles.pointsTag, ...(ex.points === 0 ? styles.pointsTagZero : {}) }}>
                    {ex.points} p
                  </span>
                </div>
              </div>
              <div style={styles.exampleBreakdown}>{ex.breakdown}</div>
            </div>
          ))}
        </div>

        <div style={styles.sectionTitle}>Övrigt att veta</div>
        <div style={styles.card}>
          <ul style={styles.bullet}>
            <li style={styles.bulletItem}>
              <span style={styles.bulletDot} />
              <span>Du kan ändra ditt tips ända fram till avspark. När matchen startar låses tipset automatiskt.</span>
            </li>
            <li style={styles.bulletItem}>
              <span style={styles.bulletDot} />
              <span>Ett otippat resultat ger 0 poäng — så det lönar sig att fylla i alla matcher i förväg.</span>
            </li>
            <li style={styles.bulletItem}>
              <span style={styles.bulletDot} />
              <span>Bara ordinarie speltid räknas. Eventuellt övertid eller straffläggning i slutspelet påverkar inte poängen för gruppspelet.</span>
            </li>
            <li style={{ ...styles.bulletItem, borderBottom: 'none' }}>
              <span style={styles.bulletDot} />
              <span>Vinnaren av Trivseltipset 2026 är den med flest poäng efter sista gruppspelsmatchen den 27 juni.</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
