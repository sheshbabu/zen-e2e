import { test as setup } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';

// zen has migrated the schema and onboarding has created the user, so only the content is left to load.
setup('seed the database', async () => {
  execFileSync('sqlite3', ['.zen/data/zen.db', '.read visual/seed.sql']);
  fs.copyFileSync('visual/kyoto.png', '.zen/data/images/kyoto.png');
});
