'use client';

import React, { useState, useRef } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Body2,
  Caption1,
  ProgressBar,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowUpload24Regular,
  DocumentPdf24Regular,
  Dismiss16Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalXL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.border('2px', 'dashed', tokens.colorBrandStroke1),
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    transition: `all ${tokens.durationNormal} ${tokens.curveEasyEase}`,
    ':hover': {
      ...shorthands.borderColor(tokens.colorBrandStroke2),
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  dropzoneActive: {
    ...shorthands.borderColor(tokens.colorBrandStroke2),
    backgroundColor: tokens.colorBrandBackground2,
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalS,
  },
  selectedCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    gap: tokens.spacingHorizontalM,
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flex: 1,
    overflow: 'hidden',
  },
  fileName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

interface ResumeDropzoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  loading?: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export function ResumeDropzone({
  onFileSelect,
  selectedFile,
  loading = false,
  accept = 'application/pdf',
  maxSizeMB = 10,
}: ResumeDropzoneProps) {
  const styles = useStyles();
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Only PDF resumes are supported.');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMB}MB.`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {!selectedFile ? (
        <div
          className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.iconBox}>
            <ArrowUpload24Regular />
          </div>
          <Body2 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, marginBottom: 2 }}>
            Drag & Drop Candidate Resume (PDF)
          </Body2>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            or click to browse local files (up to {maxSizeMB}MB)
          </Caption1>
        </div>
      ) : (
        <div className={styles.selectedCard}>
          <div className={styles.fileInfo}>
            <DocumentPdf24Regular style={{ color: tokens.colorPaletteRedForeground1, fontSize: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                {formatFileSize(selectedFile.size)} • PDF Ready for AI Ingestion
              </Caption1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
            <Badge appearance="tint" color="success" icon={<CheckmarkCircle20Filled />}>
              Loaded
            </Badge>
            <Button
              appearance="transparent"
              size="small"
              icon={<Dismiss16Regular />}
              disabled={loading}
              onClick={() => onFileSelect(null)}
              title="Remove file"
            />
          </div>
        </div>
      )}

      {loading && <ProgressBar style={{ marginTop: tokens.spacingVerticalXS }} />}

      {error && (
        <Caption1 style={{ color: tokens.colorPaletteRedForeground1, fontWeight: 600 }}>
          {error}
        </Caption1>
      )}
    </div>
  );
}
