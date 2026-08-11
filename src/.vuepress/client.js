import { defineClientConfig } from "vuepress/client";
import OfficialAccountGate from "./components/OfficialAccountGate.vue";
import RightPromoBar from "./components/RightPromoBar.vue";

export default defineClientConfig({
  enhance() {},
  setup() {},
  rootComponents: [RightPromoBar, OfficialAccountGate],
});
