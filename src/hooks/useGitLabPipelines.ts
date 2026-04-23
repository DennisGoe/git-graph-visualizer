import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setPipelines, setFetching } from '../store/pipelinesSlice';
import { fetchGitLabPipelines } from '../utils/gitlabPipelines';

const POLL_INTERVAL_MS = 8000;

/**
 * Polls the latest pipeline per branch while `enabled` is true.
 * Only runs if provider is gitlab and a token is available.
 */
export function useGitLabPipelines(branches: string[], enabled: boolean) {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project);
  const branchesKey = branches.join(',');
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (project.provider !== 'gitlab' || !project.token) return;
    if (branches.length === 0) return;

    cancelRef.current = false;

    const run = async () => {
      if (cancelRef.current) return;
      dispatch(setFetching(true));
      const result = await fetchGitLabPipelines(
        project.instanceUrl,
        project.projectPath,
        project.token,
        branches,
      );
      if (cancelRef.current) return;
      dispatch(setPipelines(result));
    };

    run();
    const id = setInterval(run, POLL_INTERVAL_MS);

    return () => {
      cancelRef.current = true;
      clearInterval(id);
    };
    // branchesKey captures the array content without unstable identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, project.provider, project.instanceUrl, project.projectPath, project.token, branchesKey]);
}
