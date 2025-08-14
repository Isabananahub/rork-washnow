import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createJobRoute from "./routes/jobs/create/route";
import listJobsRoute from "./routes/jobs/list/route";
import acceptJobRoute from "./routes/jobs/accept/route";
import updateJobStatusRoute from "./routes/jobs/update-status/route";
import testGoogleApiRoute from "./routes/google/test-api/route";
import googlePlacesRoutes from "./routes/google/places-proxy/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  jobs: createTRPCRouter({
    create: createJobRoute,
    list: listJobsRoute,
    accept: acceptJobRoute,
    updateStatus: updateJobStatusRoute,
  }),
  google: createTRPCRouter({
    testApi: testGoogleApiRoute.testGoogleApi,
    findLaundryBusinesses: testGoogleApiRoute.findLaundryBusinesses,
    placesProxy: googlePlacesRoutes.placesProxy,
    placeDetailsProxy: googlePlacesRoutes.placeDetailsProxy,
  }),
});

export type AppRouter = typeof appRouter;