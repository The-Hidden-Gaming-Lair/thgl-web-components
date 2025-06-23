import { useT } from "../(providers)";
import Markdown from "markdown-to-jsx";

export function Details({
  type,
  id,
  groupId,
  props,
  icon,
}: {
  type: string;
  id: string;
  groupId: string;
  icon?: string;
  props: Record<string, any>;
}) {
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {icon ? (
          <img alt="" src={`/icons/${icon}`} className="rounded w-24 h-24" />
        ) : null}
        <div className="space-y-2">
          <p className="text-primary text-sm">{t(type) || type}</p>
          <h2 className="text-2xl">{t(id) || id}</h2>
          <p>{t(groupId)}</p>
        </div>
      </div>
      <p>
        <Markdown>{t(id, true)}</Markdown>
      </p>
      <div>
        {Object.entries(props).map(([key, prop]) => (
          <div key={key} className="grid grid-cols-2 ">
            <p className="text-muted-foreground">{t(key)}</p>
            <p className="">{prop}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
