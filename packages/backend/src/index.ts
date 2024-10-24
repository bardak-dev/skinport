import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {ExpressAdapter, NestExpressApplication} from '@nestjs/platform-express';
import express, {Express} from 'express';
import mongoose from 'mongoose';
import {HttpException, HttpStatus, ValidationPipe} from '@nestjs/common';
import {Logger, LogLevel} from 'app/config/logger/api-logger.js';
import {AppModule} from 'app/app.module.js';
import {DefaultLogger} from 'app/config/logger/default-logger.js';
import expressPlugins from 'app/plugins/express/index.js';

mongoose.pluralize(null);
Logger.useLogger(
  new DefaultLogger({
    level: process.env.LOGGER_LEVEL ? Number(process.env.LOGGER_LEVEL) : LogLevel.Info
  })
);
Logger.info(`Bootstrapping skinport.com (pid: ${process.pid}) 🚀`);
DefaultLogger.hideNestBootstrapLogs();
const expressApp: Express = express();
const adapter = new ExpressAdapter(expressApp);
const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter, {
  logger: new Logger()
});
await expressPlugins(expressApp);
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (errors) => {
    // console.log('errors', errors);
    const result = errors.map((error) => ({
      property: error.property,
      messages: Object.values(error.constraints)
    }));
    return new HttpException({
      statusCode: HttpStatus.BAD_REQUEST,
      messages: result
    }, HttpStatus.BAD_REQUEST);
  }
}));
SwaggerModule.setup('/api/playground/rest', app, SwaggerModule.createDocument(app, new DocumentBuilder()
.setTitle('skinport.com API')
.setDescription(
  `Backend API for <a href="https://backend.skinport.com" target="_blank">https://backend.skinport.com</a>`
)
.addBearerAuth({
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  in: 'header'
}, 'bearer-sid')
.setVersion('0.0')
.build()));

await app.listen(parseInt(String(process.env.PORT)) || 2050, '0.0.0.0', async () => {
  DefaultLogger.restoreOriginalLogLevel();
  const version = '1.0.0';
  const port = parseInt(String(process.env.PORT)) || 2050;
  Logger.info(`=================================================`);
  Logger.info(`BACKEND (v: ${version}) now running on port ${port} ✨`);
  Logger.info(`SWAGGER: http://localhost:${port}/api/playground/rest`);
  Logger.info(`=================================================`);
});
app.enableShutdownHooks();
