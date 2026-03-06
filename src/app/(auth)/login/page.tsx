import { LoginForm } from "@/features/auth/components/login-form";
import { requireUnauth } from "@/lib/auth-utils";
import React from "react";
// import Layout from "../layout";

const page = async () => {
  await requireUnauth();
  return <LoginForm />;
};

export default page;