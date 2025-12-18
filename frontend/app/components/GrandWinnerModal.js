"use client";

import styles from "./grandWinnerModal.module.css";
import Confetti from "./Confetti";

export default function GrandWinnerModal({ winner, onClose }) {
    if (!winner || !winner.row) return null;

    return (
        <div className={styles.overlay}>
            {/* Continuous confetti for the grand winner */}
            <Confetti active={true} duration={10000} mode="corner-blast" />

            <div className={styles.content}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    &times;
                </button>

                <div className={styles.rankBadge}>
                    🏆 Rank #1 GRAND WINNER 🏆
                </div>

                <h2 className={styles.congratsTitle}>Congratulations!</h2>

                <div className={styles.winnerName}>
                    {winner.row[2] || winner.row[0] || ""}
                </div>

                <div className={styles.details}>
                    <div className={styles.detailItem}>
                        <span>ID: </span>
                        <strong>{winner.row[0] ?? ""}</strong>
                    </div>
                    <div className={styles.detailItem}>
                        <span>Batch: </span>
                        <strong>{winner.row[1] ?? ""}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
