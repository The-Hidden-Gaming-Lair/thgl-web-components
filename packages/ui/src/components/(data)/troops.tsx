import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useT } from "../(providers)";

export type Troops = {
  id: string;
  supplyCost?: number;
  productionTime?: number;
  costs?: {
    RTSScrapResourceType?: number;
    RTSFluxResourceType?: number;
  };
  icon?: string;
  attackWhileMoving?: boolean;
  canAttackGround?: boolean;
}[];

export function Troops({ troops }: { troops: Troops }): JSX.Element {
  const t = useT();
  return (
    <Table>
      <TableCaption>Troops</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Icon</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Supply Cost</TableHead>
          <TableHead>Production Time</TableHead>
          <TableHead>Costs</TableHead>
          <TableHead>Attack While Moving</TableHead>
          <TableHead>Can Attack Ground</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {troops.map((troop) => (
          <TableRow key={troop.id}>
            <TableCell>
              {troop.icon ? <img alt="" src={`/icons/${troop.icon}`} /> : null}
            </TableCell>
            <TableCell>{t(troop.id)}</TableCell>
            <TableCell>{troop.supplyCost}</TableCell>
            <TableCell>{troop.productionTime}</TableCell>
            <TableCell>
              {troop.costs?.RTSFluxResourceType} /{" "}
              {troop.costs?.RTSScrapResourceType}
            </TableCell>
            <TableCell>{troop.attackWhileMoving ? "Yes" : "No"}</TableCell>
            <TableCell>{troop.canAttackGround ? "Yes" : "No"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
