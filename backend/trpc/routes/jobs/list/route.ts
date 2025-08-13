import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .query(() => {
    // Mock jobs data - in real app this would come from database
    const mockJobs = [
      {
        id: '1',
        customerId: '1',
        customerName: 'John Doe',
        pickupAddress: '123 Main St, City',
        dropoffAddress: '456 Oak Ave, City',
        pickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        isRush: false,
        price: 25,
        tip: 5,
        specialNotes: 'Please be gentle with delicate items',
        status: 'pending' as const,
        createdAt: new Date(),
        pickupLocation: { latitude: 40.7128, longitude: -74.0060 },
        dropoffLocation: { latitude: 40.7589, longitude: -73.9851 },
        timeline: [
          { step: 'created', timestamp: new Date(), completed: true },
          { step: 'accepted', timestamp: null, completed: false },
          { step: 'picked_up', timestamp: null, completed: false },
          { step: 'washing', timestamp: null, completed: false },
          { step: 'dropped_off', timestamp: null, completed: false },
          { step: 'completed', timestamp: null, completed: false },
        ],
      },
      {
        id: '2',
        customerId: '2',
        customerName: 'Jane Smith',
        pickupAddress: '789 Pine St, City',
        dropoffAddress: '321 Elm St, City',
        pickupTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        isRush: true,
        price: 35,
        tip: 10,
        specialNotes: 'Rush order - need ASAP',
        status: 'pending' as const,
        createdAt: new Date(),
        pickupLocation: { latitude: 40.7505, longitude: -73.9934 },
        dropoffLocation: { latitude: 40.7282, longitude: -73.7949 },
        timeline: [
          { step: 'created', timestamp: new Date(), completed: true },
          { step: 'accepted', timestamp: null, completed: false },
          { step: 'picked_up', timestamp: null, completed: false },
          { step: 'washing', timestamp: null, completed: false },
          { step: 'dropped_off', timestamp: null, completed: false },
          { step: 'completed', timestamp: null, completed: false },
        ],
      },
    ];

    // Sort rush jobs to the top
    return mockJobs.sort((a, b) => {
      if (a.isRush && !b.isRush) return -1;
      if (!a.isRush && b.isRush) return 1;
      return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
    });
  });