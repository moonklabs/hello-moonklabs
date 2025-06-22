#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

const GITHUB_API_URL = 'https://api.github.com/repos/moonklabs/aiwf';
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/moonklabs/aiwf/master';
const GITHUB_CONTENT_PREFIX = 'claude-code/moonklabs';

async function fetchGitHubContent(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'hello-moonklabs' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                }
                res.destroy();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'hello-moonklabs' } }, (response) => {
            if (response.statusCode !== 200) {
                response.destroy();
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }
            const file = createWriteStream(destPath);
            pipeline(response, file)
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(err);
                })
                .finally(() => {
                    response.destroy();
                });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function getDirectoryStructure(path = '') {
    const url = `${GITHUB_API_URL}/contents/${path}`;
    const content = await fetchGitHubContent(url);
    return JSON.parse(content);
}

async function checkExistingInstallation() {
    const moonklabsExists = await fs.access('.moonklabs').then(() => true).catch(() => false);
    const claudeCommandsExists = await fs.access('.claude/commands/moonklabs').then(() => true).catch(() => false);
    return moonklabsExists || claudeCommandsExists;
}

async function backupFile(filePath) {
    try {
        const exists = await fs.access(filePath).then(() => true).catch(() => false);
        if (exists) {
            const backupPath = `${filePath}.bak`;
            await fs.copyFile(filePath, backupPath);
            return backupPath;
        }
    } catch (error) {
        // Backup failed, but continue
    }
    return null;
}

async function backupCommandsAndDocs() {
    const spinner = ora('기존 명령어 및 문서 백업 중...').start();
    const backedUpFiles = [];

    try {
        // Files that will be updated and need backup
        const filesToBackup = [
            '.moonklabs/CLAUDE.md',
            '.moonklabs/02_REQUIREMENTS/CLAUDE.md',
            '.moonklabs/03_SPRINTS/CLAUDE.md',
            '.moonklabs/04_GENERAL_TASKS/CLAUDE.md'
        ];

        // Backup CLAUDE.md files
        for (const file of filesToBackup) {
            const backupPath = await backupFile(file);
            if (backupPath) {
                backedUpFiles.push(backupPath);
            }
        }

        // Backup all command files
        const commandsDir = '.claude/commands/moonklabs';
        const commandsExist = await fs.access(commandsDir).then(() => true).catch(() => false);
        if (commandsExist) {
            try {
                const commandFiles = await fs.readdir(commandsDir, { recursive: true });
                for (const file of commandFiles) {
                    const filePath = path.join(commandsDir, file);
                    const stat = await fs.stat(filePath);
                    if (stat.isFile()) {
                        const backupPath = await backupFile(filePath);
                        if (backupPath) {
                            backedUpFiles.push(backupPath);
                        }
                    }
                }
            } catch (error) {
                // Commands directory might be empty or have issues
            }
        }

        if (backedUpFiles.length > 0) {
            spinner.succeed(chalk.green(`${backedUpFiles.length}개 파일 백업 완료 (*.bak)`));
        } else {
            spinner.succeed(chalk.gray('백업할 기존 파일이 없습니다'));
        }
        return backedUpFiles;
    } catch (error) {
        spinner.fail(chalk.red('백업 실패'));
        throw error;
    }
}

async function downloadDirectory(githubPath, localPath, spinner) {
    await fs.mkdir(localPath, { recursive: true });

    const items = await getDirectoryStructure(githubPath);

    for (const item of items) {
        const itemLocalPath = path.join(localPath, item.name);

        if (item.type === 'dir') {
            await downloadDirectory(item.path, itemLocalPath, spinner);
        } else if (item.type === 'file') {
            spinner.text = `${item.path} 다운로드 중...`;
            await downloadFile(item.download_url, itemLocalPath);
        }
    }
}

