import * as fs from 'fs';

import Api from '@bundlr-network/client/build/common/api';
import Bundlr from '@bundlr-network/client/build/common/bundlr';
import Fund from '@bundlr-network/client/build/common/fund';
import Utils from '@bundlr-network/client/build/common/utils';
import getCurrency from '@bundlr-network/client/build/node/currencies/index';
import { NodeCurrency } from '@bundlr-network/client/build/node/types';
import { AxiosResponse } from 'axios';
import glob from 'glob';
import { Logger } from 'tslog';

import WebUploader from './upload';

export type WebBundlrConfig = {
  url: string;
  currency: string;
  wallet: any;
  folderPath?: string;
  autoBuild?: boolean;
  appType?: string;
  config?: {
    timeout?: number;
    providerUrl?: string;
    contractAddress?: string;
  };
};

export const log: Logger = new Logger({
  name: 'web-bundlr',
  displayFilePath: 'hidden',
  displayFunctionName: false,
  displayDateTime: false,
});

export class WebBundlr extends Bundlr {
  public declare uploader: WebUploader; // re-define type
  public declare currencyConfig: NodeCurrency;
  public folderPath: string;
  public appType: string;

  /**
   * Constructs a new Bundlr instance, as well as supporting subclasses
   * @param url - URL to the bundler
   * @param wallet - private key (in whatever form required)
   */
  constructor(config: WebBundlrConfig) {
    super();
    const parsed = new URL(config.url);
    this.api = new Api({
      protocol: parsed.protocol.slice(0, -1),
      port: parsed.port,
      host: parsed.hostname,
      timeout: config.config?.timeout ?? 100000,
    });
    this.currency = config.currency.toLowerCase();
    this.currencyConfig = getCurrency(
      this.currency,
      config.wallet,
      config.config?.providerUrl,
      config.config?.contractAddress
    );
    this.address = this.currencyConfig.address;
    this.utils = new Utils(this.api, this.currency, this.currencyConfig);
    this.funder = new Fund(this.utils);
    this.uploader = new WebUploader(this.api, this.utils, this.currency, this.currencyConfig);
    this.folderPath = config.folderPath;
    this.appType = config.appType;
  }

  /**
   * Upload a file at the specified path to the bundler
   * @param path path to the file to upload
   * @returns bundler response
   */
  async uploadFile(path: string): Promise<AxiosResponse<any>> {
    return this.uploader.uploadFile(path);
  }

  private modifyHtmls(path: string) {
    const files = glob.sync(path + '/**/*.html');
    for (let i = 0; i < files.length; i++) {
      this.modifyHtml(files[i]);
    }
  }

  private modifyHtml(path: string) {
    const html = fs.readFileSync(path, 'utf8');
    if (
      /src="\/(.*?)"/g.test(html) ||
      /src='\/(.*?)'/g.test(html) ||
      /href="\/(.*?)"/g.test(html) ||
      /href='\/(.*?)'/g.test(html)
    ) {
      const modifiedHtml = html
        .replace(/src="\/(.*?)"/g, 'src="$1"')
        .replace(/src='\/(.*?)'/g, "src='$1'")
        .replace(/href="\/(.*?)"/g, 'href="$1"')
        .replace(/href='\/(.*?)'/g, "href='$1'");
      fs.writeFileSync(path, modifiedHtml);
    }
  }

  public async uploadFolder() {
    this.modifyHtmls(this.folderPath);
    return this.uploader.uploadFolder(this, 'index.html', 10, false, async (logInfo: string) => {
      log.info(logInfo);
    });
  }
}
