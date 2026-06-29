'use client';

import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Radio,
  RadioGroup,
  Divider,
  Caption1,
  Body1Strong,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { ArrowUploadRegular, DeleteRegular, ArrowDownloadRegular } from '@fluentui/react-icons';
import Papa from 'papaparse';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { DatasetUpload } from '@/lib/types';

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  previewTable: {
    width: '100%',
    overflowX: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  previewRow: {
    display: 'flex',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  previewCell: {
    flex: 1,
    minWidth: '140px',
    padding: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  hiddenInput: {
    display: 'none',
  },
  actionsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
});

interface DatasetManagerDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function DatasetManagerDialog({ open, onClose, onImported }: DatasetManagerDialogProps) {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const testResultsInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [datasetName, setDatasetName] = useState('');
  const [uploadedBy, setUploadedBy] = useState('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<DatasetUpload[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/datasets');
      const body = await res.json();
      if (res.ok) setHistory(body);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, loadHistory]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setDatasetName(selected.name);
    setError(null);
    setSuccess(null);

    selected.text().then((text) => {
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      const rows = parsed.data;
      setPreviewHeaders(rows.length > 0 ? Object.keys(rows[0]) : []);
      setPreviewRows(rows.slice(0, 5));
      setTotalRows(rows.length);
    });
  };

  const handleConfirmImport = async () => {
    if (!file) return;
    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);
      formData.append('datasetName', datasetName || file.name);
      formData.append('uploadedBy', uploadedBy);

      const res = await fetch('/api/candidates/import', { method: 'POST', body: formData });
      const body = await res.json();

      if (!res.ok) throw new Error(body.error ?? 'Import failed.');

      setSuccess(`Imported ${body.inserted} candidates (${mode}).`);
      setFile(null);
      setPreviewRows([]);
      setPreviewHeaders([]);
      await loadHistory();
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleTestResultsUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selected);

      const res = await fetch('/api/candidates/import-test-results', { method: 'POST', body: formData });
      const body = await res.json();

      if (!res.ok) throw new Error(body.error ?? 'Test result import failed.');

      setSuccess(`Matched test results for ${body.matched} candidates.`);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test result import failed.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL candidates? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/candidates', { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Delete failed.');

      setSuccess('All candidates deleted.');
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    window.open('/api/candidates/export', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={(_, state) => !state.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Dataset Manager</DialogTitle>
          <DialogContent className={styles.section}>
            {error ? (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            ) : null}
            {success ? (
              <MessageBar intent="success">
                <MessageBarBody>{success}</MessageBarBody>
              </MessageBar>
            ) : null}

            <div className={styles.section}>
              <Body1Strong>Upload Candidate Dataset</Body1Strong>
              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
              />
              <Button
                appearance="secondary"
                icon={<ArrowUploadRegular />}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose CSV File
              </Button>

              {file ? (
                <>
                  <Input
                    placeholder="Dataset name"
                    value={datasetName}
                    onChange={(_, data) => setDatasetName(data.value)}
                  />
                  <Input
                    placeholder="Uploaded by (optional)"
                    value={uploadedBy}
                    onChange={(_, data) => setUploadedBy(data.value)}
                  />
                  <RadioGroup
                    value={mode}
                    onChange={(_, data) => setMode(data.value as 'append' | 'replace')}
                  >
                    <Radio value="append" label="Append to existing candidates" />
                    <Radio value="replace" label="Replace all existing candidates" />
                  </RadioGroup>

                  <Caption1>
                    Preview: {totalRows} rows detected, showing first {previewRows.length}
                  </Caption1>

                  {previewHeaders.length > 0 ? (
                    <div className={styles.previewTable}>
                      <div className={styles.previewRow}>
                        {previewHeaders.map((header) => (
                          <div key={header} className={`${styles.previewCell} ${styles.headerCell}`}>
                            {header}
                          </div>
                        ))}
                      </div>
                      {previewRows.map((row, idx) => (
                        <div key={idx} className={styles.previewRow}>
                          {previewHeaders.map((header) => (
                            <div key={header} className={styles.previewCell}>
                              {String(row[header] ?? '')}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className={styles.actionsRow}>
                    <Button appearance="primary" disabled={importing} onClick={handleConfirmImport}>
                      {importing ? 'Importing...' : `Confirm ${mode === 'replace' ? 'Replace' : 'Append'}`}
                    </Button>
                    <Button appearance="subtle" onClick={() => setFile(null)} disabled={importing}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : null}
            </div>

            <Divider />

            <div className={styles.section}>
              <Body1Strong>Test Results</Body1Strong>
              <Caption1>Upload a CSV with Email, test_la, test_code to merge scores into existing candidates.</Caption1>
              <input
                ref={testResultsInputRef}
                className={styles.hiddenInput}
                type="file"
                accept=".csv,text/csv"
                onChange={handleTestResultsUpload}
              />
              <Button
                appearance="secondary"
                icon={<ArrowUploadRegular />}
                onClick={() => testResultsInputRef.current?.click()}
              >
                Upload Test Results CSV
              </Button>
            </div>

            <Divider />

            <div className={styles.actionsRow}>
              <Button appearance="secondary" icon={<ArrowDownloadRegular />} onClick={handleExport}>
                Export Current Dataset
              </Button>
              <Button
                appearance="secondary"
                icon={<DeleteRegular />}
                disabled={deleting}
                onClick={handleDeleteAll}
              >
                {deleting ? 'Deleting...' : 'Delete All Candidates'}
              </Button>
            </div>

            <Divider />

            <div className={styles.section}>
              <Body1Strong>Upload History</Body1Strong>
              {history.length === 0 ? (
                <Caption1>No uploads yet.</Caption1>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className={styles.historyItem}>
                    <span>
                      {entry.dataset_name} • {entry.mode} • {entry.total_candidates} candidates
                      {entry.uploaded_by ? ` • by ${entry.uploaded_by}` : ''}
                    </span>
                    <span>{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
