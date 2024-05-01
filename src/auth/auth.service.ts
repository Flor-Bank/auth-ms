/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.payload.interface';
import { envs } from 'src/config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  constructor(private readonly jwtService: JwtService) {
    super();
  }
  async onModuleInit() {
    await this.$connect();
  }

  async signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }
  async registerUser(registerUserDto: RegisterUserDto) {
    const { username, firstName, lastName, email, password } = registerUserDto;
    try {
      //verify if user is already registered
      const user = await this.user.findUnique({
        where: {
          username,
        },
      });
      if (user) {
        throw new RpcException({
          code: 400,
          message: `User ${username} already registered`,
        });
      }
      //create new user
      const newUser = await this.user.create({
        data: {
          username,
          firstName,
          lastName,
          email,
          password: bcrypt.hashSync(password, 10),
        },
      });
      const { password: __, ...rest } = newUser;
      return {
        user: rest,
        token: await this.signJwt(rest),
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
        token: await this.signJwt(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  async verifyToken(token: string) {
    try {
      //verify & revalidate token
      const { sub, iat, exp, ...userData } = await this.jwtService.verify(
        token,
        {
          secret: envs.jwtSecret,
        },
      );
      return {
        sessionUser: userData,
        token: await this.signJwt(userData),
      };
    } catch (error) {
      console.error(error.message);
      throw new RpcException({
        status: 400,
        message: `Invalid token`,
      });
    }
  }
}
