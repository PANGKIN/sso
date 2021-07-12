import express, { urlencoded } from 'express';

import * as joinCtrl from './join.ctrl';

const joinRouter = express.Router();

joinRouter.use(urlencoded({ extended: false }));
joinRouter.get('/', joinCtrl.joinForm);
joinRouter.post('/', joinCtrl.join);
joinRouter.post('/confirm/:type', joinCtrl.confirm);

export default joinRouter;
