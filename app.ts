import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import sassMiddleware from 'node-sass-middleware';
import helmet from 'helmet';
import { Provider } from 'oidc-provider';
import expressEjsLayouts from 'express-ejs-layouts';
import session from 'express-session';
import passport from 'passport';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

import Account from './lib/oidc/account';
import configuration from './lib/oidc/configuration';
import indexRouter from './routes';
import MongoAdapter from './lib/oidc/mongodb';

const {
  PORT = 5000,
  ISSUER = `http://localhost:${PORT}`,
  DBHOST,
  MONGO_URI = 'sso',
  EXPRESS_SESSTION_KEY,
  MONGO_SESSION_KEY,
} = process.env;

if (!EXPRESS_SESSTION_KEY || !MONGO_SESSION_KEY) {
  process.exit(1);
}

configuration.findAccount = Account.findAccount;

const mongoUri = `mongodb://${DBHOST}/${MONGO_URI}` || '';

(async () =>
  await mongoose
    .connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((e) => {
      console.error(e);
    }))();

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressEjsLayouts);
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", 'localhost', '*.pangkin.com'],
      },
    },
  })
);

app.use(logger('dev'));
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true, // true = .sass and false = .scss
    sourceMap: true,
  })
);
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: EXPRESS_SESSTION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      ttl: 86400,
      crypto: {
        secret: MONGO_SESSION_KEY,
      },
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
import './auth/index';

const adapter = MongoAdapter;

const prod = process.env.NODE_ENV === 'production';

const provider = new Provider(ISSUER, { adapter, ...configuration });

if (prod) {
  app.enable('trust proxy');
  provider.proxy = true;

  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      res.redirect(`https://${req.get('host')}${req.originalUrl}`);
    } else {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'do yourself a favor and only use https',
      });
    }
  });
}
//new provider.InitialAccessToken({}).save().then(console.log);
app.use((req, res, next) => {
  req.provider = provider;
  next();
});
app.use('/', indexRouter);
app.use('/oidc', provider.callback());

export default app;
