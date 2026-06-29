import Papa from "papaparse";

export function parseCSV(csvText: string) {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}