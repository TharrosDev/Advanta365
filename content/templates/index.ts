import { assessTheImpactTemplates } from "./assess-the-impact";
import { buildTheTrainingTemplates } from "./build-the-training";
import { defineTheChangeTemplates } from "./define-the-change";
import { deliverTrainingTemplates } from "./deliver-training";
import { designThePlatformTemplates } from "./design-the-platform";
import { engageLeadersTemplates } from "./engage-leaders";
import { goLiveAndSupportTemplates } from "./go-live-and-support";
import { makeItStickTemplates } from "./make-it-stick";
import { planCommunicationsTemplates } from "./plan-communications";
import { planTheTrainingTemplates } from "./plan-the-training";
import { setTheStrategyTemplates } from "./set-the-strategy";
import { startHereTemplates } from "./start-here";
import { usedAtEveryStepTemplates } from "./used-at-every-step";

// Listed in folder order: the free samples come out of this list in that order.
export const templates = [
  ...startHereTemplates,
  ...defineTheChangeTemplates,
  ...assessTheImpactTemplates,
  ...setTheStrategyTemplates,
  ...engageLeadersTemplates,
  ...planCommunicationsTemplates,
  ...designThePlatformTemplates,
  ...planTheTrainingTemplates,
  ...buildTheTrainingTemplates,
  ...deliverTrainingTemplates,
  ...goLiveAndSupportTemplates,
  ...makeItStickTemplates,
  ...usedAtEveryStepTemplates,
];
