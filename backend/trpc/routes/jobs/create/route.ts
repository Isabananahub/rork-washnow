import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const jobSchema = z.object({
  customerId: z.string(),
  customerName: z.string(),
  pickupAddress: z.string(),
  dropoffAddress: z.string(),
  pickupTime: z.string(),
  isRush: z.boolean(),
  price: z.number(),
  tip: z.number().optional(),
  specialNotes: z.string().optional(),
  pickupLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  dropoffLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export default publicProcedure
  .input(jobSchema)
  .mutation(({ input }) => {
    const job = {
      id: Date.now().toString(),
      ...input,
      status: 'pending' as const,
      createdAt: new Date(),
      timeline: [
        {
          step: 'created',
          timestamp: new Date(),
          completed: true,
        },
        {
          step: 'accepted',
          timestamp: null,
          completed: false,
        },
        {
          step: 'picked_up',
          timestamp: null,
          completed: false,
        },
        {
          step: 'washing',
          timestamp: null,
          completed: false,
        },
        {
          step: 'dropped_off',
          timestamp: null,
          completed: false,
        },
        {
          step: 'completed',
          timestamp: null,
          completed: false,
        },
      ],
    };
    
    console.log('Created job:', job);
    return job;
  });