import {Express} from 'express';
import cors from 'cors';
import session from 'express-session';
import RedisStore from 'connect-redis';
import {Redis} from 'ioredis';
import cookieParser from 'cookie-parser';
import get from 'lodash.get';
import {parse} from 'cookie';
import {REDIS_SESSION_PREFIX} from 'app/constants.js';

const expressPlugins = async (express: Express) => {
  express.disable('x-powered-by');
  express.set('trust proxy', true);
  express.use(cors({
    origin: [`${process.env.SERVER_URL}`, `${process.env.FRONTEND_URL}`],
    allowedHeaders: [
      'Origin',
      'Keep-Alive',
      'User-Agent',
      'If-Modified-Since',
      'Cache-Control',
      'Content-Type',
      'X-Requested-With',
      'Accept',
      'Content-Encoding',
      'Cookie',
      'Set-Cookie',
      'Tus-Resumable',
      'Upload-Length',
      'Upload-Metadata',
      'Upload-Offset'
    ],
    preflightContinue: true,
    credentials: true
  }));
  express.use(cookieParser());
  express.use<any>((req, res, next) => {
    if('OPTIONS' === req.method) {
      return res.sendStatus(204);
    }
    if('authorization' in req.headers && !get(req, `cookies.${process.env.SESSIONS_KEY}`)) {
      const authorization = get(req, 'headers.authorization', '').replace(/^Bearer\s/, '');
      if(!authorization) {
        return next();
      }
      const cookies = parse(get(req, 'headers.cookie', ''));
      cookies[`${process.env.SESSIONS_KEY}`] = authorization;
      req.headers['cookie'] = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
    }
    return next();
  });
  express.use((req, res, next) => {
    let domain = process.env.SERVER_COOKIE_HOST || process.env.SERVER_HOST;
    /*let webDomain = undefined;
    try {
      webDomain = new URL(req.headers.origin || req.headers.referer).hostname;
    } catch(e) {
    }
    switch(webDomain) {
      case 'app.skinport.com': {
        domain = '.skinport.com';
        break;
      }
    }*/
    const expressSession = session({
      name: process.env.SESSIONS_KEY,
      store: new RedisStore({
        client: new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: 6379
        }),
        prefix: REDIS_SESSION_PREFIX
      }),
      secret: process.env.COOKIE_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        domain,
        // secure: true
        sameSite: 'lax'
      }
    });
    expressSession(req, res, next);
  });
};
export default expressPlugins;
