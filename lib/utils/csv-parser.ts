import Papa from "papaparse";

export function parseCSV(csvText: string): Record<string, unknown>[] {
  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data;
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_]+/g, "");
}

function pick(row: Record<string, unknown>, ...candidates: string[]): string | undefined {
  const normalizedRow: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[normalizeKey(key)] = value;
  });

  for (const candidate of candidates) {
    const value = normalizedRow[normalizeKey(candidate)];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return undefined;
}

export interface MappedCandidateRow {
  full_name: string;
  email: string;
  college: string;
  branch: string | null;
  cgpa: number;
  best_ai_project: string | null;
  research_work: string | null;
  github: string | null;
  resume_url: string | null;
  status: string;
  ai_score: number;
  parsing_status: "pending" | "not_applicable";
}

export function mapCandidateRow(row: Record<string, unknown>): MappedCandidateRow | null {
  const fullName = pick(row, "name", "full_name", "fullname", "candidatename");
  const email = pick(row, "email", "emailaddress");

  if (!fullName || !email) {
    return null;
  }

  const resumeUrl = pick(row, "resumelink", "resumeurl", "resume") ?? null;

  return {
    full_name: fullName,
    email,
    college: pick(row, "college", "university") ?? "Unknown",
    branch: pick(row, "branch", "department") ?? null,
    cgpa: Number(pick(row, "cgpa", "gpa") ?? 0) || 0,
    best_ai_project: pick(row, "bestaiproject", "aiproject", "project") ?? null,
    research_work: pick(row, "researchwork", "research") ?? null,
    github: pick(row, "githubprofile", "github", "githuburl") ?? null,
    resume_url: resumeUrl,
    status: pick(row, "status") ?? "Pending",
    ai_score: Number(pick(row, "aiscore", "ai_score") ?? 0) || 0,
    parsing_status: resumeUrl ? "pending" : "not_applicable",
  };
}

export interface MappedTestResultRow {
  email: string;
  test_la: number | null;
  test_code: number | null;
}

export function mapTestResultRow(row: Record<string, unknown>): MappedTestResultRow | null {
  const email = pick(row, "email", "emailaddress");

  if (!email) {
    return null;
  }

  const testLa = pick(row, "testla", "test_la", "logicalaptitudescore", "aptitudescore");
  const testCode = pick(row, "testcode", "test_code", "codingtestscore", "codescore");

  return {
    email,
    test_la: testLa !== undefined ? Number(testLa) : null,
    test_code: testCode !== undefined ? Number(testCode) : null,
  };
}
