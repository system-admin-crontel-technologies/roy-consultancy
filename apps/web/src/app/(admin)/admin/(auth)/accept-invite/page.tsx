import { Suspense } from "react";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Accept invitation" };

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
