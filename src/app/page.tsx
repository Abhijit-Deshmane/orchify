import { caller, getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Image from "next/image";
import { Suspense } from "react";
import { Client } from "./client";
import { LogoutButton } from "./logout";

export default async function Home() {
   const queryClient = getQueryClient();

   void queryClient.prefetchQuery(trpc.getUser.queryOptions());
  
  return (
   
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
     <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p> loading the data </p>}>
        <Client/>
        <LogoutButton/>
      </Suspense>
     </HydrationBoundary>
    </div>
  );
}
