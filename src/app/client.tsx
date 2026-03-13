"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Client = () => {
    const trpc =  useTRPC();
    // const {data : users } = useSuspenseQuery(trpc.getUser.queryOptions());

    return (
       <div>
            {/* {JSON.stringify(users) || "got nothing"} */}
            hi there
        </div>
    )
} 