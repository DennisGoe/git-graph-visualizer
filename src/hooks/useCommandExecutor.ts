import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { commit, createBranch, checkout, merge, tag, deleteBranch, reset } from '../store/gitSlice';
import { addLine, addToHistory, clearTerminal } from '../store/terminalSlice';
import { parseCommand, HELP_TEXT } from '../utils/commandParser';

export function useCommandExecutor() {
  const dispatch = useAppDispatch();
  const gitState = useAppSelector((s) => s.git);

  const execute = useCallback(
    (input: string) => {
      dispatch(addLine({ type: 'input', content: `$ ${input}` }));
      dispatch(addToHistory(input));

      const parsed = parseCommand(input);

      if (!parsed) {
        dispatch(
          addLine({
            type: 'error',
            content: `Unknown command: "${input}". Type "help" for available commands.`,
          }),
        );
        return;
      }

      // Special commands
      if (parsed.command === 'help') {
        dispatch(addLine({ type: 'output', content: HELP_TEXT }));
        return;
      }

      if (parsed.command === 'clear') {
        dispatch(clearTerminal());
        return;
      }

      if (parsed.command === 'reset') {
        dispatch(reset());
        dispatch(clearTerminal());
        dispatch(
          addLine({
            type: 'output',
            content: 'Repository reset to initial state.',
          }),
        );
        return;
      }

      // Git commands
      switch (parsed.subcommand) {
        case 'commit': {
          const message =
            parsed.flags['m'] !== true
              ? String(parsed.flags['m'] || '')
              : parsed.args[0] || '';
          if (!message) {
            dispatch(
              addLine({
                type: 'error',
                content: 'error: switch `m` requires a value',
              }),
            );
            return;
          }
          dispatch(commit({ message }));
          dispatch(
            addLine({
              type: 'output',
              content: `[${gitState.currentBranch}] ${message}`,
            }),
          );
          break;
        }

        case 'branch': {
          if (parsed.flags['d'] || parsed.flags['D']) {
            const name = parsed.args[0];
            if (!name) {
              dispatch(
                addLine({ type: 'error', content: 'error: branch name required' }),
              );
              return;
            }
            if (name === gitState.currentBranch) {
              dispatch(
                addLine({
                  type: 'error',
                  content: `error: Cannot delete branch '${name}' checked out at current HEAD`,
                }),
              );
              return;
            }
            if (!gitState.branches[name]) {
              dispatch(
                addLine({
                  type: 'error',
                  content: `error: branch '${name}' not found`,
                }),
              );
              return;
            }
            dispatch(deleteBranch({ name }));
            dispatch(
              addLine({
                type: 'output',
                content: `Deleted branch ${name}.`,
              }),
            );
            return;
          }

          const name = parsed.args[0];
          if (!name) {
            // List branches
            const branchList = Object.keys(gitState.branches)
              .map(
                (b) =>
                  `${b === gitState.currentBranch ? '* ' : '  '}${b}`,
              )
              .join('\n');
            dispatch(addLine({ type: 'output', content: branchList }));
            return;
          }

          if (gitState.branches[name]) {
            dispatch(
              addLine({
                type: 'error',
                content: `fatal: A branch named '${name}' already exists.`,
              }),
            );
            return;
          }

          dispatch(createBranch({ name }));
          dispatch(
            addLine({
              type: 'output',
              content: `Created branch '${name}' at ${gitState.commits[gitState.head]?.hash || 'HEAD'}`,
            }),
          );
          break;
        }

        case 'checkout': {
          const branchName = parsed.args[0];
          if (!branchName) {
            dispatch(
              addLine({ type: 'error', content: 'error: branch name required' }),
            );
            return;
          }

          // git checkout -b <name>
          if (parsed.flags['b']) {
            const newName =
              typeof parsed.flags['b'] === 'string'
                ? parsed.flags['b']
                : branchName;
            if (gitState.branches[newName]) {
              dispatch(
                addLine({
                  type: 'error',
                  content: `fatal: A branch named '${newName}' already exists.`,
                }),
              );
              return;
            }
            dispatch(createBranch({ name: newName }));
            dispatch(checkout({ branch: newName }));
            dispatch(
              addLine({
                type: 'output',
                content: `Switched to a new branch '${newName}'`,
              }),
            );
            return;
          }

          if (!gitState.branches[branchName]) {
            dispatch(
              addLine({
                type: 'error',
                content: `error: pathspec '${branchName}' did not match any branch known`,
              }),
            );
            return;
          }

          dispatch(checkout({ branch: branchName }));
          dispatch(
            addLine({
              type: 'output',
              content: `Switched to branch '${branchName}'`,
            }),
          );
          break;
        }

        case 'merge': {
          const sourceBranch = parsed.args[0];
          if (!sourceBranch) {
            dispatch(
              addLine({
                type: 'error',
                content: 'error: specify the branch to merge',
              }),
            );
            return;
          }
          if (!gitState.branches[sourceBranch]) {
            dispatch(
              addLine({
                type: 'error',
                content: `merge: ${sourceBranch} - not something we can merge`,
              }),
            );
            return;
          }
          if (sourceBranch === gitState.currentBranch) {
            dispatch(
              addLine({
                type: 'output',
                content: 'Already up to date.',
              }),
            );
            return;
          }
          dispatch(merge({ sourceBranch }));
          dispatch(
            addLine({
              type: 'output',
              content: `Merge made by the 'ort' strategy.\n  Merge branch '${sourceBranch}' into ${gitState.currentBranch}`,
            }),
          );
          break;
        }

        case 'tag': {
          const tagName = parsed.args[0];
          if (!tagName) {
            // List tags
            const tagList = Object.keys(gitState.tags).join('\n');
            dispatch(
              addLine({
                type: 'output',
                content: tagList || '(no tags)',
              }),
            );
            return;
          }
          if (gitState.tags[tagName]) {
            dispatch(
              addLine({
                type: 'error',
                content: `fatal: tag '${tagName}' already exists`,
              }),
            );
            return;
          }
          dispatch(tag({ name: tagName }));
          dispatch(
            addLine({
              type: 'output',
              content: `Created tag '${tagName}' at ${gitState.commits[gitState.head]?.hash || 'HEAD'}`,
            }),
          );
          break;
        }

        case 'log': {
          const logLines = [...gitState.commitOrder]
            .reverse()
            .map((id) => {
              const c = gitState.commits[id];
              if (!c) return '';
              const branchLabels = Object.values(gitState.branches)
                .filter((b) => b.headCommitId === id)
                .map((b) => b.name);
              const tagLabels = Object.values(gitState.tags)
                .filter((t) => t.commitId === id)
                .map((t) => `tag: ${t.name}`);
              const refs = [...branchLabels, ...tagLabels];
              const refStr = refs.length ? ` (${refs.join(', ')})` : '';
              const headMarker = id === gitState.head ? ' <- HEAD' : '';
              return `${c.hash}${refStr}${headMarker} ${c.message}`;
            })
            .filter(Boolean)
            .join('\n');
          dispatch(addLine({ type: 'output', content: logLines }));
          break;
        }

        case 'status': {
          const head = gitState.commits[gitState.head];
          dispatch(
            addLine({
              type: 'output',
              content: `On branch ${gitState.currentBranch}\nHEAD at ${head?.hash || 'unknown'}`,
            }),
          );
          break;
        }

        default:
          dispatch(
            addLine({
              type: 'error',
              content: `git: '${parsed.subcommand}' is not a git command. See 'help'.`,
            }),
          );
      }
    },
    [dispatch, gitState],
  );

  return execute;
}
