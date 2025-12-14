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

  // Load winners from backend
  const fetchWinners = async () => {
    try {
      const res = await fetch('https://raffle-draw-backend.vercel.app/winners');
      if (!res.ok) throw new Error('Failed to load winners');
      const json = await res.json();

      const mapped = (json || []).map((doc) => {
        const id = doc.ID ?? doc.Id ?? doc.id ?? (doc._id ? String(doc._id) : "");
        const batch = doc.BATCH ?? doc.Batch ?? doc.batch ?? "";
        const name = doc["FULL NAME"] ?? doc["Full Name"] ?? doc.name ?? doc.NAME ?? "";
        return [id, batch, name];
      });

      setWinners(mapped);
    } catch (err) {
      console.error('Error loading winners:', err);
    }
  };

  // Load participants from backend (fallback to bundled data.json)
  const fetchParticipants = async () => {
    try {
      const res = await fetch('https://raffle-draw-backend.vercel.app/participants');
      if (!res.ok) throw new Error('Failed to load participants');
      const json = await res.json();

      if (Array.isArray(json) && json.length > 0) {
        // Build column keys (exclude _id)
        const keySet = json.reduce((s, it) => {
          Object.keys(it).forEach((k) => s.add(k));
          return s;
        }, new Set());
        const keys = Array.from(keySet).filter((k) => !['_id', 'movedAt', 'restoredAt'].includes(k));
        setCols(keys.map((k, i) => ({ id: i + 1, name: k })));

        const newRows = json.map((item) => keys.map((k) => item[k] ?? ""));
        setRows(newRows);
        return;
      }
    } catch (err) {
      // fallback to bundled data file
    }

    try {
      const res2 = await fetch('/data/data.json');
      if (!res2.ok) throw new Error('Failed to load local data');
      const json2 = await res2.json();
      const newRows = json2.map(item => [
        item['ID'] || '',
        item['BATCH'] || '',
        item['FULL NAME'] || item['Full Name'] || '',
      ]);
      setRows(newRows);
    } catch (err) {
      console.error('Error loading participants fallback:', err);
    }
  };

  const resetWinners = async () => {
    if (!confirm('Reset all winners back into participants?')) return;
    try {
      const res = await fetch('https://raffle-draw-backend.vercel.app/winners/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      await fetchWinners();
      await fetchParticipants();
    } catch (err) {
      console.error('Error resetting winners:', err);
    }
  };

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
    fetchWinners();
    fetchParticipants();
  }, []);

  return (
    <main className={styles.mainGrid}>
      <aside className={styles.leftSidebar}>
        <div className={styles.winnersSection}>
          <WinnersList winners={winners} onReset={resetWinners} />
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
            onWinner={async (rowIndex) => {
               setSelectedRowIndex(rowIndex);
               const winner = rows[rowIndex];

               // Build an object mapping column names -> values so backend can find the participant
               const payload = {};
               cols.forEach((c, idx) => {
                 payload[c.name] = winner[idx];
               });

               try {
                 const res = await fetch('https://raffle-draw-backend.vercel.app/winners', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(payload),
                 });
                 if (!res.ok) {
                   console.error('Failed to persist winner to backend');
                   return;
                 }

                 // Success: refresh winners and participants from backend
                 await fetchWinners();
                 await fetchParticipants();
                 setSelectedRowIndex(null);
               } catch (err) {
                 console.error('Error calling winners API', err);
               }
            }}
        />
      </section>
    </main>
  );
};

export default page;