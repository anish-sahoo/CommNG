"use client";

import { redirect } from "next/navigation";

export default function LegacyNewBroadcastPage() {
  redirect("/broadcasts/new");
}
