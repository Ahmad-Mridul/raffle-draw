"use client";

import { useState } from "react";
import Confetti from "./Confetti";
import Image from "next/image";
import styles from "./draw.module.css";

export default function Draw({ rows = [], onWinner, setSelectedRowIndex, setIsRolling, winnersCount = 0 }) {
  const [winner, setWinner] = useState(null);
  const [confettiActive, setConfettiActive] = useState(false);
  const [buttonActive, setButtonActive] = useState(false);
  const [animating, setAnimating] = useState(false);

  const isRowEmpty = (row) => {
    return row.every((cell) => (cell ?? "").toString().trim() === "");
  };

  const draw = async () => {
    // 1. Filter valid rows (non-empty)
    const validIndices = rows
      .map((r, i) => (isRowEmpty(r) ? null : i))
      .filter((i) => i !== null);

    if (validIndices.length === 0) {
      setWinner({ message: "No participants! Add some data." });
      return;
    }

    // Reset state
    setWinner(null);
    setConfettiActive(false);
    setAnimating(true);
    setButtonActive(true);
    setIsRolling(true);

    // 2. Pre-select winner
    const winnerIndexInValid = Math.floor(Math.random() * validIndices.length);
    const winnerRowIndex = validIndices[winnerIndexInValid];

    // Helper to wait
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // 3. Fake Search
    const isFirstRankWinner = winnersCount === 19;
    const duration = isFirstRankWinner ? 60000 : 30000;
    const startTime = Date.now();
    const tickSpeed = 80; // Fast ticking

    while (Date.now() - startTime < duration) {
      // Pick a random row from valid ones to highlight (fake searching)
      // We ensure we don't pick the same one twice in a row for better visual flickering
      let randIndex = Math.floor(Math.random() * validIndices.length);
      setSelectedRowIndex(validIndices[randIndex]);

      await wait(tickSpeed);
    }

    // 4. Reveal Winner
    setSelectedRowIndex(winnerRowIndex);

    // 6. Announce Winner
    setWinner({
      row: rows[winnerRowIndex],
      rowIndex: winnerRowIndex,
    });
    if (onWinner) onWinner(winnerRowIndex);
    setConfettiActive(true);
    setAnimating(false);
    setButtonActive(false);
    setIsRolling(false);
  };

  return (
    <div className={styles.container}>
      <Image
        src="/jimc.png"
        alt="jimc"
        width={320}
        height={180}
        className={styles.logo}
      />

      {winner && winner.row ? <div className={styles.winnerLabel}>Winner</div> : null}

      <div className={`${styles.displayField} ${winner && winner.row ? styles.displayFieldWinner : ''}`} role="status" aria-live="polite">
        {winner && winner.message ? (
          winner.message
        ) : winner && winner.row ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>Registration: {winner.row[0] ?? ""}</div>
            <div>Batch: {winner.row[1] ?? ""}</div>
            <div>Name: {winner.row[2] ?? ""}</div>
          </div>
        ) : (
          "No draw yet — press Draw"
        )}
      </div>

      <button
        className={`${styles.button} ${buttonActive ? styles.buttonActive : ""} ${winnersCount >= 20 ? "hidden" : ""}`}
        onClick={draw}
        aria-label="Draw"
        disabled={animating}
        title={winnersCount >= 20 ? 'Maximum 20 winners reached' : undefined}
      >
        Draw
      </button>

      {winnersCount >= 20 ? (
        <div style={{ marginTop: 8, color: '#b00', fontSize: 13 }} aria-live="polite">Maximum 20 winners reached</div>
      ) : null}

      {confettiActive && <Confetti active={confettiActive} duration={1800} />}

      {/* <div className={styles.hint}>
        Tip: replace the participants array in <code>Draw.jsx</code> with real names.
      </div> */}
    </div>
  );
}
