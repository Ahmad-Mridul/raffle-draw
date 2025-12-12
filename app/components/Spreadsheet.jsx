"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./spreadsheet.module.css";

export default function Spreadsheet({ cols: propsCols, setCols: propsSetCols, rows: propsRows, setRows: propsSetRows, selectedRowIndex, isRolling = false }) {
  // Support controlled props (from page) or internal state fallback
  const [internalCols, setInternalCols] = useState([
    { id: 1, name: "Col 1" },
    { id: 2, name: "Col 2" },
    { id: 3, name: "Col 3" },
  ]);

  const [internalRows, setInternalRows] = useState([Array(internalCols.length).fill("")]);
  const cols = propsCols ?? internalCols;
  const setCols = propsSetCols ?? setInternalCols;
  const rows = propsRows ?? internalRows;
  const setRows = propsSetRows ?? setInternalRows;

  const tableRef = useRef(null);
  const selectedRef = useRef(null);

  // when selectedRowIndex prop changes, scroll and flash that row
  useEffect(() => {
    const sel = selectedRowIndex;
    if (typeof sel !== "number" || sel === null || sel === undefined) return;
    // scroll into view inside table container
    const table = tableRef.current;
    const rowEl = selectedRef.current;
    if (rowEl && table) {
      // scroll the wrapper so the row is visible
      const wrapper = table;
      const rect = rowEl.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      // adjust scrollTop so selected row is centered in wrapper
      const offset = rect.top - wrapRect.top + wrapper.scrollTop - wrapper.clientHeight / 2 + rect.height / 2;
      wrapper.scrollTo({ top: offset, behavior: "smooth" });
      // remove highlight after animation ends
      setTimeout(() => {
        // no-op: CSS animation ends on its own; we don't persist selection here
      }, 1500);
    }
  }, [selectedRowIndex]);

  const addColumn = () => {
    const nextId = cols.length ? cols[cols.length - 1].id + 1 : 1;
    setCols((c) => [...c, { id: nextId, name: `Col ${nextId}` }]);
    setRows((r) => r.map((row) => [...row, ""]));
  };

  const updateColName = (colIdx, newName) => {
    setCols((c) => c.map((col, i) => (i === colIdx ? { ...col, name: newName } : col)));
  };

  const addRow = (afterIndex = null) => {
    setRows((r) => {
      const newRow = Array(cols.length).fill("");
      if (afterIndex === null) return [...r, newRow];
      const copy = [...r];
      copy.splice(afterIndex + 1, 0, newRow);
      return copy;
    });
  };

  const updateCell = (rowIdx, colIdx, value) => {
    setRows((r) => {
      const copy = r.map((row) => [...row]);
      if (!copy[rowIdx]) return copy;
      copy[rowIdx][colIdx] = value;
      return copy;
    });
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Add a row after this one and focus the first cell of new row
      addRow(rowIdx);
      // focus next tick
      setTimeout(() => {
        const table = tableRef.current;
        if (!table) return;
        const nextRow = table.querySelectorAll("tbody tr")[rowIdx + 1];
        if (nextRow) {
          const input = nextRow.querySelectorAll("input")[0];
          if (input) input.focus();
        }
      }, 20);
    }
  };

  // Paste handler: if pasted text has multiple lines, insert rows
  const handlePaste = (e, rowIdx, colIdx) => {
    const clipboard = e.clipboardData || window.clipboardData;
    const text = clipboard.getData("text");
    if (!text) return;
    // parse by lines and tabs
    const lines = text.replace(/\r\n/g, "\n").split(/\n/);
    if (lines.length <= 1) return; // default behavior
    e.preventDefault();

    // For each line, split by tabs
    const parsedRows = lines.map((ln) => ln.split(/\t/));

    setRows((r) => {
      const copy = r.map((row) => [...row]);
      // replace current row starting at colIdx with first parsed row
      parsedRows.forEach((prow, i) => {
        const targetRowIdx = rowIdx + i;
        // if target row doesn't exist, push new rows
        if (targetRowIdx >= copy.length) {
          copy.push(Array(cols.length).fill(""));
        }
        // ensure row has enough columns
        if (copy[targetRowIdx].length < cols.length) {
          copy[targetRowIdx] = copy[targetRowIdx].concat(
            Array(cols.length - copy[targetRowIdx].length).fill("")
          );
        }
        // fill columns starting at colIdx
        for (let j = 0; j < prow.length; j++) {
          const cIdx = colIdx + j;
          if (cIdx >= cols.length) {
            // add new cols when needed
            const nextId = cols.length + (cIdx - cols.length) + 1;
            setCols((prev) => [...prev, { id: nextId, name: `Col ${nextId}` }]);
          }
          if (!copy[targetRowIdx][cIdx]) copy[targetRowIdx][cIdx] = "";
          copy[targetRowIdx][cIdx] = prow[j];
        }
      });
      return copy;
    });
    // after paste, remove any fully-empty rows
    setTimeout(() => trimEmptyRows(), 20);
  };

  const isRowEmpty = (row) => {
    return row.every((cell) => (cell ?? "").toString().trim() === "");
  };

  const trimEmptyRows = () => {
    setRows((r) => {
      const filtered = r.filter((row) => !isRowEmpty(row));
      if (filtered.length === 0) return [Array(cols.length).fill("")];
      return filtered;
    });
  };

  // ensure each row always has same length as cols
  useEffect(() => {
    setRows((r) => r.map((row) => {
      if (row.length < cols.length) return [...row, ...Array(cols.length - row.length).fill("")];
      if (row.length > cols.length) return row.slice(0, cols.length);
      return row;
    }));
  }, [cols.length]);

  return (
    <div className={styles.rightColumnContainer}>
      <div className={styles.sheetWrap}>
        <div className={styles.sheetHeader}>
          <div className={styles.title}>Spreadsheet</div>
          <div className={styles.controls}>
            <button className={styles.addColBtn} onClick={addColumn} title="Add column">
              + Add column
            </button>
          </div>
        </div>

        <div className={styles.smallHint}>Press Enter inside a cell to add a new row. Paste multi-row data to add rows automatically.</div>

        <div className={rows.length >= 15 ? `${styles.tableWrap} ${styles.tableWrapScrollable}` : styles.tableWrap} ref={tableRef}>
          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th className={styles.colIndex}>#</th>
                {cols.map((c, ci) => (
                  <th key={c.id}>
                    <input
                      className={styles.headerInput}
                      value={c.name}
                      onChange={(e) => updateColName(ci, e.target.value)}
                      aria-label={`Column ${ci + 1} name`}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} ref={ri === selectedRowIndex ? selectedRef : null} className={`${ri === selectedRowIndex ? styles.highlightRow : ''} ${ri === selectedRowIndex && isRolling ? styles.rollingRow : ''}`}>
                  <td className={styles.colIndex}>{ri + 1}</td>
                  {cols.map((c, ci) => (
                    <td key={`${ri}-${ci}`}>
                      <input
                        className={styles.cellInput}
                        value={row[ci] ?? ""}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, ri, ci)}
                          onPaste={(e) => handlePaste(e, ri, ci)}
                          onBlur={() => trimEmptyRows()}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{marginTop: 10, display: 'flex', gap: 8}}>
          <button className={styles.addColBtn} onClick={() => addRow()}>
            + Add row
          </button>
          <div className={styles.smallHint}>Rows: {rows.length} • Columns: {cols.length}</div>
        </div>
      </div>
    </div>
  );
}
