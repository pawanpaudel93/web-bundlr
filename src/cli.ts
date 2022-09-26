#!/usr/bin/env node

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import { listFrameworks } from '@netlify/framework-info';
import chalk from 'chalk';
import { Command } from 'commander';
import glob from 'glob';
import createJITI from 'jiti';
import { exec } from 'promisify-child-process';

import { log, WebBundlr, WebBundlrConfig } from './lib/web-bundlr';

const jiti = createJITI(__filename);

let defaultConfig = `/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "matic",
  wallet: process.env.PRIVATE_KEY,
  folderPath: "FOLDER_PATH",
  appType: "APP_TYPE",
  config: {
    providerUrl: "https://rpc.ankr.com/polygon_mumbai",
  },
};

export default WebBundlrConfig;
`;

const buildCommands = {
  react: 'npx react-scripts build',
  next: 'npx next build && npx next export',
  vue: 'npx vue-cli-service build',
  nuxt: 'npx nuxt generate',
  vite: 'npx vite build --base "./"',
};

const checkConfig = (config: WebBundlrConfig) => {
  const errors: string[] = [];
  if (!config.url && typeof config.url !== 'string') {
    errors.push('url must be a string in web-bundlr config file.');
  }
  if (!config.currency && typeof config.currency !== 'string') {
    errors.push('currency must be a string in web-bundlr config file.');
  }
  if (!config.folderPath && typeof config.folderPath !== 'string') {
    errors.push('folderPath must be a string in web-bundlr config file.');
  }
  if (!config.wallet) {
    errors.push('wallet not specified in web-bundlr config file.');
  }
  if (errors.length > 0) {
    throw new Error(chalk.red('-> ') + errors.join('\n' + chalk.red('-> ')));
  }
};

const getConfig = (pattern: string, folderPath?: string) => {
  if (!folderPath) {
    const configFiles = glob.sync(path.join(process.cwd(), pattern));
    if (configFiles.length > 0) {
      const appConfig = jiti(configFiles[0]);
      return appConfig.default ? appConfig.default : appConfig;
    }
  }
  return {};
};

const runCommand = async (command: string) => {
  log.info('Running command: ' + chalk.gray(command));
  const child = exec(command);
  child.stdout.pipe(process.stdout);
  child.stderr.on('data', (data) => console.log(data));
  await child;
};

const detectFramework = async () => {
  const frameworks = await listFrameworks('.');
  if (frameworks.length > 0) {
    if (
      frameworks.length === 2 &&
      ((/[svelte|vite]/g.test(frameworks[0].id) && /[svelte|vite]/g.test(frameworks[1].id)) ||
        (/[svelte-kit|vite]/g.test(frameworks[0].id) && /[svelte-kit|vite]/g.test(frameworks[1].id)))
    ) {
      return 'vite';
    }
    return frameworks[0].id;
  }
  return '';
};

const buildConfig = async (config: WebBundlrConfig) => {
  const appType = config.appType && config.folderPath ? config.appType : await detectFramework();
  config.appType = appType === 'create-react-app' ? 'react' : appType;
  if (config.appType === 'react') {
    config.folderPath = 'build';
  } else if (config.appType === 'next') {
    const appConfig = getConfig('next.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig.outDir ? appConfig.outDir : 'out';
  } else if (config.appType === 'vue') {
    const appConfig = getConfig('vue.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig.outputDir ? appConfig.outputDir : 'dist';
  } else if (config.appType === 'nuxt') {
    const appConfig = getConfig('nuxt.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig?.generate?.dir ? appConfig?.generate?.dir : 'dist';
  } else if (config.appType === 'vite') {
    const appConfig = getConfig('vite.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig?.build?.outDir ? appConfig?.build?.outDir : 'dist';
  }
};

const buildApp = async (config: WebBundlrConfig) => {
  if (config.appType) {
    if (config.appType === 'react') {
      process.env.PUBLIC_URL = './';
    }
    await runCommand(buildCommands[config.appType]);
  }
};

const uploadFolder = async (config: WebBundlrConfig) => {
  checkConfig(config);
  await buildApp(config);
  if (fs.existsSync(config.folderPath)) {
    try {
      const bundlr = new WebBundlr(config);
      const address = bundlr.address;
      const ticker = bundlr.currencyConfig.ticker;
      const balanceInBaseUnit = (await bundlr.getLoadedBalance()).toNumber();
      const balance = bundlr.utils.unitConverter(balanceInBaseUnit);
      log.info(`Your Bundlr balance for address ${address}: ${balance} ${ticker}`);
      try {
        const result = await bundlr.uploadFolder();
        log.info(`Web app uploaded to https://arweave.net/${result}`);
      } catch (e) {
        if (e.message === 'canceled') {
          log.info('Exiting');
          return;
        }
        log.error(e?.message ?? e);
      }
    } catch (e) {
      log.error(e?.message ?? e);
    }
  } else {
    log.error(`Folder path ${config.folderPath} does not exist`);
  }
};

const init = async () => {
  const configFiles = glob.sync(path.join(process.cwd(), 'web-bundlr.config.{js,ts}'));
  if (configFiles.length > 0) {
    log.error('Config file already exists.');
    return;
  }
  const appType = await detectFramework();
  let folderPath = '';
  let configFileName = '';
  if (appType === 'create-react-app') {
    folderPath = 'build';
  } else if (appType === 'next') {
    folderPath = 'out';
  } else if (appType === 'vue') {
    const appConfig = getConfig('vue.config.{js,ts}');
    folderPath = appConfig.outputDir ? appConfig.outputDir : 'dist';
  } else if (appType === 'nuxt') {
    const appConfig = getConfig('nuxt.config.{js,ts}');
    folderPath = appConfig?.generate?.dir ? appConfig?.generate?.dir : 'dist';
  } else if (appType === 'vite') {
    const appConfig = getConfig('vite.config.{js,ts}');
    folderPath = appConfig?.build?.outDir ? appConfig?.build?.outDir : 'dist';
  }
  defaultConfig = defaultConfig
    .replace('FOLDER_PATH', folderPath)
    .replace('APP_TYPE', appType === 'create-react-app' ? 'react' : appType);
  configFileName = 'web-bundlr.config.js';
  await fsPromises.writeFile(configFileName, defaultConfig);
  log.info(`Config file ${configFileName} successfully created.`);
};

const deploy = async () => {
  const configFiles = glob.sync(path.join(process.cwd(), 'web-bundlr.config.{js,ts}'));
  if (configFiles.length === 0) {
    log.error('Config file web-bundlr.config.js or web-bundlr.config.ts not found');
    return;
  }
  const configPath = configFiles[0];
  try {
    const config = jiti(configPath);
    const cliConfig: WebBundlrConfig = config.default ? config.default : config;
    await buildConfig(cliConfig);
    await uploadFolder(cliConfig);
  } catch (e) {
    log.error(e?.message ?? e);
  }
};

const program = new Command();
program
  .name('web-bundlr')
  .description('A CLI tool to deploy web apps to Arweave using Bundlr Network')
  .version('2.0.0');

program.command('init').description('Initialize web-bundlr configuration.').action(init);
program.command('deploy').description('Deploy web app to Arweave.').action(deploy);
program.parse(process.argv);
