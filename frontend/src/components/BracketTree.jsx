import { BRACKET_LAYOUT, ROUND_ORDER, ROUND_LABELS } from '../lib/bracket.js';

// Compact kickoff stamp in Swedish style/local time, e.g. "29/6 21:00".
const fmtKickoff = (utc) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Stockholm', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(utc)).map((x) => [x.type, x.value])
  );
  return `${p.day}/${p.month} ${p.hour}:${p.minute}`;
};

function Row({ slot, decided, locked, selected, hasPick, onPick }) {
  const clickable = decided && !locked;
  const cls = [
    'bracket-row',
    clickable ? 'clickable' : '',
    selected ? 'picked' : '',
    !selected && hasPick && decided ? 'dimmed' : '',
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} disabled={!clickable} onClick={clickable ? onPick : undefined} aria-pressed={selected}>
      {slot.team ? (
        <>
          <span className={`fi fi-${slot.flag} bk-flag`} aria-hidden="true" />
          <span className="bk-name">{slot.team}</span>
        </>
      ) : (
        <span className="bk-placeholder">{slot.label}</span>
      )}
    </button>
  );
}

// Connected single-direction draw tree (R32 → Final). Each round is a flex column
// of equal-height cells, so a round with half the games centres each game between
// its two feeders; CSS pseudo-elements draw the connector lines.
export default function BracketTree({ matches, locked, onPick }) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  return (
    <div className="bracket-wrap">
      <div className="bracket">
        {ROUND_ORDER.map((round, ri) => (
          <div className="bracket-col" key={round}>
            <div className="bracket-col-title">{ROUND_LABELS[round]}</div>
            <div className={`bracket-round${ri === 0 ? ' bk-first' : ''}${round === 'F' ? ' bk-final' : ''}`}>
              {BRACKET_LAYOUT[round].map((id) => {
                const m = byId.get(id);
                if (!m) return null;
                const decided = m.complete;
                const hasPick = !!m.pick;
                return (
                  <div className="bracket-match" key={id}>
                    <div className="bracket-box">
                      <div className="bracket-num">Match {m.num}{m.kickoffUtc ? ` · ${fmtKickoff(m.kickoffUtc)}` : ''}</div>
                      <Row slot={m.home} decided={decided} locked={locked} hasPick={hasPick}
                        selected={hasPick && m.pick === m.home.team} onPick={() => onPick(m.id, m.home.team)} />
                      <Row slot={m.away} decided={decided} locked={locked} hasPick={hasPick}
                        selected={hasPick && m.pick === m.away.team} onPick={() => onPick(m.id, m.away.team)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
