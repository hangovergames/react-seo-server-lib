# @heusalagroup/fi.hg.ssr

TypeScript Library for ReactJS Server Side Rendering as a Git Submodule.

Use it as a git submodule:

```shell
mkdir -p src/fi/hg
git submodule add git@github.com:heusalagroup/fi.hg.ssr.git src/fi/hg/ssr
git config -f .gitmodules submodule.src/fi/hg/ssr.branch main
```

...and install also our core module:

```shell
git submodule add git@github.com:heusalagroup/fi.hg.core.git src/fi/hg/core
git config -f .gitmodules submodule.src/fi/hg/core.branch main
```

You also will need Lodash: 

```shell
npm install --save-dev lodash '@types/lodash'
```
