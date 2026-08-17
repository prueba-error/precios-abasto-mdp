-- Ensure service_role has explicit table and sequence privileges required by scraper upserts.
GRANT SELECT, INSERT, UPDATE ON TABLE public.products TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.price_records TO service_role;
GRANT INSERT ON TABLE public.scraping_logs TO service_role;

-- SERIAL/BIGSERIAL inserts require sequence usage permissions.
GRANT USAGE, SELECT ON SEQUENCE public.products_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.price_records_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.scraping_logs_id_seq TO service_role;
