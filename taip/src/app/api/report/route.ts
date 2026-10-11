import { getRegion } from "@config/regions";
import { toCsv } from "@/domain/aggregation";
import { AccessError } from "@/domain/access";
import { currentUser, service } from "@/lib/session";

/** Kriisiaruanne CSV-na (ainult agregaadid). PDF: lehe prindivaade. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  try {
    const ala = new URL(req.url).searchParams.get("ala") || undefined;
    const data = service().needsMap(user, ala);
    const csv = toCsv(data.cells, (id) => getRegion(id)?.name ?? id);
    return new Response("﻿" + csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="taip-kriisiaruanne-${data.scope}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    if (e instanceof AccessError) return new Response("Forbidden", { status: 403 });
    throw e;
  }
}
