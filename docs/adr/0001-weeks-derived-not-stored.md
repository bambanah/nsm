# A Week is derived from Plan Settings, never stored

Plan Settings are the only persisted planning state; every Week is computed on demand from them and its Monday date. We rejected storing concrete Weeks (hand-tweakable before Sync) and multi-week progression blocks because both add a week-level model plus rules for reconciling stored Weeks when Plan Settings change, for no current requirement. Revisit when per-Week edits, progression or Sync history are actually needed.

Superseded by 0003.
