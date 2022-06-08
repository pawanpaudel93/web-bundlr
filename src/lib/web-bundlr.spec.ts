import test from 'ava';

import { WebBundlr } from './web-bundlr';

let bundlr: WebBundlr;
test.beforeEach(() => {
  // bundlr = new WebBundlr();
});

test('Get Balance from Arweave', async (t) => {
  const balance = await bundlr.getLoadedBalance();
  t.assert(balance.toNumber() > 0);
});
