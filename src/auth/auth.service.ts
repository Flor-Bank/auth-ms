/* eslint-disable @typescript-eslint/no-unused-vars */
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.payload.interface';
import { NATS_CLIENT, envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(NATS_CLIENT) private readonly client: ClientProxy,
    private readonly jwtService: JwtService,
  ) {
    super();
  }
  async onModuleInit() {
    await this.$connect();
  }

  async signJwt(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  // register user
  // @PUBLIC
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
          email: email.toLowerCase().trim(),
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

  // login user
  // @PUBLIC
  async loginUser(loginUserDto: LoginUserDto) {
    const { username, password } = loginUserDto;
    try {
      //verify if user is already registered
      const user = await this.user.findUnique({
        where: {
          username,
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          email: true,
          password: true,
          isActive: true,
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
      if (!userData) {
        throw new RpcException({
          code: 400,
          message: `Invalid user`,
        });
      }
      if (!userData.isActive) {
        throw new RpcException({
          code: 400,
          message: `User is not active`,
        });
      }
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
