import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication) {
  const configService = new ConfigService();
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Determine server URL based on environment
  const serverUrl =
    nodeEnv === 'production'
      ? 'https://itsm.webpexo.com/'
      : `http://localhost:${port}/`;

  const config = new DocumentBuilder()
    .setTitle('ITSM ESM Platform API')
    .setDescription('Enterprise Service Management API Documentation')
    .setVersion('1.0.0')
    .addServer(
      serverUrl,
      `${nodeEnv.charAt(0).toUpperCase() + nodeEnv.slice(1)} Server`,
    )
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/api/docs-json', // Accessible URL for JSON
    yamlDocumentUrl: '/api/docs-yaml', // Optional: YAML format
    swaggerOptions: {
      persistAuthorization: true, // keeps JWT after reload
      tagsSorter: 'alpha',
      operationsSorter: 'method',
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
    },
    customSiteTitle: 'ITSM API Docs',
    customfavIcon: '/favicon.ico',
  });
}
