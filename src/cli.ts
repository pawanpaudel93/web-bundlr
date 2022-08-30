#!/usr/bin/env node

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import { listFrameworks } from '@netlify/framework-info';
import { Command } from 'commander';
import glob from 'glob';
import createJITI from 'jiti';
import { exec } from 'promisify-child-process';

import { log, WebBundlr, WebBundlrConfig } from './helpers/web-bundlr';

const jiti = createJITI(__filename);

let defaultConfig = `/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "matic",
  wallet: process.env.PRIVATE_KEY,
  folderPath: "FOLDERPATH",
  autoBuild: true,
  config: {
    providerUrl: "https://rpc.ankr.com/polygon_mumbai",
  },
};

module.exports = WebBundlrConfig;
`;

const checkConfig = (config: WebBundlrConfig) => {
  if (!config.url && typeof config.url !== 'string') {
    throw new Error('url must be a string in web-bundlr config file');
  }
  if (!config.currency && typeof config.currency !== 'string') {
    throw new Error('currency must be a string in web-bundlr config file');
  }
  if (!config.folderPath && typeof config.folderPath !== 'string') {
    throw new Error('folderPath must be a string in web-bundlr config file');
  }
  if (!config.wallet) {
    throw new Error('wallet not specified in web-bundlr config file');
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

const runCommand = async (autoBuild: boolean, command: string) => {
  if (autoBuild) {
    log.info('Running command: ' + command);
    const child = exec(command);
    child.stdout.pipe(process.stdout);
    child.stderr.on('data', (data) => console.log(data));
    await child;
  }
};

const detectFramework = async () => {
  const frameworks = await listFrameworks('.');
  if (frameworks.length > 0) {
    return frameworks[0].id;
  }
  return '';
};

const buildConfig = async (config: WebBundlrConfig) => {
  const appType = await detectFramework();
  config.appType = appType;
  if (appType === 'create-react-app') {
    config.folderPath = 'build';
    await runCommand(config.autoBuild, 'npx react-scripts build');
  } else if (appType === 'next') {
    const appConfig = getConfig('next.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig.outDir ? appConfig.outDir : 'out';
    await runCommand(config.autoBuild, 'npx next build && npx next export');
  } else if (appType === 'vue') {
    const appConfig = getConfig('vue.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig.outputDir ? appConfig.outputDir : 'dist';
    await runCommand(config.autoBuild, 'npx vue-cli-service build');
  } else if (appType === 'nuxt') {
    const appConfig = getConfig('nuxt.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig?.generate?.dir ? appConfig?.generate?.dir : 'dist';
    await runCommand(config.autoBuild, 'npx nuxt generate');
  } else if (appType === 'vite') {
    const appConfig = getConfig('vite.config.{js,ts}', config.folderPath);
    config.folderPath = appConfig?.build?.outDir ? appConfig?.build?.outDir : 'dist';
    await runCommand(config.autoBuild, 'npx vite build');
  }
};

const uploadFolder = async (config: WebBundlrConfig) => {
  checkConfig(config);
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
  if (appType === 'create-react-app') {
    folderPath = 'build';
  } else if (appType === 'next') {
    const appConfig = getConfig('next.config.{js,ts}');
    folderPath = appConfig.outDir ? appConfig.outDir : 'out';
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
  defaultConfig = defaultConfig.replace('FOLDERPATH', folderPath);
  await fsPromises.writeFile('web-bundlr.config.js', defaultConfig);
  log.info('Config file web-bundlr.config.js successfully created.');
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
  .version('1.0.3');

program.command('init').description('Initialize web-bundlr configuration.').action(init);
program.command('deploy').description('Deploy web app to Arweave.').action(deploy);
program.parse();
