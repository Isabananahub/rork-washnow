import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({
    jobId: z.string(),
    step: z.enum(['accepted', 'picked_up', 'washing', 'dropped_off', 'completed']),
    photoUrl: z.string().optional(),
  }))
  .mutation(({ input }) => {
    console.log('Updating job status:', input);
    
    // Mock response - in real app this would update database
    return {
      success: true,
      jobId: input.jobId,
      step: input.step,
      timestamp: new Date(),
      photoUrl: input.photoUrl,
    };
  });