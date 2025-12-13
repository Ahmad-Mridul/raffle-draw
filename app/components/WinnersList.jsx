"use client";

import styles from "./winnersList.module.css";

export default function WinnersList({ winners = [] }) {
  // winners is expected to be an array of objects or rows. 
  // Based on page.js, rows are arrays: [ID, Batch, Name].
  // let's assume valid winner rows are passed.

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Winners List ({winners.length})</h2>
      <div className={styles.listWrap}>
        {winners.length === 0 ? (
          <div className={styles.empty}>No winners yet</div>
        ) : (
          <ul className={styles.list}>
            {winners.slice().reverse().map((winner, idx) => {
               // winners array has order [1st winner, 2nd winner...]
               // visual list is reversed: [Last winner, ... 1st winner]
               // If we want 20 down to 1: 
               // 1st winner = #20
               // 2nd winner = #19
               // Last winner (at top of list, index idx=0 in map) is... 
               // Wait, map is on the *reversed* list. 
               // Original length = L. 
               // Loop item 0 (latest) -> corresponds to original index L-1.
               // Rank = 20 - (original index).
               // Original index = winners.length - 1 - idx.
               // Rank = 20 - (winners.length - 1 - idx).
               // Example: 1 winner. Length 1. Reversed map idx 0. Orig index 0. Rank = 20 - 0 = 20. Correct.
               // Example: 2 winners. Length 2. 
               // Reversed map item 0 (2nd winner). Orig index 1. Rank = 20 - 1 = 19. Correct.
               
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
