import fs from "fs";
import path from "path";
import maps from "./maps.json";

function listFoldersRecursive(directory: string) {
  const folders: string[] = [];
  const files: string[] = [];
  function traverse(currentDir: string, level = 0) {
    const contents = fs.readdirSync(currentDir);
    for (const file of contents) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (level === 1) {
          folders.push(file);
        }
        traverse(filePath, level + 1);
      } else {
        files.push(file);
      }
    }
  }

  traverse(directory);

  return { folders, files };
}

// const { files } = listFoldersRecursive("./cdn/tiles");
// const existingFolders = [
//   ...new Set(files.map((file) => file.replace(file.split("ps")[1], ""))),
// ];

const rootDirectory = "/mnt/c/dev/Lost Ark/2024-02-27";
const { folders } = listFoldersRecursive(rootDirectory);
folders.forEach((folder) => {
  if (maps.includes(folder)) {
    // console.log(`Folder ${folder} already exists`);
  } else {
    console.log(`Folder ${folder} does not exist`);
  }
});
