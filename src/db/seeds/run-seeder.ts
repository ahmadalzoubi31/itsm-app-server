// src/db/seeds/run-seeder.ts
import 'reflect-metadata';
import { runSeeders } from 'typeorm-extension';
import dataSource from '../data-source';
import InitialDataSeeder from './initial-data.seeder';

async function runSeeder() {
  try {
    console.log('🚀 Initializing database connection...');
    await dataSource.initialize();
    console.log('✅ Database connected successfully!\n');

    await runSeeders(dataSource, {
      seeds: [InitialDataSeeder],
    });

    console.log('\n🎉 All seeders completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeders:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runSeeder();
