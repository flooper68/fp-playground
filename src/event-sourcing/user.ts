import { Result } from "../lib/implementations/result";
import { Opaque } from "../lib/opaque";

export type AuditUser = Opaque<
  {
    uuid: string;
    email: string;
  },
  "AuditUser"
>;

export function AuditUser(props: {
  uuid: string;
  email: string;
}): Result<never, AuditUser> {
  return Result.Ok({
    uuid: props.uuid,
    email: props.email,
  } as AuditUser);
}
