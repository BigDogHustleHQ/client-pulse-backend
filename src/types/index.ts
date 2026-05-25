export interface HealthCheckResult {
  status: 'ok' | 'error';
}

export interface BlobObjectSummary {
  bucket: string;
  name: string;
  id: string | null;
  updatedAt: string | null;
}
