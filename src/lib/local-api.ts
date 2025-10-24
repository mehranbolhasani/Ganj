import { Poet } from './types';
import poetsData from '../data/poets.json';

export const localApi = {
  async getPoets(): Promise<Poet[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return poetsData as Poet[];
  }
};
