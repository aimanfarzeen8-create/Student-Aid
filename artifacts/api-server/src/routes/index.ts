import { Router, type IRouter } from "express";
import healthRouter from "./health";
import termsRouter from "./terms";
import statsRouter from "./stats";
import tasksRouter from "./tasks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(termsRouter);
router.use(statsRouter);
router.use(tasksRouter);

export default router;
