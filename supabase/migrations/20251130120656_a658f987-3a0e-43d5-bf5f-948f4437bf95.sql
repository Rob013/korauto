-- One-time cleanup: Remove all sold/archived cars from encar_cars_cache
DELETE FROM encar_cars_cache
WHERE advertisement_status IN ('SOLD', 'ARCHIVED', 'COMPLETED', 'INACTIVE', 'CLOSED', 'FINISHED');