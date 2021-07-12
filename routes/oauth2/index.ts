import { ensureLoggedIn } from 'connect-ensure-login';
import express, { urlencoded } from 'express';
import passport from 'passport';
import * as oauth2Ctrl from './oauth2.ctrl';

const oauth2Router = express.Router();

/* GET home page. */
oauth2Router.use(urlencoded({ extended: false }));
oauth2Router.get('/login', oauth2Ctrl.loginForm);
oauth2Router.post(
  '/login',
  passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect:
      '/oauth2/login?message=아이디와 비밀번호가 일치하지 않습니다.',
  })
);

oauth2Router.get('/logout', oauth2Ctrl.logout);
oauth2Router.get(
  '/account',
  ensureLoggedIn({ redirectTo: '/oauth2/login' }),
  oauth2Ctrl.account
);
oauth2Router.get(
  '/authorize',
  ensureLoggedIn({ redirectTo: '/oauth2/login' }),
  oauth2Ctrl.authorizeation
);
oauth2Router.post(
  '/authorize/decision',
  ensureLoggedIn({ redirectTo: '/oauth2/login' }),
  oauth2Ctrl.decision
);
oauth2Router.post(
  '/token',
  passport.authenticate(['basic', 'oauth2-client-password'], {
    session: false,
  }),
  oauth2Ctrl.token
);
oauth2Router.get('/logout', oauth2Ctrl.logout);
//oauth2Router.get('/default', oauth2Ctrl.setDefault);
oauth2Router.get(
  '/me',
  passport.authenticate('bearer', { session: false }),
  oauth2Ctrl.userInfo
);
export default oauth2Router;
