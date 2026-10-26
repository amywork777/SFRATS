import { strict as assert } from 'node:assert'
import { nextOccurrence, projectOccurrence } from '../src/utils/recurrence'
import { visibleEvents, isActive } from '../src/utils/listingFilters'
const base: any = { id: 999, title: 'Test', category: 'Events', status: 'available', created_at: '2026-08-01T00:00Z', available_from: '2026-08-27T02:00Z', available_until: '2027-01-01T00:00Z', recurrence: { freq: 'weekly', byday: [3], time: '19:00' } }
const next = (item: any, now: string) => nextOccurrence(item, new Date(now))?.toISOString()
assert.equal(next(base, '2026-10-26T00:00Z'), '2026-10-29T02:00:00.000Z')
assert.equal(next(base, '2026-11-01T00:00Z'), '2026-11-05T03:00:00.000Z')
assert.equal(next(base, '2026-10-29T02:00Z'), '2026-10-29T02:00:00.000Z')
assert.equal(next({...base, recurrence:{freq:'weekly', byday:[2,4,6], time:'18:00'}}, '2026-10-28T02:00Z'), '2026-10-30T01:00:00.000Z')
assert.equal(next({...base, recurrence:{freq:'monthly', byday:[7], ordinal:1, time:'11:00'}}, '2026-11-02T00:00Z'), '2026-12-06T19:00:00.000Z')
assert.equal(next({...base, recurrence:{freq:'daily', time:'20:00'}}, '2026-10-26T00:00Z'), '2026-10-26T03:00:00.000Z')
assert.equal(next({...base, available_until:'2026-10-28T00:00Z'}, '2026-10-26T00:00Z'), undefined)
assert.equal(next({...base, recurrence:{freq:'weekly', byday:[9], time:'19:00'}}, '2026-10-26T00:00Z'), undefined)
assert.equal(next({...base, available_until:'2026-12-01T00:00Z', recurrence:{freq:'monthly', byday:[7], ordinal:5, time:'19:00'}}, '2026-11-02T00:00Z'), '2026-11-30T03:00:00.000Z')
assert.equal(projectOccurrence(base, new Date('2026-10-26T00:00Z'))?.available_until, null)
const oneoff = {...base, recurrence:null, available_until:null, available_from:'2026-10-25T10:00Z'}
assert.equal(isActive(oneoff, new Date('2026-10-25T22:00Z')), true)
assert.equal(isActive(oneoff, new Date('2026-10-25T22:00:01Z')), false)
assert.equal(visibleEvents([base,oneoff,{...base,id:123,title:'__SCRAPER_RUN__'}],new Date('2026-10-26T00:00Z')).length,1)
assert.equal(visibleEvents([{...base,available_from:null,recurrence:null}],new Date()).length,0)
const legacy = {...base,id:2525,title:'The Mint Karaoke Lounge (Free, Nightly)',posted_by:'birby',recurrence:null,available_from:'2026-10-28T03:00Z'}
assert.equal(projectOccurrence(legacy,new Date('2026-10-26T00:00Z'))?.available_from,'2026-10-26T03:00:00.000Z')
console.log('15 recurrence/expiry assertions passed, including DST, monthly, multi-day, cutoff, junk, and legacy seed')

// ---- Time TBA marker ----
import { isTimeTba, stripTimeTba, formatEventWhen, endOfPtDay, ptDay, nextPtDay } from '../src/utils/timeTba'
import { isActive } from '../src/utils/listingFilters'
{
  const eq = (a: unknown, b: unknown, m: string) => { if (a !== b) throw new Error(m + ': ' + String(a) + ' != ' + String(b)) }
  const d = 'Block party [Time TBA] bring snacks'
  eq(isTimeTba(d), true, 'marker detected')
  eq(isTimeTba('plain'), false, 'no marker')
  eq(stripTimeTba(d), 'Block party bring snacks', 'strip')
  const mid = '2026-11-07T08:00:00.000Z' // PT midnight (PST)
  eq(formatEventWhen(mid, d), 'Nov 7 · Time TBA', 'tba no clock')
  eq(formatEventWhen(mid, d, 'MMM d, yyyy · h:mm a'), 'Nov 7, 2026 · Time TBA', 'tba long')
  eq(formatEventWhen('2026-11-07T20:00:00.000Z', 'x'), 'Nov 7 · 12:00 PM', 'known time kept')
  eq(ptDay(mid), '2026-11-07', 'ptDay'); eq(nextPtDay(mid), '2026-11-08', 'next')
  eq(new Date(endOfPtDay(mid)).toISOString(), '2026-11-08T08:00:00.000Z', 'end of day PST')
  eq(new Date(endOfPtDay('2026-11-01T07:00:00.000Z')).toISOString(), '2026-11-02T08:00:00.000Z', 'DST fallback day')
  const item: any = { id: '1', title: 't', category: 'Events', status: 'available', description: d, available_from: mid, available_until: null, created_at: mid }
  eq(isActive(item, new Date('2026-11-07T23:00:00-08:00')), true, 'kept all PT day')
  eq(isActive(item, new Date('2026-11-08T00:01:00-08:00')), false, 'expires after day')
  eq(isActive({ ...item, description: 'x' }, new Date('2026-11-07T23:00:00-08:00')), false, 'known-time 12h rule unchanged')
  console.log('time TBA tests passed')
}
{
  const a = 'Fair [All Day] free'
  if (formatEventWhen('2026-11-07T08:00:00.000Z', a) !== 'Nov 7 · All day') throw new Error('all day label')
  if (stripTimeTba(a) !== 'Fair free') throw new Error('all day strip')
  console.log('all day tests passed')
}
