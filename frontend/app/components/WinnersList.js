"use client";

import { useState } from "react";
import styles from "./winnersList.module.css";

export default function WinnersList({ winners = [], onReset }) {
  // winners is expected to be an array of rows: [ID, Batch, Name].
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!winners.length) return;
    // confirm destructive action
    if (!confirm('Reset winners back into participants?')) return;
    setIsResetting(true);
    try {
      if (onReset) {
        await onReset();
      } else {
        await fetch('http://localhost:5000/winners/reset', { method: 'POST' });
      }
    } catch (err) {
      console.error('Reset failed', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className={styles.title}>Winners List ({winners.length})</h2>
        <div>
          <button className={styles.resetBtn} onClick={handleReset} disabled={isResetting || winners.length === 0}>
            {isResetting ? 'Resetting…' : 'Reset'}
          </button>
        </div>
      </div>
      <div className={styles.listWrap}>
        {winners.length === 0 ? (
          <div className={styles.empty}>No winners yet</div>
        ) : (
          <ul className={styles.list}>
            {winners.slice().reverse().map((winner, idx) => {
              // Calculate ranking where 1st winner -> #20, 2nd -> #19, ...
              const originalIndex = winners.length - 1 - idx;
              const rank = 20 - originalIndex;

              return (
                <li key={idx} className={styles.item}>
                  <span className={styles.rank}>#{rank}</span>
                  <span className={styles.id}>{winner[0]}</span>
                  <span className={styles.name}>{winner[2]}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
