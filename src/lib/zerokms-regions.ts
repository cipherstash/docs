/**
 * The ZeroKMS regions a workspace can be deployed into. Single source of truth:
 * rendered by the `<ZeroKmsRegions />` MDX component on every page that lists
 * regions, so the list can't drift between the regions reference and the
 * data-residency page.
 *
 * `id` is the region component of a workspace CRN
 * (`crn:<id>:<workspace-id>`, e.g. `crn:ap-southeast-2.aws:ZVATKW3VHMFG27DY`).
 * The `.aws` suffix is part of the identifier: ZeroKMS is deployed only on AWS
 * today, and the suffix leaves room for other cloud providers later.
 */
export type ZeroKmsRegion = {
  area: string;
  location: string;
  id: string;
};

export const ZEROKMS_REGIONS: ZeroKmsRegion[] = [
  { area: "Asia Pacific", location: "Sydney", id: "ap-southeast-2.aws" },
  { area: "Europe", location: "Frankfurt", id: "eu-central-1.aws" },
  { area: "Europe", location: "Ireland", id: "eu-west-1.aws" },
  { area: "US East", location: "N. Virginia", id: "us-east-1.aws" },
  { area: "US East", location: "Ohio", id: "us-east-2.aws" },
  { area: "US West", location: "N. California", id: "us-west-1.aws" },
  { area: "US West", location: "Oregon", id: "us-west-2.aws" },
];
