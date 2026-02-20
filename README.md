# Congenica's adapted version of Panogram

To see the original README see [here](./panogram-README.md).

The instructions here are for developing and building panogram.

## Setup
With [nvm](https://github.com/nvm-sh/nvm) tool installed, run
```
nvm use
npm ci
npx bower install
```
for using a node version that is expected by the repo,
installing node & bower dependencies.

### Running
Currently the backend is not configured for it properly, it diverged some time ago.
Best bet is to actually use it integrated where backend will be available.

### Building

Before committing any changes you must run a build.

```
npm run build
```

Note: If you have run npm install and have updated the lock file this will likely break the CI.
