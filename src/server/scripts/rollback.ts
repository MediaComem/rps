import { runDatabaseScript } from './utils';

runDatabaseScript(db => db.migrate.rollback());
