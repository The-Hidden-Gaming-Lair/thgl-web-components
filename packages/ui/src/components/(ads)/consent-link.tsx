import { useEffect } from "react";
import { Button } from "../(controls)";

export function ConsentLink() {
  useEffect(() => {
    // @ts-ignore
    if (window["__cmp"]) {
      // @ts-ignore
      window["__cmp"]("addConsentLink");
    }
  }, []);

  return <Button id="ncmp-consent-link" variant="link" />;
}

export default ConsentLink;
