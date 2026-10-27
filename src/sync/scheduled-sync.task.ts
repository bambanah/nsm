import { defineTask } from 'nitro/task'
import { runDueScheduledSyncs } from './sync.server'

export default defineTask({
  meta: { name: 'scheduled-sync', description: 'Run each due Scheduled Sync' },
  async run() {
    await runDueScheduledSyncs(new Date())
    return {}
  },
})
