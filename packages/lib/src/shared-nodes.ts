import { MyFilter } from "./settings";

export async function putSharedFilters(filename: string, myFilter: MyFilter) {
  const response = await fetch(
    `https://www.th.gl/api/shared-filters?filename=${filename}`,
    {
      method: "PUT",
      body: JSON.stringify(myFilter),
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

export async function getSharedFilterByCode(code: string) {
  const response = await fetch(
    `https://www.th.gl/api/shared-filters?code=${code}`,
  );
  if (!response.ok) {
    throw new Error("Can not find shared filter");
  }
  return response.json() as Promise<{
    url: string;
    downloadUrl: string;
    pathname: string;
    contentType?: string;
    contentDisposition: string;
  }>;
}
