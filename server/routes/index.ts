import { Router } from 'express';
import authRouter from './authRoutes.ts';
import customLeadsRouter from './customLeadsRoutes.ts';
import leadsRouter from './leadsRoutes.ts';
import savedListsRouter from './savedListsRoutes.ts';
import adminRouter from './adminRoutes.ts';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
// Note: Mount /leads/custom before /leads to ensure custom lead & cluster routes are evaluated first
apiRouter.use('/leads/custom', customLeadsRouter);
apiRouter.use('/leads', leadsRouter);
apiRouter.use('/lists', savedListsRouter);
apiRouter.use('/admin', adminRouter);

export default apiRouter;
