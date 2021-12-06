# @hangovergames/ssr

Git Module TypeScript Library for ReactJs Server Side Rendering

```shell
mkdir -p src/fi/hangovergames
git submodule add git@github.com:hangovergames/ssr.git src/fi/hangovergames/ssr
git config -f .gitmodules submodule.src/fi/hangovergames/ssr.branch main
```

Our dependency:

```shell
mkdir -p src/fi/nor
git submodule add git@github.com:sendanor/typescript.git src/fi/nor/ts
git config -f .gitmodules submodule.src/fi/nor/ts.branch main
```

You need Lodash, too: `npm install --save-dev lodash '@types/lodash'`

Also see [ssr-server](https://github.com/hangovergames/ssr-server) for other dependencies.
