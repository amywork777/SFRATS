-- Delete duplicate events
DELETE FROM events a USING events b
WHERE a.id > b.id 
AND a.title = b.title 
AND a.event_date = b.event_date;

-- Update categories for existing events
UPDATE events 
SET categories = ARRAY['Music', 'Community']
WHERE title LIKE '%Concert%';

UPDATE events 
SET categories = ARRAY['Food', 'Community']
WHERE title LIKE '%Food%';

UPDATE events 
SET categories = ARRAY['Art', 'Community']
WHERE title LIKE '%Art%';

UPDATE events 
SET categories = ARRAY['Sports', 'Community']
WHERE title LIKE '%Yoga%'; 