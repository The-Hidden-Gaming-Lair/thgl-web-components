import semver from "semver";

const MINIMUM_VERSION = "0.0.0";

export function isValidVersion(version?: string | null) {
  return (
    version && semver.valid(version) && semver.gte(version, MINIMUM_VERSION)
  );
}
