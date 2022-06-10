#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { log, WebBundlr, WebBundlrConfig } from './web-bundlr';

const uploadFolder = async (config: WebBundlrConfig) => {
  const bundlr = new WebBundlr(config);
  if (fs.existsSync(config.folderPath)) {
    try {
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
  const configPath = path.join(process.cwd(), 'web-bundlr.config.js');
  if (fs.existsSync(configPath)) {
    const config: WebBundlrConfig = await require(configPath);
    await uploadFolder(config);
  } else {
    log.error('No web-bundlr.config.js found in current directory');
  }
};

main();
