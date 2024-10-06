# Rock Paper Scissors

> "Life is more fun if you play games."
> — Roald Dahl

[![build](https://github.com/MediaComem/rps/actions/workflows/build.yml/badge.svg)](https://github.com/MediaComem/rps/actions/workflows/build.yml)
[![publish](https://github.com/MediaComem/rps/actions/workflows/publish.yml/badge.svg)](https://github.com/MediaComem/rps/actions/workflows/publish.yml)
[![license](https://img.shields.io/github/license/MediaComem/rps)](https://opensource.org/licenses/MIT)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Requirements](#requirements)
- [Usage](#usage)
  - [Initial setup](#initial-setup)
  - [Updating](#updating)
  - [Local development](#local-development)
  - [Production deployment](#production-deployment)
- [Configuration](#configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Requirements

* [Node.js][node] 14+
* [PostgreSQL][postgres] 12+



## Usage

### Initial setup

Install and configure the application:

```bash
# Clone the repository.
git clone https://github.com/MediaComem/rps.git

# Install dependencies.
cd rps
npm ci

# Create a PostgreSQL user named "rps".
sudo -u postgres createuser --pwprompt rps

# Create an empty PostgreSQL database named "rps" and owned by the "rps" user.
sudo -u postgres createdb --owner rps rps

# Create the "uuid-ossp" PostgreSQL extension in the "rps" database.
sudo -u postgres psql -d rps -c 'CREATE EXTENSION "uuid-ossp"'

# Create a .env file and edit it to adapt the PostgreSQL connection URL
# according to the user and database you just created.
cp .env.sample .env
```

If you are in a **memory-constrained environment** such as a small cloud server,
install the pre-compiled version of the application which will be downloaded
from GitHub:

```bash
npm run build:precompiled
```

*Otherwise*, you can perform a full build, which requires copious amounts of CPU
and RAM:

```bash
npm run build
```

Once the build is done, migrate the database to the latest version:

```bash
npm run migrate
```

### Updating

To take all changes into account after updating the code to the latest version,
execute the following commands in the application's directory:

```bash
# Update dependencies (install new ones and upgrade existing ones).
npm install

# Install the pre-compiled build or build the application again (one or the
# other depending on your server's capabilities).
npm run build:precompiled
npm run build

# Migrate the database to the latest version.
npm run migrate
```

### Local development

> **WARNING:** do **NOT** do this in **memory-constrained** environments such as
> a small cloud server. This is intended for development on your local machine.

```bash
# Run the application in development mode with live code reload.
npm run dev
```

### Production deployment

```bash
# Run the application in production mode.
npm start
```



## Configuration

The following environment variables can be set to customize the application's
behavior:

Variable             | Default value                    | Description
:------------------- | :------------------------------- | :------------------------------------------------
`RPS_DATABASE_DEBUG` | `false`                          | When true, database queries are logged.
`RPS_DATABASE_URL`   | `postgresql://rps@localhost/rps` | PostgreSQL connection URL.
`RPS_PORT` or `PORT` | `3000`                           | The port on which the application will listen to.



[node]: https://nodejs.org
[postgres]: https://www.postgresql.org
