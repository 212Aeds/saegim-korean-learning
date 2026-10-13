export const freePublishing = process.env.NEXT_PUBLIC_FREE_PUBLISHING === "true";
export const paidFeaturesEnabled = !freePublishing && process.env.NEXT_PUBLIC_PAID_FEATURES_ENABLED === "true";
export const publicApiUrl = freePublishing ? undefined : process.env.NEXT_PUBLIC_API_URL;
export const deviceProfileKey = "saegim-device-profile";
export const deviceProgressKey = "saegim-device-progress";

export const tutorEnabled = !freePublishing && (process.env.NEXT_PUBLIC_LOCAL_TUTOR_ENABLED === "true" || paidFeaturesEnabled);
