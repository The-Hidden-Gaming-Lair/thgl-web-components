import { createClient } from "@supabase/supabase-js";
console.log("Hello via Bun!");

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

const { data } = await supabase.storage.listBuckets();

if (!data) {
  throw new Error("No data found");
}

for (const bucket of data) {
  console.log(`Reading files from bucket ${bucket.id}...`);
  const files = await downloadFiles(bucket.id);
  console.log(files);
}
async function downloadFiles(bucketId: string, path?: string) {
  const { data } = await supabase.storage.from(bucketId).list(path, {
    limit: 100000,
  });

  if (!data) {
    throw new Error("No data found");
  }

  for (const file of data) {
    const subPath = path ? `${path}/${file.name}` : file.name;
    if (file.id === null) {
      console.log(`Checking ${subPath}...`);
      await downloadFiles(bucketId, subPath);
    } else {
      await downloadFile(bucketId, subPath);
    }
  }
}

async function downloadFile(bucketId: string, path: string) {
  const existingFile = Bun.file(`${bucketId}/${path}`);
  if (await existingFile.exists()) {
    console.log(`File ${path} already exists`);
    return;
  }
  const { data } = await supabase.storage.from(bucketId).download(path);
  if (!data) {
    throw new Error(`No data found for ${path}`);
  }
  await Bun.write(`${bucketId}/${path}`, data);
  console.log(`Downloaded ${path}`);
}
