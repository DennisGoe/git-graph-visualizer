export interface ParsedCommand {
  command: string;
  subcommand: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const command = parts[0];

  // Must start with "git" or be a special command
  if (command !== 'git' && command !== 'help' && command !== 'clear' && command !== 'reset') {
    return null;
  }

  if (command !== 'git') {
    return { command, subcommand: '', args: [], flags: {} };
  }

  const subcommand = parts[1] || '';
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('--')) {
      const eqIndex = part.indexOf('=');
      if (eqIndex !== -1) {
        flags[part.slice(2, eqIndex)] = part.slice(eqIndex + 1);
      } else {
        flags[part.slice(2)] = true;
      }
    } else if (part.startsWith('-')) {
      flags[part.slice(1)] = true;
    } else {
      // Handle quoted strings
      if ((part.startsWith('"') || part.startsWith("'")) && !part.endsWith(part[0])) {
        const quote = part[0];
        let combined = part.slice(1);
        for (let j = i + 1; j < parts.length; j++) {
          combined += ' ' + parts[j];
          if (parts[j].endsWith(quote)) {
            combined = combined.slice(0, -1);
            i = j;
            break;
          }
        }
        args.push(combined);
      } else if (
        (part.startsWith('"') && part.endsWith('"')) ||
        (part.startsWith("'") && part.endsWith("'"))
      ) {
        args.push(part.slice(1, -1));
      } else {
        args.push(part);
      }
    }
  }

  return { command, subcommand, args, flags };
}

export const HELP_TEXT = `Available commands:

  git commit -m "message"   Create a new commit
  git branch <name>         Create a new branch
  git checkout <branch>     Switch to a branch
  git merge <branch>        Merge a branch into current
  git tag <name>            Tag the current commit
  git branch -d <name>      Delete a branch
  git log                   Show commit history
  git status                Show current branch and HEAD
  git branch                List all branches

  help                      Show this help
  clear                     Clear terminal
  reset                     Reset to initial state`;
