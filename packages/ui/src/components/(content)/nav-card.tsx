import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { NavIcon } from "./nav-icon";
import { IconName } from "@repo/lib";
import Image from "next/image";

export type NavCardProps = {
  title: string;
  description: string;
  href?: string;
  linkText?: string;
  bgImage?: string;
  iconName: IconName;
};

export function NavCard({
  title,
  description,
  href = "/",
  linkText = "Learn More",
  bgImage,
  iconName,
}: NavCardProps) {
  return (
    <Link href={href} className="block min-h-[200px]">
      <Card className="h-full w-full hover:border-primary transition-colors relative text-left overflow-hidden flex flex-col bg-gradient-to-b from-muted/50 to-black">
        <CardHeader className="relative z-10 grow p-0">
          <CardTitle className="bg-black/75 border-black px-2 py-2 flex justify-center items-center uppercase truncate text-md">
            <NavIcon
              iconName={iconName}
              className="inline-block h-4 w-4 mr-2"
            />
            <span>{title}</span>
          </CardTitle>
          {bgImage ? (
            <CardDescription className="grow  h-[220px] w-[330px]">
              <Image
                src={bgImage}
                alt=""
                width={330}
                height={220}
                className="object-contain h-full w-full"
              />
            </CardDescription>
          ) : (
            <CardDescription className="p-2 text-secondary-foreground text-md ">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardFooter className="px-2 py-1 text-sm relative z-10 text-muted-foreground">
          {linkText} →
        </CardFooter>
      </Card>
    </Link>
  );
}
