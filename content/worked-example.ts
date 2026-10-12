import type { ContentsEntry } from "@/lib/catalog/worked-example";

/**
 * The table of contents of the Meridian Group worked example, as `/sample` prints it.
 *
 * TODO(owner): these are placeholder sections. The example's real file is not in the repository,
 * so its real contents are unknown. The sections below are the core pieces `/sample` already names
 * ("a business case, a CM strategy, a stakeholder map, a comms plan, kickoff emails, champion
 * networks, training, a cutover playbook, hypercare and sustainment"), in that order, each pointing
 * at the catalog page for that piece. Replace them with the file's own section titles and order
 * when it is published, then set `placeholder` to false so the page drops its placeholder labels.
 */
export const workedExampleContents: { placeholder: boolean; entries: readonly ContentsEntry[] } = {
  placeholder: true,
  entries: [
    { title: "Business case", see: { template: "adoption-business-case-one-pager" } },
    { title: "Change management strategy", see: { template: "change-management-strategy" } },
    { title: "Stakeholder map", see: { template: "stakeholder-map-and-analysis" } },
    { title: "Communications plan", see: { template: "master-communications-plan" } },
    { title: "Kickoff emails", see: { template: "launch-announcement-email-series" } },
    { title: "Champion network", see: { template: "champion-network-playbook" } },
    { title: "Training", see: { phase: "prepare", step: "train-each-audience" } },
    { title: "Cutover playbook", see: { template: "sharepoint-cutover-playbook" } },
    { title: "Hypercare", see: { template: "hypercare-support-plan" } },
    { title: "Sustainment", see: { phase: "sustain" } },
  ],
};
