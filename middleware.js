// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const ADMIN_EMAIL = "ghulammujtaba.dro@gmail.com";
// const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function middleware(req) {
//   const { pathname } = req.nextUrl;
//   if (!pathname.startsWith("/admin-dashboard")) return NextResponse.next();

//   const token = req.cookies.get("token")?.value;
//   if (!token) return NextResponse.redirect(new URL("/signin", req.url));

//   try {
//     const { payload } = await jwtVerify(token, SECRET);
//     if (payload?.role !== "admin") {
//       return NextResponse.redirect(new URL("/not-authorized", req.url));
//     }
//     return NextResponse.next();
//   } catch {
//     return NextResponse.redirect(new URL("/signin", req.url));
//   }
// }

// export const config = {
//   matcher: ["/admin-dashboard/:path*"],
// };
