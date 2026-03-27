import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //set prefix api
  app.setGlobalPrefix('api/v1');

  // cau hinh validation global
  app.useGlobalPipes(new ValidationPipe());

  // cau hinh swagger
  const config = new DocumentBuilder()
    .setTitle('InterviewDojo API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth() // ho tro test token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
  console.log('Swagger UI: http://localhost:3000/api/docs');
}
bootstrap();
