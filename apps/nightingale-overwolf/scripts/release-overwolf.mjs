import dotenv from "dotenv";

import "reflect-metadata";

import {
  OwCliContainer,
  PackOpkCommand,
  ReleaseOpkCommand,
  SignOpkCommand,
  UploadOpkCommand,
} from "@overwolf/ow-cli/bin/index.js";

dotenv.config({ path: ".env.local" });

const PREVIEW_ACCESS_CHANNEL_ID = process.env.PREVIEW_ACCESS_CHANNEL_ID;

console.log(
  `About to release to channel ${PREVIEW_ACCESS_CHANNEL_ID} with ${process.env.OW_CLI_EMAIL}`,
);
const FILE_NAME = "app";

OwCliContainer.init();
console.log("Initialized OW CLI container");

const packOpkCmd = OwCliContainer.resolve(PackOpkCommand);
const signOpkCmd = OwCliContainer.resolve(SignOpkCommand);
const uploadOpkCmd = OwCliContainer.resolve(UploadOpkCommand);
const releaseOpkCmd = OwCliContainer.resolve(ReleaseOpkCommand);

await packOpkCmd.handler({
  folderPath: "dist",
  outputFile: `${FILE_NAME}.opk`,
});
console.log("Packed OPK");
await signOpkCmd.handler({
  filePath: `${FILE_NAME}.opk`,
  outputFile: `${FILE_NAME}.signed.opk`,
});
console.log("Signed OPK");
if (PREVIEW_ACCESS_CHANNEL_ID) {
  const versionId = await uploadOpkCmd.handler({
    filePath: `${FILE_NAME}.signed.opk`,
    channelId: Number(PREVIEW_ACCESS_CHANNEL_ID),
    wait: true,
  });
  console.log("Uploaded OPK");
  await releaseOpkCmd.handler({
    versionId,
    percent: 100,
    channelId: Number(PREVIEW_ACCESS_CHANNEL_ID),
  });
  console.log("Released OPK");
} else {
  const versionId = await uploadOpkCmd.handler({
    filePath: `${FILE_NAME}.signed.opk`,
    wait: true,
  });
  console.log("Uploaded OPK");
  await releaseOpkCmd.handler({
    versionId,
    percent: 100,
  });
  console.log("Released OPK");
}
