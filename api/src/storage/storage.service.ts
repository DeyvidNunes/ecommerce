import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL').replace(/\/+$/, '');
    this.bucket = config.getOrThrow<string>('SUPABASE_STORAGE_BUCKET');
    this.publicBase = `${url}/storage/v1/object/public/${this.bucket}/`;
    this.client = createClient(
      url,
      config.getOrThrow<string>('SUPABASE_SECRET_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async upload(
    path: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, body, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

    if (error) {
      this.logger.error(`Falha no upload de ${path}: ${error.message}`);
      throw new InternalServerErrorException(
        'Não foi possível enviar a imagem',
      );
    }

    return this.client.storage.from(this.bucket).getPublicUrl(path).data
      .publicUrl;
  }

  // Só remove arquivos do nosso bucket; qualquer outra URL é ignorada
  async removeByUrl(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith(this.publicBase)) {
      return;
    }

    const path = decodeURIComponent(url.slice(this.publicBase.length));
    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([path]);

    if (error) {
      this.logger.warn(`Falha ao remover ${path}: ${error.message}`);
    }
  }
}