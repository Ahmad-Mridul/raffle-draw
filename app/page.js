"use client";

import { useEffect, useState } from "react";
import WinnersList from "./components/WinnersList";
import Draw from "./components/Draw";
import Spreadsheet from "./components/Spreadsheet";
import styles from "./page.module.css";

const page = () => {
  // Lift spreadsheet data here so Draw can use it
  const [cols, setCols] = useState([
    { id: 1, name: "ID" },
    { id: 2, name: "Batch" },
    { id: 3, name: "Full Name" },
  ]);
  const [rows, setRows] = useState([Array(3).fill("")]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winners, setWinners] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/data.json");
        if (!res.ok) throw new Error("Failed to load data");
        const json = await res.json();

        // Map JSON structure to rows
        // JSON structure: { "ID": "250001", "BATCH": "J01", "FULL NAME": "..." }
        const newRows = json.map(item => [
          item["ID"] || "",        // ID
          item["BATCH"] || "",     // Batch
          item["FULL NAME"] || item["Full Name"] || "", // Name
        ]);

        if (newRows.length > 0) {
          setRows(newRows);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <main className={styles.mainGrid}>
      <aside className={styles.leftSidebar}>
        <div className={styles.winnersSection}>
          <WinnersList winners={winners} />
        </div>
        <div className={styles.sheetSection}>
          <Spreadsheet
            cols={cols}
            setCols={setCols}
            rows={rows}
            setRows={setRows}
            selectedRowIndex={selectedRowIndex}
            isRolling={isRolling}
          />
        </div>
      </aside>
      <section className={styles.drawCol}>
        <Draw
          rows={rows}
          setSelectedRowIndex={setSelectedRowIndex}
          setIsRolling={setIsRolling}
          onWinner={(rowIndex) => {
             setSelectedRowIndex(rowIndex);
             const winner = rows[rowIndex];
             
             // Add to winners list
             setWinners((prev) => [...prev, winner]);
             
             // Remove from spreadsheet rows
             // Use setTimeout to allow any animations in Draw to finish or just remove immediately?
             // User said "once a winner is added ... removed". Immediate seems fine or slightly delayed.
             // But if we remove immediately, Draw might lose data if it depends on rows[rowIndex].
             // Draw passes the row index. If we remove it, the indices shift.
             // Draw already captured the winner data in its internal state? 
             // Yes, Draw.jsx: setWinner({ row: rows[winnerRowIndex] ... })
             // So safe to remove from parent state.
             
             setRows((prev) => prev.filter((_, i) => i !== rowIndex));
             // Also need to clear selectedRowIndex so it doesn't highlight a wrong row next time
             // actually, Draw manages visual "Winner" overlay. The spreadsheet scrolling is handled by selectedRowIndex
             // If we remove the row, selectedRowIndex becomes invalid or points to next row.
             // Let's set selectedRowIndex to null after removal.
             setSelectedRowIndex(null);
          }}
        />
      </section>
    </main>
  );
};

export default page;