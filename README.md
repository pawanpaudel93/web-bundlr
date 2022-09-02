# web-bundlr

## Table of Contents

- [About](#about)
- [Installing](#installing)
- [Usage](#usage)
- [Contributing](#contributing)

> NOTE: WIP

## About <a name = "about"></a>

Web Bundlr is a CLI tool to deploy web apps to Arweave using Bundlr. Arweave is a protocol that allows you to store data permanently, sustainably, with a single upfront fee and Bundlr Network is a reliable multichain solution for Arweave which is building the future of data storage by bringing the speed and ease of web2 to web3 technology.
Learn more about [Bundlr](https://bundlr.network/) and [Arweave](https://www.arweave.org/).

> :warning: **Deploy using Devnet bundlr first to check everything is working and then deploy using production bundlr.**


## Installing <a name = "installing"></a>

Install the package using npm or yarn as desired to get started.
```
npm install -g web-bundlr
```

OR
```
yarn add global web-bundlr
```

## Usage <a name = "usage"></a>

Lets go through steps on how to use web-bundlr in your projects to deploy apps.

<span style='color: green;'>RECOMMENDED</span>: Use hash router in react, vue, and nuxt based apps. For next apps there is no hash based routing so manifest is adjusted for routes to work on reload but dynamic routes may not work on reload.

### ReactJS & NextJS

------------

#### **ReactJS**

<span style='color: green;'>RECOMMENDED</span>: Use HashRouter from react-router-dom in react apps. Check project [examples](https://github.com/pawanpaudel93/web-bundlr/tree/main/examples)

 #### **NextJS Static Export**

Learn about it [here](https://nextjs.org/docs/advanced-features/static-html-export) for the supported and unsupported features in static html export.

If you are having problems regarding images in nextjs html export, see [here](https://stackoverflow.com/questions/65487914/error-image-optimization-using-next-js-default-loader-is-not-compatible-with-n).

### VueJS & NuxtJS

------------

#### **VueJS**

<span style='color: green;'>RECOMMENDED</span>: Use router in hash mode in vue apps.

Modify vue.config.js or vue.config.ts to include the following config:
```
publicPath: "./" // default is /
```

#### **NuxtJS**

Modify nuxt.config.js or nuxt.config.ts to include the following config:

```
target: 'static', // default is 'server'
router: {
  mode: 'hash',
  base:  './'
}
```

Read more about going full static mode in nuxtjs [Going Full Static](https://nuxtjs.org/announcements/going-full-static/)

### ViteJS

------------

Examples of react, vue and svelte using vite is included in the examples folder.

> And now you have to add config file for web-bundlr to upload the production build to arweave.

Run this command to add configuration file for web-bundlr.

```
web-bundlr init
```

Now modify the configuration file (web-bundlr.config.js) as per your need from the following:

|  Name | Type   | Description   |
| ------------ | ------------ | ------------ |
|  url | string  |  URL to the bundler <br/> Eg: Production => <br/> - https://node1.bundlr.network <br/>- https://node2.bundlr.network <br/> Eg: Testnet => https://devnet.bundlr.network |
|   currency	| string  |  Supported Currencies: arweave, ethereum, matic, bnb, fantom, solana, avalanche, boba, boba-eth, arbitrum, chainlink, kyve, near and algorand |
|  wallet |  any |  private key (in whatever form required)|
| folderPath?	|	string	|	folderPath of the build folder to be deployed. Auto discovered for app using vue, nuxt, react, next and vite if not provided. It may be needed for simple JS/TS app. |
| appType?	|	string	|	Possible values: 'react', 'next', 'vue', 'nuxt', 'vite' and ''	|
| config?  |  Object |   |
| config.contractAddress?	  |  string |  contract address if its not a native currency |
| config.providerUrl?	 | string  |  Provide a RPC url or default public rpc url is used |
| config.timeout?	| number	| Default is used if not provided	|

Example of web-bundlr.config.js for different currency can be:

For Polygon (MATIC) on testnet.

```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "matic"
  wallet: "<private-key>",
  folderPath: "build",
  appType: "react",
  config: {
    providerUrl: "https://rpc.ankr.com/polygon_mumbai",
  },
};

export default WebBundlrConfig;
```

For Solana:

```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "solana"
  wallet: "<private-key>",
  folderPath: "out",
  appType: "next",
  config: {
    providerUrl: "https://api.devnet.solana.com",
  },
};

export default WebBundlrConfig;
```

For ERC20 Tokens: 

For example chainlink on Rinkeby testnet
```
/** @type {import('web-bundlr').WebBundlrConfig} */

const WebBundlrConfig = {
  url: "https://devnet.bundlr.network",
  currency: "chainlink"
  wallet: "<private-key>",
  folderPath: "dist",
  appType: "vue",
  config: {
    providerUrl: "https://rpc.ankr.com/eth_rinkeby",
    contractAddress: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709"
  },
};

export default WebBundlrConfig;
```

After the configuration, run web-bundlr command from the root folder of the project.

```
web-bundlr deploy
```
You have to fund the bundlr with the currency you have configured. The CLI will show how much bytes is going to be uploaded and how much amount in configured currency is required to perform the upload and it will ask for funding if the loaded balance is not sufficient.

## Author

👤 **Pawan Paudel**

- Github: [@pawanpaudel93](https://github.com/pawanpaudel93)

## 🤝 Contributing <a name = "contributing"></a>

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/pawanpaudel93/web-bundlr/issues).

## Show your support

Give a ⭐️ if this project helped you!

Copyright © 2022 [Pawan Paudel](https://github.com/pawanpaudel93).<br />