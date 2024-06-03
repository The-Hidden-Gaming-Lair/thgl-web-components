import semver from "semver";

const MINIMUM_VERSION = "1.3.1";

export function isValidVersion(version?: string | null) {
  return (
    version && semver.valid(version) && semver.gte(version, MINIMUM_VERSION)
  );
}
