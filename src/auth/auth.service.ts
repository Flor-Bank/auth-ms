import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { RegisterUserDto } from './dto';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { identityNumber, firstName, lastName, email, password } =
      registerUserDto;
    try {
      //verify if user is already registered
      const user = await this.user.findUnique({
        where: {
          identityNumber,
        },
      });
      if (user) {
        throw new RpcException({
          code: 400,
          message: 'User already registered',
        });
      }
      //create new user
      const newUser = await this.user.create({
        data: {
          identityNumber,
          firstName,
          lastName,
          email,
          password, //TODO hash password
        },
      });
      return {
        user: newUser,
        token: 'abc123',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }
}
