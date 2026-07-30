import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_SECONDS,
  createAdminToken,
  isAdminConfigured,
  verifyAdminPassword
} from "../../../../lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "");
  const loginUrl = new URL("/admin/login", request.url);

  if (!isAdminConfigured()) {
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl, 303);
  }

  if (!verifyAdminPassword(password)) {
    loginUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: createAdminToken(),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS
  });
  return response;
}
