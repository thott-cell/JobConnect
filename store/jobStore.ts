import { create } from "zustand";

type Job = {
  id: number;
  company: string;
  role: string;
  location: string;
  description?: string;
};

type JobState = {
  jobs: Job[];
  addJob: (job: Omit<Job, "id">) => void;
};

export const useJobStore = create<JobState>((set) => ({
  jobs: [
    {
      id: 1,
      company: "TechCorp Nigeria",
      role: "Frontend Developer",
      location: "Lagos, Nigeria",
      description: "React developer needed",
    },
  ],

  addJob: (job) =>
    set((state) => ({
      jobs: [...state.jobs, { ...job, id: state.jobs.length + 1 }],
    })),
}));