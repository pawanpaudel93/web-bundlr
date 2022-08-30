#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { listFrameworks } from '@netlify/framework-info';
import glob from 'glob';
import createJITI from 'jiti';
import { exec } from 'promisify-child-process';

import { log, WebBundlr, WebBundlrConfig } from './helpers/web-bundlr';

const jiti = createJITI(__filename);

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

const setConfig = (config: WebBundlrConfig, pattern: string, buildFolder: string) => {
  const configFiles = glob.sync(path.join(process.cwd(), pattern));
  if (configFiles.length > 0) {
    const _config = jiti(configFiles[0]);
    const config = _config.default ? _config.default : _config;
    config.folderPath = config.outDir ? config.outDir : buildFolder;
  } else {
    config.folderPath = buildFolder;
  }
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

const detectFramework = async (config: WebBundlrConfig) => {
  const frameworks = await listFrameworks('.');
  if (frameworks.length > 0) {
    const appType = frameworks[0].id;
    config.appType = appType;
    if (appType === 'create-react-app') {
      config.folderPath = 'build';
      await runCommand(config.autoBuild, 'npx react-scripts build');
    } else if (appType === 'next') {
      setConfig(config, 'next.config.{js,ts}', 'out');
      await runCommand(config.autoBuild, 'npx next build && npx next export');
    } else if (appType === 'vue') {
      setConfig(config, 'vue.config.{js,ts}', 'dist');
      await runCommand(config.autoBuild, 'npx vue-cli-service build');
    } else if (appType === 'nuxt') {
      setConfig(config, 'nuxt.config.{js,ts}', 'dist');
      await runCommand(config.autoBuild, 'npx nuxt generate');
    } else if (appType === 'vite') {
      setConfig(config, 'vite.config.{js,ts}', 'dist');
      await runCommand(config.autoBuild, 'npx vite build');
    }
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

const main = async () => {
  const configFiles = glob.sync(path.join(process.cwd(), 'web-bundlr.config.{js,ts}'));
  if (configFiles.length === 0) {
    log.error('Config file web-bundlr.config.js or web-bundlr.config.ts not found');
    return;
  }
  const configPath = configFiles[0];
  try {
    const _config = jiti(configPath);
    const config: WebBundlrConfig = _config.default ? _config.default : _config;
    await detectFramework(config);
    await uploadFolder(config);
  } catch (e) {
    log.error(e?.message ?? e);
  }
};

main();
