import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { QueryProductsDto } from './dto/query-products.dto';
import { randomUUID } from 'node:crypto';
import { BadRequestException, Logger } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { detectImageType } from './image-type';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly storage: StorageService,
  ) {}

  create(createProductDto: CreateProductDto) {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  findAll(query: QueryProductsDto) {
    return this.search(query, false);
  }

  findAllForAdmin(query: QueryProductsDto) {
    return this.search(query, true);
  }

  async search(
    { page, limit, search, category }: QueryProductsDto,
    includeInactive: boolean,
  ) {
    const qb = this.productsRepository.createQueryBuilder('product');

    if (!includeInactive) {
      qb.andWhere('product.active = :active', { active: true });
    }

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return product;
  }

  async findOneActive(id: number) {
    const product = await this.findOne(id);

    if (!product.active) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    if (!product.active) {
      return;
    }

    product.active = false;
    await this.productsRepository.save(product);
  }

    async setImage(id: number, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Envie um arquivo no campo "file"');
    }

    const type = detectImageType(file.buffer);
    if (!type) {
      throw new BadRequestException(
        'Formato inválido. Envie uma imagem JPEG, PNG ou WebP',
      );
    }

    const product = await this.findOne(id);
    const previousUrl = product.imageUrl;

    const path = `products/${id}/${randomUUID()}.${type.ext}`;
    const url = await this.storage.upload(path, file.buffer, type.mime);

    product.imageUrl = url;
    try {
      await this.productsRepository.save(product);
    } catch (error) {
      // O produto não foi atualizado: remove o arquivo recém-enviado
      await this.storage.removeByUrl(url);
      throw error;
    }

    // Troca concluída: o arquivo antigo (se for do nosso bucket) não serve mais
    if (previousUrl && previousUrl !== url) {
      await this.storage.removeByUrl(previousUrl);
    }

    return product;
  }
}
