import 'reflect-metadata';
import { getDb } from './database/database.module';
import { AnalysisWorker } from './modules/analyses/analysis.worker';

const worker = new AnalysisWorker();
worker.onModuleInit();
console.log('[Worker] Analysis worker started, polling every 3s');
