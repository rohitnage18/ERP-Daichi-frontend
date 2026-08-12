export { default } from "next-auth/middleware";

export const config = {
  // /view/invoice/* is public (emailed share links)
  matcher: ["/dashboard/:path*", "/print/:path*"],
};
