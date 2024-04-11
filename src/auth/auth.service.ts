import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';

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
          password: bcrypt.hashSync(password, 10),
        },
      });
      const { password: __, ...rest } = newUser;
      return {
        user: rest,
        token: 'abc123',
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      //verify if user is already registered
      const user = await this.user.findUnique({
        where: {
          email,
        },
      });
      if (!user) {
        throw new RpcException({
          code: 400,
          message: `Invalid credentials`,
        });
      }
      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (!passwordMatch) {
        throw new RpcException({
          code: 400,
          message: `Invalid credentials`,
        });
      }

      const { password: __, ...rest } = user;
      return {
        user: rest,
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
