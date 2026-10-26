import pg from 'pg'

const url = new URL(process.env.DATABASE_URL!)
const name = url.pathname.slice(1)
url.pathname = '/postgres'

const client = new pg.Client(url.href)
await client.connect()
await client.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
await client.query(`CREATE DATABASE "${name}"`)
await client.end()
