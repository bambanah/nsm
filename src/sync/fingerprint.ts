import { createHash } from 'node:crypto'
import type { Workout } from './workouts'

export const fingerprint = (workouts: Workout[]) =>
  createHash('sha256').update(JSON.stringify(workouts)).digest('hex')
