import {notFound} from "next/navigation";
import {AnalyticsPreview} from "./preview";
export const metadata={title:"Analytics lab | Saegim",robots:{index:false,follow:false}};
export default function Page(){if(process.env.SAEGIM_ANALYTICS_PREVIEW!=="true")notFound();return <AnalyticsPreview/>;}
