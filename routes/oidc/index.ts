import { Response, Router } from 'express';
import { SessionNotFound } from 'oidc-provider/lib/helpers/errors';
import sanitizeHtml from 'sanitize-html';

import * as oidcCtrl from './oidc.ctrl';

const oidcRouter = Router();

oidcRouter.get('/interaction/:uid', oidcCtrl.interaction);

oidcRouter.post('/interaction/:uid/login', oidcCtrl.login);

oidcRouter.post('/interaction/:uid/confirm', oidcCtrl.confirm);

oidcRouter.get('/interaction/:uid/abort', oidcCtrl.abort);

oidcRouter.use((err, req, res: Response, next) => {
  if (err instanceof SessionNotFound) {
    // handle interaction expired / session not found error
    return res.render('error', {
      layout: false,
      error: err.name,
      message: sanitizeHtml(err.message),
    });
  }
  next(err);
});
export default oidcRouter;
