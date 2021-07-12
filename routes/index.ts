import { Router } from 'express';

import joinRouter from './join';
import oauth2Router from './oauth2';
import oidcRouter from './oidc';

const indexRouter = Router();

indexRouter.use('/oidc', oidcRouter);
indexRouter.use('/oauth2', oauth2Router);
indexRouter.use('/join', joinRouter);

export default indexRouter;
