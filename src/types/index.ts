import { UserRole, ElectionStatus } from '../utils/constants';

export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  roles: UserRole[];
  createdAt: Date;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  studentId: string;
  position: string;
  bio?: string;
  imageUrl?: string;
  proposals?: string;
}

export interface CandidateList {
  id: string;
  name: string;
  description: string;
  color: string;
  candidates: Candidate[];
  votes?: number;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  career?: string;
  status: ElectionStatus;
  startDate: Date;
  endDate: Date;
  candidateLists: CandidateList[];
  totalVotes?: number;
  eligibleVoters?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  electionId: string;
  candidateListId: string;
  timestamp: Date;
  confirmed: boolean;
  receiptHash?: string;
}

export interface VoteReceipt {
  id: string;
  voteId: string;
  hash: string;
  timestamp: Date;
  electionTitle: string;
}

export interface ElectionResult {
  electionId: string;
  candidateListResults: Array<{
    listId: string;
    listName: string;
    votes: number;
    percentage: number;
    candidates: Array<{
      candidateId: string;
      name: string;
      votes: number;
    }>;
  }>;
  totalVotes: number;
  participationRate: number;
}