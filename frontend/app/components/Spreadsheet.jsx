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
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch participants from API on mount and populate sheet
  useEffect(() => {
    const fetchParticipants = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:5000/participants");
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        // Build a union of keys across all objects to ensure consistent columns
        const keySet = data.reduce((s, item) => {
          Object.keys(item).forEach((k) => s.add(k));
          return s;
        }, new Set());
        // exclude MongoDB internal id and internal timestamps from columns
        const keys = Array.from(keySet).filter((k) => !["_id", "movedAt", "restoredAt"].includes(k));

        // Create column definitions
        const apiCols = keys.map((k, i) => ({ id: i + 1, name: k }));
        setCols(apiCols);

        // Map rows to arrays corresponding to keys order
        const apiRows = data.map((item) =>
          keys.map((k) => {
            const v = item[k];
            if (v == null) return "";
            // handle Mongo ObjectId or other objects
            if (typeof v === "object") {
              if (v.hasOwnProperty("$oid")) return v.$oid;
              return v.toString();
            }
            return v;
          })
        );
        setRows(apiRows);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch participants", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [setCols, setRows]);

  // addColumn removed per request

  const updateColName = (colIdx, newName) => {
    setCols((c) => c.map((col, i) => (i === colIdx ? { ...col, name: newName } : col)));
  };

  // addRow removed per request

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
      // Move focus to the same column in the next row if it exists
      setTimeout(() => {
        const table = tableRef.current;
        if (!table) return;
        const nextRow = table.querySelectorAll("tbody tr")[rowIdx + 1];
        if (nextRow) {
          const inputs = nextRow.querySelectorAll("input");
          const input = inputs[colIdx] || inputs[0];
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
          <div className={styles.title}>Participants</div>
          <div className={styles.controls}>
          </div>
          {isLoading && <div className={styles.smallHint}>Loading participants…</div>}
        </div>

        <div className={rows.length > 5 ? `${styles.tableWrap} ${styles.tableWrapScrollable}` : styles.tableWrap} ref={tableRef}>
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

        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <div className={styles.smallHint}>Rows: {rows.length} • Columns: {cols.length}</div>
        </div>
      </div>
    </div>
  );
}
