import * as fs from 'fs';

import Bundlr from '@bundlr-network/client';
import glob from 'glob';

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

export class WebBundlr extends Bundlr {
  private config: WebBundlrConfig;

  constructor(config: WebBundlrConfig) {
    super(config.url, config.currency, config.wallet, config.config);
    this.config = config;
  }

  private modifyHtmls(path: string) {
    const files = glob.sync(path + '/**/*.html');
    files.forEach((file) => {
      this.modifyHtml(file);
    });
  }

  private modifyHtml(path: string) {
    const html = fs.readFileSync(path, 'utf8');
    const modifiedHtml = html
      .replace('src="/', 'src="./')
      .replace("src='/", "src='./");
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
      async (log: string) => {
        console.log(log);
      }
    );
  }
}
