import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupSwagger } from 'common/utils/setup-swagger'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  )
  setupSwagger(app)

  await app.listen(3000)
}
bootstrap()
