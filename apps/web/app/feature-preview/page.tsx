import {notFound} from "next/navigation";
import {FeaturePreview} from "./preview";
export const metadata={title:"Try learning ideas | Saegim",robots:{index:false,follow:false}};
export default function PreviewPage(){if(process.env.SAEGIM_FEATURE_PREVIEW!=="true")notFound();return <FeaturePreview/>;}
