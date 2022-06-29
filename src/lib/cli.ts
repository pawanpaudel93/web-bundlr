#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import glob from 'glob';

import { log, WebBundlr, WebBundlrConfig } from './web-bundlr';

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
  const configFiles = glob.sync(path.join(process.cwd(), 'web-bundlr.config.{cjs,js}'));
  if (configFiles.length === 0) {
    log.error('Config file web-bundlr.config.js or web-bundlr.config.cjs not found');
    return;
  }
  const configPath = configFiles[0];
  try {
    const config: WebBundlrConfig = await require(configPath);
    await uploadFolder(config);
  } catch (e) {
    log.error(e?.message ?? e);
  }
};

main();
