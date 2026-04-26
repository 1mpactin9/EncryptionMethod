#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

function stripComments(content: string, filepath: string): string {
  const ext = path.extname(filepath).toLowerCase();

  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    let result = '';
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    let i = 0;

    while (i < content.length) {
      const char = content[i];
      const nextChar = content[i + 1];

      if (!inString && !inTemplate && char === '/' && nextChar === '/') {
        while (i < content.length && content[i] !== '\n') i++;
        continue;
      }

      if (!inString && !inTemplate && char === '/' && nextChar === '*') {
        i += 2;
        while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++;
        i += 2;
        continue;
      }

      if (char === '`' && content[i - 1] !== '\\') {
        inTemplate = !inTemplate;
      }

      if (!inTemplate && (char === '"' || char === "'") && content[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      result += char;
      i++;
    }

    return result.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  }

  return content;
}

async function formatWithPrettier(content: string, filepath: string): Promise<string> {
  try {
    const { format, resolveConfig } = await import('prettier');
    const config = await resolveConfig(filepath);
    return format(content, {
      ...config,
      filepath
    });
  } catch (e) {
    console.log('⚠ Prettier not installed, skipping formatting');
    return content;
  }
}

function findSourceFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      findSourceFiles(fullPath, files);
    } else if (['.ts', '.tsx', '.js', '.jsx', '.rs'].includes(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('🧹 Comment Cleaner & Formatter\n');

  const sourceFiles = findSourceFiles(process.cwd());
  console.log(`Found ${sourceFiles.length} source files:\n`);

  sourceFiles.forEach((file, i) => {
    const relPath = path.relative(process.cwd(), file);
    console.log(`  ${i + 1}. ${relPath}`);
  });

  console.log('\nOptions:');
  console.log('  • Enter numbers separated by commas (e.g., "1,3,5")');
  console.log('  • Enter "all" to process all files');
  console.log('  • Enter a glob pattern (e.g., "src/*.tsx")');
  console.log('');

  const answer = await question('Which files would you like to clean? ');
  let filesToProcess: string[] = [];

  if (answer.toLowerCase() === 'all') {
    filesToProcess = sourceFiles;
  } else if (answer.includes(',') || /^\d+$/.test(answer.trim())) {
    const indices = answer.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < sourceFiles.length);
    filesToProcess = indices.map(i => sourceFiles[i]);
  } else {
    const pattern = answer.trim();
    filesToProcess = sourceFiles.filter(f => {
      const relPath = path.relative(process.cwd(), f).replace(/\\/g, '/');
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(relPath) || f.includes(pattern);
    });
  }

  if (filesToProcess.length === 0) {
    console.log('\n❌ No files matched');
    rl.close();
    return;
  }

  console.log(`\nProcessing ${filesToProcess.length} file(s):`);

  for (const file of filesToProcess) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`\n  📄 ${relPath}`);

    const content = fs.readFileSync(file, 'utf8');
    const withoutComments = stripComments(content, file);
    const formatted = await formatWithPrettier(withoutComments, file);

    fs.writeFileSync(file, formatted, 'utf8');
    console.log('     ✅ Done');
  }

  console.log(`\n✨ Done! Processed ${filesToProcess.length} file(s).`);
  rl.close();
}

main().catch(console.error);