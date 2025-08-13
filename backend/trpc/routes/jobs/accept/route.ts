import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({
    jobId: z.string(),
    laundryMasterId: z.string(),
    laundryMasterName: z.string(),
  }))
  .mutation(({ input }) => {
    console.log('Accepting job:', input);
    
    // Mock response - in real app this would update database
    return {
      success: true,
      jobId: input.jobId,
      laundryMasterId: input.laundryMasterId,
      acceptedAt: new Date(),
    };
  });