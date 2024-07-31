import { PrivateNode } from "./settings";

export async function putSharedNodes(filename: string, nodes: PrivateNode[]) {
  const response = await fetch(
    `https://www.th.gl/api/shared-nodes?filename=${filename}`,
    {
      method: "PUT",
      body: JSON.stringify(nodes),
    },
  );
  if (!response.ok) {
    throw new Error("Can not upload blob");
  }
  return response.json() as Promise<{
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    contentDisposition: string;
  }>;
}

export async function getSharedNodesByCode(code: string) {
  const response = await fetch(
    `https://www.th.gl/api/shared-nodes?code=${code}`,
  );
  if (!response.ok) {
    throw new Error("Can not find shared node");
  }
  return response.json() as Promise<{
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    contentDisposition: string;
  }>;
}
