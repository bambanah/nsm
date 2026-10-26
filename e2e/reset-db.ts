import pg from 'pg'

const url = new URL(process.env.DATABASE_URL!)
const dbName = url.pathname.slice(1)
const adminUrl = new URL(url)
adminUrl.pathname = '/postgres'

const client = new pg.Client(adminUrl.href)
await client.connect()
await client.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)
await client.query(`CREATE DATABASE "${dbName}"`)
await client.end()
