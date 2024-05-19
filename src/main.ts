import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { envs } from './config';
import { ValidationError } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(validationErrors);
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen();
}
bootstrap();
