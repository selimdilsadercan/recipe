-- Ingredients Tablosu (Hibrit Şema)
-- Kaynak: USDA FoodData Central (SR Legacy + Foundation)
-- Yapı: Temel bilgiler ve Makrolar KOLON, Mikro besinler JSONB

CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdc_id INTEGER UNIQUE NOT NULL,           -- USDA ID
    name_en TEXT NOT NULL,                    -- İngilizce isim (Orijinal)
    name_tr TEXT,                             -- Türkçe isim (Çeviri)
    category TEXT,                            -- Kategori (dairy, meat, etc.)
    
    -- Temel Değerler (100g başına)
    calories DECIMAL(10, 2),                  -- kcal
    protein DECIMAL(10, 2),                   -- g
    fat DECIMAL(10, 2),                       -- g
    carbs DECIMAL(10, 2),                     -- g
    fiber DECIMAL(10, 2),                     -- g
    sugar DECIMAL(10, 2),                     -- g
    cholesterol DECIMAL(10, 2),               -- mg
    
    -- Detaylı Besin Değerleri (Vitaminler, Mineraller)
    -- { "vitamin_c": 10, "iron": 2.5, "calcium": 120 ... }
    micros JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    search_vector TSVECTOR,                   -- Full text search için
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_ingredients_fdc_id ON public.ingredients(fdc_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_search ON public.ingredients USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_ingredients_micros ON public.ingredients USING GIN(micros);

-- Arama fonksiyonu (Türkçe/İngilizce)
CREATE OR REPLACE FUNCTION search_ingredients(search_query TEXT, limit_count INTEGER DEFAULT 20)
RETURNS SETOF public.ingredients AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.ingredients
    WHERE 
        name_tr ILIKE '%' || search_query || '%' OR
        name_en ILIKE '%' || search_query || '%'
    ORDER BY 
        CASE 
            WHEN name_tr ILIKE search_query THEN 1
            WHEN name_tr ILIKE search_query || '%' THEN 2
            WHEN name_tr ILIKE '%' || search_query || '%' THEN 3
            ELSE 4
        END,
        name_tr
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
