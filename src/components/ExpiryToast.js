import React, { useState, useEffect, useRef } from 'react';

const DURATION_MS = 10000; // 10 seconds total display time

/**
 * ExpiryToast
 * Props:
 *   expiryTime  — ISO string from backend (e.g. "2026-04-11T12:30:00.000Z")
 *   onDismiss   — callback fired when toast hides (auto or manual)
 */
function ExpiryToast({ expiryTime, sentToEmail, onDismiss }) {
  const [progress, setProgress] = useState(100); // 100 → 0
  const [fading, setFading] = useState(false);
  const startTime = useRef(Date.now());
  const rafRef = useRef(null);

  // Format ISO → "HH:MM AM/PM"
  const availableTill = expiryTime
    ? new Date(expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Keep onDismiss in a ref so we can call it without it being a dep of the effect
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  // Smooth drain via requestAnimationFrame — far smoother than setInterval
  useEffect(() => {
    startTime.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Bar drained → begin fade-out
        setFading(true);
        setTimeout(() => onDismissRef.current?.(), 400); // wait for fade animation
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // ← empty deps: run only once on mount

  // Progress bar colour: always green
  const barColor = `hsl(120, 72%, 48%)`;

  return (
    <div className={`et-wrap ${fading ? 'et-wrap--fading' : ''}`} role="status">
      {/* Header row */}
      <div className="et-header">
        <span className="et-icon">✉️</span>
        <div className="et-text">
          <p className="et-title">Code Sent via Email!</p>
          <p className="et-sub">
            {sentToEmail ? <>Emailed to <strong>{sentToEmail}</strong> • </> : null}
            Valid till <strong className="et-time">{availableTill}</strong>
          </p>
        </div>
        <button className="et-close" onClick={() => { setFading(true); setTimeout(() => onDismiss?.(), 400); }} aria-label="Dismiss">
          ✕
        </button>
      </div>


      {/* Draining progress bar */}
      <div className="et-bar-track">
        <div
          className="et-bar-fill"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${barColor}, hsl(120, 80%, 60%))`,
          }}
        />
      </div>
    </div>
  );
}

export default ExpiryToast;
