import type { BranchPipeline, PipelineState } from '../store/pipelinesSlice';

interface GLPipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  web_url: string;
  updated_at: string;
}

function mapStatus(raw: string): PipelineState {
  switch (raw) {
    case 'running':
    case 'preparing':
      return 'working';
    case 'pending':
    case 'created':
    case 'scheduled':
    case 'waiting_for_resource':
      return 'waiting';
    case 'failed':
      return 'failed';
    case 'canceled':
      return 'off';
    // success, manual, skipped, or anything unknown → idle (coffee)
    default:
      return 'idle';
  }
}

/**
 * Fetches the latest pipeline for each given branch in parallel.
 * Branches without any pipeline get `state: 'idle'` (no CI history).
 */
export async function fetchGitLabPipelines(
  instanceUrl: string,
  projectPath: string,
  token: string,
  branches: string[],
): Promise<Record<string, BranchPipeline>> {
  const base = instanceUrl.replace(/\/+$/, '');
  const encodedPath = encodeURIComponent(projectPath);
  const headers = {
    'PRIVATE-TOKEN': token,
    Accept: 'application/json',
  };

  const results = await Promise.all(
    branches.map(async (branch): Promise<[string, BranchPipeline]> => {
      const url = `${base}/api/v4/projects/${encodedPath}/pipelines?ref=${encodeURIComponent(branch)}&per_page=1`;
      try {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          return [
            branch,
            { state: 'idle', rawStatus: 'error', webUrl: null, updatedAt: Date.now() },
          ];
        }
        const data: GLPipeline[] = await res.json();
        if (data.length === 0) {
          return [
            branch,
            { state: 'idle', rawStatus: 'none', webUrl: null, updatedAt: Date.now() },
          ];
        }
        const p = data[0];
        return [
          branch,
          {
            state: mapStatus(p.status),
            rawStatus: p.status,
            webUrl: p.web_url,
            updatedAt: new Date(p.updated_at).getTime(),
          },
        ];
      } catch {
        return [
          branch,
          { state: 'idle', rawStatus: 'error', webUrl: null, updatedAt: Date.now() },
        ];
      }
    }),
  );

  return Object.fromEntries(results);
}
