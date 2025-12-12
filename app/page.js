"use client";

import { useState } from "react";
import Draw from "./components/Draw";
import Spreadsheet from "./components/Spreadsheet";
import styles from "./page.module.css";

const page = () => {
  // Lift spreadsheet data here so Draw can use it
  const [cols, setCols] = useState([
    { id: 1, name: "Col 1" },
    { id: 2, name: "Col 2" },
    { id: 3, name: "Col 3" },
  ]);
  const [rows, setRows] = useState([Array(cols.length).fill("")]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isRolling, setIsRolling] = useState(false);


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