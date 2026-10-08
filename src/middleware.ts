import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/firebase/constants";

const protectedRoutes = ["/dashboard", "/expenses", "/settings"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If trying to access protected route without session cookie -> redirect to login
  if (isProtected && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already has session cookie and tries to access login or register -> redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If root path "/": redirect to dashboard if cookie exists, otherwise login
  if (pathname === "/") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/expenses/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
