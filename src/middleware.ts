import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // Redirect here if not logged in
  },
});

export const config = {
  // Protect these routes (everything except login and static files)
  matcher: ["/dashboard/:path*", "/"],
};