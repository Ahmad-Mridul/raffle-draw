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
        await fetch('https://raffle-draw-dl86.onrender.com/winners/reset', { method: 'POST' });
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

              let rankClass = '';
              if (rank === 1) rankClass = styles.rank1;
              else if (rank === 2) rankClass = styles.rank2;
              else if (rank === 3) rankClass = styles.rank3;

              return (
                <li key={idx} className={`${styles.item} ${rankClass}`}>
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




// for the top 3 winners: add more special effects

// number 3: a little more than the others
// number 2: more than number 3
// number 1: more than number 2