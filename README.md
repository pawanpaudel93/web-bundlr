# web-bundlr

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Usage](#usage)
- [Contributing](#contributing)

> :warning: NOTE: WIP

## About <a name = "about"></a>

Web Bundlr is a package to deploy web apps to areweave using Bundlr. Bundlr Network is a reliable multichain solution for Arweave.
Learn more about [Bundlr](https://bundlr.network/) and [Arweave](https://www.arweave.org/).

> :warning: **Issue with deploying react apps on arweave is that apps are deployed and accessed using the basepath (Manifest ID) but due to the dynamic basepath we are unable to configure react app beforehand with the basepath and the url lacks basepath on the browser while visiting different routes and if reloaded it shows Not Found.**

> :warning: **Deploy using Devnet bundlr first to check everything is working and then deploy using production bundlr.**


## Installing <a name = "installing"></a>

Install the package using npm or yarn as desired to get started.
```
npm install -g web-bundlr

OR

yarn add global web-bundlr
```

## Usage <a name = "usage"></a>

In the initial phase for the project we will go through steps on how to use web-bundlr in your projects to push react and next.js web apps.

### React
Bundlr creates a arweave manifest file when uploading a folder. So the manifest contains the paths of the files and the transaction ID to resolve to for the given path. You can see more about it here [Arweave Manifest](https://github.com/ArweaveTeam/arweave/blob/master/doc/path-manifest-schema.md).

So make the react build compatible on the areweave, we must use relative urls on the href instead of absolute ones so that the manifest can resolve the file path. For example href="/dist/index.js" must be replaced with either href="dist/index.js" or href="./dist/index.js". So to do so, we must add the following to package.json so the paths can resolve correctly.
```
homepage: "."
```
Note for Nextjs Static Export: Add the configuration to the next.config file.
Learn about it [here](https://nextjs.org/docs/advanced-features/static-html-export) for the supported and unsupported features in static html export.
```
assetPrefix: "./",
```

Now you can create the production build. For react run
```
npm run build

OR

yarn build
```
For nextjs html export add the following to package.json scripts.
```
"export": "next build && next export"
```
And run: 
```
npm run export

OR

yarn export
```
If you are having problems regarding images in nextjs html export, see [here](https://stackoverflow.com/questions/65487914/error-image-optimization-using-next-js-default-loader-is-not-compatible-with-n).

And now you have to add config file for web-bundlr to upload the production build to arweave.

Create a file named web-bundlr.config.js on the root folder of your project and add the config as:

|  Name | Type   | Description   |
| ------------ | ------------ | ------------ |
|  url | string  |  URL to the bundler Eg: Production => https://node1.bundlr.network, https://node2.bundlr.network Testnet => https://devnet.bundlr.network |
|   currency	| string  |  Supported Currencies: arweave, ethereum, matic, bnb, fantom, solana, avalanche, boba, boba-eth, arbitrum, chainlink, kyve, near and algorand |
|  wallet? |  any |  private key (in whatever form required)|
| config?  |  Object |   |
| config.contractAddress?	  |  string |  contract address if its not a native currency |
|  config.providerUrl?	 | string  |  Provide a RPC url or default public rpc url is used |
|config.timeout?	| number	| Default is used if not provided	|
|folderPath	|	string	|	relative build folder path from project root folder Eg: 'build' ,'./build', 'out'	|

Example of web-bundlr.config.js for different currency can be:
For Polygon (MATIC) on testnet.

```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "matic"
  wallet: "<private-key>",
  folderPath: "build",
  config: {
    providerUrl: "https://polygon-mumbai.g.alchemy.com/v2/adadadadadsadadadadad",
  },
};

module.exports = WebBundlrConfig;
```

For Solana:

```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "solana"
  wallet: "<private-key>",
  folderPath: "build",
  config: {
    providerUrl: "https://api.devnet.solana.com",
  },
};

module.exports = WebBundlrConfig;
```

For ERC20 Tokens: For example chainlink on Rinkeby testnet
```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "chainlink"
  wallet: "<private-key>",
  folderPath: "build",
  config: {
    providerUrl: "<rinkeby-rpc>",
	contractAddress: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
  },
};

module.exports = WebBundlrConfig;
```

After the configuration, run web-bundlr command from the root folder of the project.

```
web-bundlr
```
You have to fund the bundlr with the currency you have configured. The cli will show how much bytes is going to be uploaded and how much amount in configured currency is required to perform the upload and it will ask for funding if the loaded balance is not sufficient.

## Author

👤 **Pawan Paudel**

- Github: [@pawanpaudel93](https://github.com/pawanpaudel93)

## 🤝 Contributing <a name = "contributing"></a>

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/pawanpaudel93/web-bundlr/issues).

## Show your support

Give a ⭐️ if this project helped you!

Copyright © 2022 [Pawan Paudel](https://github.com/pawanpaudel93).<br />