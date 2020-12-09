import { runDatabaseScript } from './utils';

runDatabaseScript(db => db.migrate.latest());
