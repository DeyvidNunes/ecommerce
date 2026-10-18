import { createClerkClient } from '@clerk/backend';
import { User } from './entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByClerkId(clerkId: string) {
    const user = await this.usersRepository.findOne({ where: { clerkId } });

    if (!user) {
      new NotFoundException(`Usuário ${clerkId} não encontrado`);
    }

    return user;
  }

  async create(clerkId: string) {
    const clerkUser = await this.clerkClient.users.getUser(clerkId);
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    const newUser = this.usersRepository.create({
      clerkId: clerkUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    });

    return await this.usersRepository.save(newUser);
  }

  async findOrCreateByClerkId(clerkId: string) {
    const user = await this.findByClerkId(clerkId);

    if (user) {
      return user;
    }

    return await this.create(clerkId);
  }



}