async function installMoonklabs(options = {}) {
    console.log(chalk.blue.bold('\n🎉 Hello Moonklabs에 오신 것을 환영합니다!\n'));
    console.log(chalk.gray('이 설치 프로그램은 Moonklabs 프로젝트 관리 프레임워크를 설정합니다'));
    console.log(chalk.gray('Claude Code 프로젝트를 위해.\n'));

    const hasExisting = await checkExistingInstallation();

    if (hasExisting && !options.force) {
        const response = await prompts({
            type: 'select',
            name: 'action',
            message: '기존 Moonklabs 설치가 감지되었습니다. 무엇을 하시겠습니까?',
            choices: [
                { title: '업데이트 (명령어와 문서만 업데이트하고 작업 내용은 보존)', value: 'update' },
                { title: '설치 건너뛰기', value: 'skip' },
                { title: '취소', value: 'cancel' }
            ]
        });

        if (response.action === 'skip' || response.action === 'cancel') {
            console.log(chalk.yellow('\n설치가 취소되었습니다.'));
            process.exit(0);
        }

        if (response.action === 'update') {
            await backupCommandsAndDocs();
        }
    }

    const spinner = ora('GitHub에서 Moonklabs 프레임워크를 가져오는 중...').start();

    try {
        // Create .moonklabs directory structure
        const moonklabsDirs = [
            '.moonklabs',
            '.moonklabs/01_PROJECT_DOCS',
            '.moonklabs/02_REQUIREMENTS',
            '.moonklabs/03_SPRINTS',
            '.moonklabs/04_GENERAL_TASKS',
            '.moonklabs/05_ARCHITECTURE_DECISIONS',
            '.moonklabs/10_STATE_OF_PROJECT',
            '.moonklabs/99_TEMPLATES'
        ];

        for (const dir of moonklabsDirs) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Only download manifest on fresh installs
        if (!hasExisting) {
            spinner.text = 'Moonklabs 프레임워크 파일을 다운로드하는 중...';

            // Get the root manifest
            try {
                const manifestUrl = `${GITHUB_RAW_URL}/${GITHUB_CONTENT_PREFIX}/.moonklabs/00_PROJECT_MANIFEST.md`;
                await downloadFile(manifestUrl, '.moonklabs/00_PROJECT_MANIFEST.md');
            } catch (error) {
                // If manifest doesn't exist, that's okay
            }

            // Download templates on fresh install
            try {
                await downloadDirectory(`${GITHUB_CONTENT_PREFIX}/.moonklabs/99_TEMPLATES`, '.moonklabs/99_TEMPLATES', spinner);
            } catch (error) {
                spinner.text = '템플릿 디렉토리를 찾을 수 없어 건너뜁니다...';
            }
        }

        // Always update CLAUDE.md documentation files
        spinner.text = '문서를 업데이트하는 중...';
        const claudeFiles = [
            '.moonklabs/CLAUDE.md',
            '.moonklabs/02_REQUIREMENTS/CLAUDE.md',
            '.moonklabs/03_SPRINTS/CLAUDE.md',
            '.moonklabs/04_GENERAL_TASKS/CLAUDE.md'
        ];

        for (const claudeFile of claudeFiles) {
            try {
                const claudeUrl = `${GITHUB_RAW_URL}/${GITHUB_CONTENT_PREFIX}/${claudeFile}`;
                await downloadFile(claudeUrl, claudeFile);
            } catch (error) {
                // If CLAUDE.md doesn't exist, that's okay
            }
        }

        // Create .claude/commands/moonklabs directory
        await fs.mkdir('.claude/commands/moonklabs', { recursive: true });

        // Always update commands
        spinner.text = 'Moonklabs 명령어를 업데이트하는 중...';
        try {
            await downloadDirectory(`${GITHUB_CONTENT_PREFIX}/.claude/commands/moonklabs`, '.claude/commands/moonklabs', spinner);
        } catch (error) {
            spinner.text = '명령어 디렉토리를 찾을 수 없어 건너뜁니다...';
        }

        if (hasExisting) {
            spinner.succeed(chalk.green('✅ Moonklabs 프레임워크가 성공적으로 업데이트되었습니다!'));
            console.log(chalk.blue('\n🔄 업데이트 내역:'));
            console.log(chalk.gray('   • .claude/commands/moonklabs/ 내의 명령어'));
            console.log(chalk.gray('   • 문서 (CLAUDE.md 파일)'));
            console.log(chalk.green('\n💾 작업 내용은 보존되었습니다:'));
            console.log(chalk.gray('   • 모든 작업, 스프린트, 및 프로젝트 파일이 변경되지 않음'));
            console.log(chalk.gray('   • 백업은 *.bak 파일로 만들어짐'));
        } else {
            spinner.succeed(chalk.green('✅ Moonklabs 프레임워크가 성공적으로 설치되었습니다!'));
            console.log(chalk.blue('\n📁 생성된 구조:'));
            console.log(chalk.gray('   .moonklabs/              - 프로젝트 관리 루트'));
            console.log(chalk.gray('   .claude/commands/     - Claude 사용자 명령어'));

            console.log(chalk.green('\n🚀 다음 단계:'));
            console.log(chalk.white('   1. Claude Code에서 이 프로젝트를 엽니다'));
            console.log(chalk.white('   2. /project:moonklabs 명령어를 사용하여 프로젝트를 관리하세요'));
            console.log(chalk.white('   3. /project:moonklabs:initialize를 실행하여 프로젝트를 설정하세요\n'));

            console.log(chalk.blue('\n✨ 시작하려면:'));
            console.log(chalk.gray('   1. 새 터미널을 열거나 쉘 프로필을 소싱하세요 (예: source ~/.zshrc)'));
            console.log(chalk.gray(`   2. 다음을 실행하세요: ${chalk.cyan('claude')} 를 실행하여 사용 가능한 명령어를 확인하세요.`));
            console.log(chalk.gray('\n자세한 내용은 .moonklabs 디렉토리의 문서를 확인하세요.'));
        }

        console.log(chalk.green('\nEnjoy Moonklabs! 🚀\n'));

    } catch (error) {
        if (hasExisting) {
            spinner.fail(chalk.red('업데이트 실패'));
            await restoreFromBackup(spinner);
        } else {
            spinner.fail(chalk.red('설치 실패'));
        }
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

async function restoreFromBackup(spinner) {
    spinner.start(chalk.yellow('백업에서 복원 중... '));
    try {
        const backupFiles = (await fs.readdir('.')).filter(f => f.endsWith('.bak'));
        for (const backup of backupFiles) {
            const originalFile = backup.replace('.bak', '');
            try {
                await fs.rename(backup, originalFile);
            } catch (e) {
                console.warn(chalk.yellow(`'${backup}' 파일을 복원할 수 없습니다. 수동 확인이 필요합니다.`));
            }
        }
        spinner.succeed(chalk.green('성공적으로 복원되었습니다.'));
    } catch (error) {
        spinner.fail(chalk.red('복원에 실패했습니다.'));
        console.error(error);
    }
}

program
    .name('hello-moonklabs')
    .version('1.0.1')
    .description('Moonklabs 프레임워크 설치 프로그램')
    .option('-f, --force', '프롬프트 없이 강제 설치')
    .action(installMoonklabs);

program.parse(process.argv);