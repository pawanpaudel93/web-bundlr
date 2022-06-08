#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import fastFolderSize from 'fast-folder-size';
import prompt from 'prompt';
import { Logger } from 'tslog';

import { WebBundlr, WebBundlrConfig } from './web-bundlr';

const log: Logger = new Logger({
  name: 'web-bundlr',
  displayFilePath: 'hidden',
  displayFunctionName: false,
});

const schema = {
  properties: {
    amount: {
      pattern: /^[0-9]+(\.[0-9]+)?$/,
      message: 'Please enter a valid amount',
      required: true,
    },
  },
};

const uploadFolder = async (config: WebBundlrConfig) => {
  const bundlr = new WebBundlr(config);
  try {
    const fastFolderSizeAsync = promisify(fastFolderSize);
    const bytes = await fastFolderSizeAsync(config.folderPath);
    const currency = bundlr.currency.toUpperCase();
    const feeInBaseUnit = (await bundlr.getPrice(bytes)).toNumber();
    const base = bundlr.currencyConfig.base[1];
    const fee = feeInBaseUnit / base;
    log.info(`Uploading ${bytes} bytes costs ${fee} ${currency}`);
    const balanceInBaseUnit = (await bundlr.getLoadedBalance()).toNumber();
    const balance = balanceInBaseUnit / base;
    if (balanceInBaseUnit < feeInBaseUnit) {
      log.error(
        `${balance} ${currency} is not enough to upload ${bytes} bytes`
      );
      log.info(
        `Please enter an amount in ${currency} to fund bundlr to upload or press Ctrl+C to exit`
      );
      prompt.start();
      try {
        const { amount } = await prompt.get(schema);
        log.info(`Funding bundlr with ${amount} ${currency}`);
        await bundlr.fund(parseFloat(amount as string) * base);
        log.info(
          `Funded with ${amount} ${currency} and current bundlr balance is ${
            (await bundlr.getLoadedBalance()).toNumber() / base
          } ${currency}`
        );
      } catch (error) {
        if (error.message === 'canceled') {
          log.info('Exiting');
          return;
        }
        log.error(error);
        return;
      }
    }
    try {
      const result = await bundlr.uploadFolder();
      log.info(`Web app uploaded to https://arweave.net/${result}`);
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    log.error(e);
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
