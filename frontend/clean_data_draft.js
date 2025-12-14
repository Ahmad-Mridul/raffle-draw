const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public', 'data', 'data.json');

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    let data = JSON.parse(rawData);

    const cleanedData = data.map(item => {
        // 1. Remove trailing commas from "FULL NAME"
        let fullName = item["FULL NAME"];
        if (fullName && typeof fullName === 'string') {
            fullName = fullName.trim();
            if (fullName.endsWith(',')) {
                fullName = fullName.slice(0, -1);
            }
        }

        // 2. Reassign "Sl" to "ID" (which is the empty key "") and remove "Sl"
        // The "ID" field key seems to be "" based on previous context, but let's check the file content.
        // Based on the file content view, the keys will be visible.
        // Assuming the empty key "" corresponds to ID as per previous learnings.
        // However, the user said "reassigning 'Sl' to 'ID'".
        // Let's look at the file content first to be sure about keys.
        // I will write this generic logic but might need to adjust key names after viewing the file.

        // For now, I'll rely on the standard keys seen in the snippet or usage.
        // If keys are different, I'll catch it after viewing.
        // But I am writing this script BLINDLY before viewing the file in this turn (parallel calls).
        // Actually, I should probably view the file FIRST before writing the script to be 100% sure of keys.

        // BUT, the tool `view_file` is called in parallel.
        // I will write the script in a subsequent turn to be safe.
        // For this turn, I will just view the file.
    });
} catch (err) {
    console.error(err);
}
