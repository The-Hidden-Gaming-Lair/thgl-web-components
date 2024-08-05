import { NextResponse } from "next/server";

export async function GET() {
  const response = await fetch(
    `https://d4armory.io/api/events.json?v=${Date.now()}`,
    {},
  );
  if (!response.ok) {
    return NextResponse.json(null, { status: 500 });
  }
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
