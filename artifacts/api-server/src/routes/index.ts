import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketsRouter from "./markets";
import usersRouter from "./users";
import aiInsightsRouter from "./ai-insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketsRouter);
router.use(usersRouter);
router.use(aiInsightsRouter);

export default router;
