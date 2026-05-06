import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketsRouter from "./markets";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketsRouter);
router.use(usersRouter);

export default router;
