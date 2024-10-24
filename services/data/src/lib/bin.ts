import { $ } from "bun";

const CWEBP_PATH = import.meta.path.replace(
  String.raw`data\src\lib\bin.ts`,
  String.raw`bin\libwebp\cwebp.exe`,
);
const VIPS_PATH = import.meta.path.replace(
  String.raw`data\src\lib\bin.ts`,
  String.raw`bin\vips\vips.exe`,
);

export async function cwebp(
  input: string,
  output: string,
  props: { resize?: boolean } = {},
) {
  if (props.resize) {
    return await $`${CWEBP_PATH} -resize 64 64 ${input} -m 6 -o ${output} -quiet`;
  } else {
    return await $`${CWEBP_PATH} ${input} -m 6 -o ${output} -quiet`;
  }
}

export async function vipsDzsave(
  imagePath: string,
  outDir: string,
  tileSize: number,
) {
  return await $`${VIPS_PATH} dzsave ${imagePath} ${outDir} --tile-size ${tileSize} --background 0 --overlap 0 --layout google --suffix .jpg[Q=100]`;
}
