import test from 'ava';
import ethWallet from 'ethereumjs-wallet';

import { WebBundlr } from './web-bundlr';

let bundlr: WebBundlr;
test.beforeEach(async () => {
  bundlr = new WebBundlr({
    url: 'https://devnet.bundlr.network',
    currency: 'matic',
    wallet: ethWallet.generate().getPrivateKey(),
    folderPath: 'build',
    config: {
      providerUrl: 'https://rpc.ankr.com/polygon_mumbai',
    },
  });
});

test('Get Balance from Bundlr', async (t) => {
  const balance = await bundlr.getLoadedBalance();
  t.assert(balance.toNumber() === 0);
});
