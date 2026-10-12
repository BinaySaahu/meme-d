import { Router } from "express";
import {
  createCampaign,
  listLiveCampaigns,
  listMyCampaigns,
} from "../controllers/campaignController";
import { authenticate, requireRole } from "../middleware/authenticate";

const router = Router();

router.get("/", listLiveCampaigns);
router.get("/mine", authenticate, requireRole("brand"), listMyCampaigns);
router.post("/", authenticate, requireRole("brand"), createCampaign);

export default router;
