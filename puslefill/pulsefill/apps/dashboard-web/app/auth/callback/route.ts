import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL("/overview", request.url);
  return NextResponse.redirect(url);
}
