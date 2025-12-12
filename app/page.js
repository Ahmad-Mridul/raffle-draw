"use client";

import { useEffect, useState } from "react";
import Draw from "./components/Draw";
import Spreadsheet from "./components/Spreadsheet";
import styles from "./page.module.css";

const page = () => {
  // Lift spreadsheet data here so Draw can use it
  const [cols, setCols] = useState([
    { id: 1, name: "ID" },
    { id: 2, name: "Batch" },
    { id: 3, name: "Full Name" },
    { id: 4, name: "Sl" },
    { id: 5, name: "Category" },
    { id: 6, name: "Ref Dip" },
  ]);
  const [rows, setRows] = useState([Array(6).fill("")]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/data/data.json");
        if (!res.ok) throw new Error("Failed to load data");
        const json = await res.json();

        // Map JSON structure to rows
        // JSON structure: { "": "250001", "BATCH": "J01", "FULL NAME": "..." }
        const newRows = json.map(item => [
          item[""] || "",        // ID
          item["BATCH"] || "",   // Batch
          item["FULL NAME"] || "", // Name
          item["Sl"] || "",      // Sl
          item["CATEGORY"] || "", // Category
          item["Ref Dip"] || ""   // Ref Dip
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
      <section className={styles.leftCol}>
        <Draw
          rows={rows}
          setSelectedRowIndex={setSelectedRowIndex}
          setIsRolling={setIsRolling}
          onWinner={(rowIndex) => {
            setSelectedRowIndex(rowIndex);
          }}
        />
      </section>
      <aside className={styles.rightCol}>
        <Spreadsheet
          cols={cols}
          setCols={setCols}
          rows={rows}
          setRows={setRows}
          selectedRowIndex={selectedRowIndex}
          isRolling={isRolling}
        />
      </aside>
    </main>
  );
};

export default page;