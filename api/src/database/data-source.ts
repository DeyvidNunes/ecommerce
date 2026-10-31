import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseSsl } from '../config/database-ssl';

// Carrega as variáveis de ambiente do arquivo .env nativamente no Node 20+/24
try {
  process.loadEnvFile();
} catch (error) {
  // Ignora se o arquivo .env não existir (útil se as variáveis vierem do ambiente/Docker)
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'ecommerce',
  ssl: getDatabaseSsl(),
  poolSize: Number(process.env.DATABASE_POOL_SIZE ?? 10),

  // Aponta para as entidades nos formatos .ts (dev) e .js (build/dist)
  entities: [__dirname + '/../**/*.entity.{ts,js}'],

  // Aponta para onde as migrations geradas serão salvas e lidas
  migrations: [__dirname + '/migrations/*.{ts,js}'],

  // Desligado por segurança e padrão para uso de migrations
  synchronize: false,

  // Nome da tabela onde o TypeORM registrará as migrations executadas
  migrationsTableName: 'migrations',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
