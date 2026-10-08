"use client";

import { useEffect, useState } from "react";
import { PiSpinnerGapBold } from "react-icons/pi";

export function SwaggerViewer() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.js";
    script.async = true;

    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle loaded via CDN
      if (typeof window !== "undefined" && window.SwaggerUIBundle) {
        // @ts-expect-error SwaggerUIBundle loaded via CDN
        window.ui = window.SwaggerUIBundle({
          url: `/api/openapi?t=${Date.now()}`,
          dom_id: "#swagger-ui",
          deepLinking: true,
          // @ts-expect-error SwaggerUIBundle loaded via CDN
          presets: [window.SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
        });
        setLoading(false);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div className="bg-white rounded-[10px] border-2 border-[#010736] shadow-[6px_6px_0_0_#00031A] overflow-hidden p-4 md:p-6 text-gray-900 min-h-[500px] relative">
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <PiSpinnerGapBold className="text-3xl animate-spin text-[#22396F]" />
          <span className="text-sm font-semibold text-[#010736]">
            Menyiapkan Swagger UI...
          </span>
        </div>
      )}
      <div id="swagger-ui" />
    </div>
  );
}
