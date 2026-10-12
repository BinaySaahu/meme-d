import { Router } from "express";
import {
  createSubmission,
  listMySubmissions,
  updateViews,
} from "../controllers/submissionController";
import { authenticate, requireRole } from "../middleware/authenticate";

const router = Router();

router.patch("/:id/views", updateViews);
router.use(authenticate, requireRole("creator"));
router.get("/mine", listMySubmissions);
router.post("/", createSubmission);

export default router;
