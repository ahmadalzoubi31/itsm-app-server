import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Role } from './users/enums/role.enum';
import { hash } from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // to change the type of the param "id" from string to number
      },
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Protect your app from some well-known web vulnerabilities by setting HTTP headers appropriately
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  app.enableCors({
    origin:
      // 'https://itsm-app-79ws-5ghy90i9b-ahmadalzoubi31s-projects.vercel.app', // must be the exact origin of your frontend
      'http://localhost:8080',
    credentials: true, // allow cookies
  });

  // Get TypeORM DataSource
  const dataSource = app.get(DataSource);

  // Create the user
  const userRepo = dataSource.getRepository(User);

  const exists = await userRepo.findOneBy({ username: 'appadmin' });
  if (!exists) {
    const user = userRepo.create({
      firstName: 'App',
      lastName: 'Admin',
      username: 'appadmin',
      email: 'appadmin@example.com',
      password: await hash('P@ssw0rd', 10), // You should hash this!
      role: Role.ADMIN,
      status: 'active',
    });
    await userRepo.save(user);
    console.log('Seeded admin user!');
  } else {
    console.log('Admin user already exists.');
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
