import * as fs from 'fs';

import Bundlr from '@bundlr-network/client';
import glob from 'glob';
import { Logger } from 'tslog';

export type WebBundlrConfig = {
  url: string;
  currency: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any;
  folderPath: string;
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
  private config: WebBundlrConfig;

  constructor(config: WebBundlrConfig) {
    super(config.url, config.currency, config.wallet, config.config);
    this.config = config;
  }

  private modifyHtmls(path: string) {
    const files = glob.sync(path + '/**/*.html');
    for (let i = 0; i < files.length; i++) {
      this.modifyHtml(files[i]);
    }
  }

  private modifyHtml(path: string) {
    const html = fs.readFileSync(path, 'utf8');
    const modifiedHtml = html
      .replace(/src="\/(.*?)"/g, 'src="./$1"')
      .replace(/src='\/(.*?)'/g, "src='$1'");
    fs.writeFileSync(path, modifiedHtml);
  }

  public async uploadFolder() {
    this.modifyHtmls(this.config.folderPath);
    return this.uploader.uploadFolder(
      this.config.folderPath,
      'index.html',
      10,
      false,
      true,
      async (logInfo: string) => {
        log.info(logInfo);
      }
    );
  }
}
