import { Orchestrator } from '../core/orchestrator';
import { Planner } from '../agents/planner';
import { Researcher } from '../agents/researcher';
import { Coder } from '../agents/coder';
import { Tester } from '../agents/tester';
import { Refactorer } from '../agents/refactorer';
import { Docs } from '../agents/docs';
import { N8n } from '../agents/n8n';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('oc-run')
  .description('Run OpenCode Multi-Agent')
  .version('1.0.0')
  .option('-g, --goal <goal>', 'The goal of the task')
  .option('-r, --repo <repo>', 'The repository path')
  .action(async options => {
    const orchestrator = new Orchestrator();
    const planner = new Planner(orchestrator);
    const researcher = new Researcher(orchestrator);
    const coder = new Coder(orchestrator);
    const tester = new Tester(orchestrator);
    const refactorer = new Refactorer(orchestrator);
    const docs = new Docs(orchestrator);
    const n8n = new N8n(orchestrator);

    const goal = options.goal;
    const repoPath = options.repo;

    if (!goal || !repoPath) {
      console.error('Goal and repository path are required');
      process.exit(1);
    }

    if (!fs.existsSync(repoPath)) {
      console.error(`Repository path ${repoPath} does not exist`);
      process.exit(1);
    }

    console.log(`Starting task with goal: ${goal}`);
    console.log(`Repository path: ${repoPath}`);

    // Implement the task execution logic here
  });

program.parse(process.argv);
