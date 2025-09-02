"use client";

import dynamic from "next/dynamic";
import React from "react";
import "swagger-ui-react/swagger-ui.css";

// 使用 dynamic 載入 Swagger UI，並關閉 SSR
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerPage() {
    // 假設 swagger.json 放在 public 目錄下
    const specUrl = "/swagger.json";
    return <SwaggerUI url={specUrl} />;
}
