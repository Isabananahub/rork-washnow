import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import JobTimelineScreen, { JobData } from '@/components/JobTimelineScreen';

export default function JobTimelinePage() {
  const params = useLocalSearchParams();
  
  let job: JobData | null = null;
  
  if (params.jobData && typeof params.jobData === 'string') {
    try {
      job = JSON.parse(params.jobData) as JobData;
    } catch (error) {
      console.error('Error parsing job data:', error);
    }
  }
  
  if (!job) {
    router.replace('/');
    return null;
  }
  
  return (
    <JobTimelineScreen 
      job={job} 
      onBack={() => router.replace('/')} 
    />
  );
}