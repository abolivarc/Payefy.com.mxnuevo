-- Carga inicial de 50 giros (MCCs) desde costos-oficial.csv del repo viejo.
-- Quita la unicidad sobre mcc_code: el catálogo tiene MCCs duplicados con
-- nombre/descripción distintos (ej: 5499, 5462, 5719). Se diferencia por nombre.

alter table public.business_sectors
  drop constraint if exists business_sectors_mcc_code_key;

create unique index if not exists business_sectors_name_uniq
  on public.business_sectors (name);

insert into public.business_sectors
  (mcc_code, name, description, base_rate_credit, base_rate_debit, base_rate_amex, base_rate_international) values
  ('5499', 'Abarrotes, misceláneas, tiendas naturistas, carnicerías, pescaderías, verdulerías', 'Comercios de alimentos y productos básicos', 0.0085, 0.0090, 0.0320, 0.0330),
  ('7399', 'Agregadores', 'Servicios de agregación comercial', 0.0236, 0.0165, 0.0320, 0.0330),
  ('5462', 'Alimentos', 'Comercio de alimentos preparados', 0.0213, 0.0175, 0.0320, 0.0330),
  ('7512', 'Arrendadoras de autos', 'Servicios de arrendamiento de vehículos', 0.0223, 0.0175, 0.0320, 0.0330),
  ('7519', 'Autofinanciamientos', 'Servicios de financiamiento automotriz', 0.0220, 0.0180, 0.0320, 0.0330),
  ('7995', 'Casinos y casas de juego', 'Establecimientos de juegos de azar', 0.0225, 0.0180, 0.0320, 0.0330),
  ('7941', 'Clubes deportivos profesionales', 'Clubes y organizaciones deportivas', 0.0182, 0.0175, 0.0320, 0.0330),
  ('5511', 'Distribuidores de automóviles', 'Venta de vehículos nuevos y usados', 0.0215, 0.0165, 0.0320, 0.0330),
  ('8011', 'Doctores, otras especialidades', 'Servicios médicos especializados', 0.0060, 0.0060, 0.0320, 0.0330),
  ('4812', 'Equipos de telecomunicaciones', 'Venta de equipos de telecomunicaciones', 0.0215, 0.0165, 0.0320, 0.0330),
  ('8211', 'Escuelas', 'Instituciones educativas', 0.0060, 0.0060, 0.0320, 0.0330),
  ('5912', 'Farmacias', 'Venta de medicamentos y productos farmacéuticos', 0.0188, 0.0155, 0.0320, 0.0330),
  ('5251', 'Ferreterías', 'Venta de herramientas y materiales de construcción', 0.0055, 0.0055, 0.0320, 0.0330),
  ('7011', 'Hoteles, moteles, centros turísticos', 'Servicios de hospedaje', 0.0218, 0.0160, 0.0320, 0.0330),
  ('8734', 'Laboratorios de pruebas (no médicos)', 'Servicios de análisis y pruebas', 0.0218, 0.0165, 0.0320, 0.0330),
  ('5969', 'Mercadeo Directo', 'Venta directa y por catálogo', 0.0215, 0.0175, 0.0320, 0.0330),
  ('5094', 'Metales, piedras preciosas, relojería, joyería', 'Comercio de artículos de lujo', 0.0215, 0.0165, 0.0320, 0.0330),
  ('5719', 'Mobiliario especial para el hogar', 'Venta de muebles y decoración', 0.0230, 0.0190, 0.0320, 0.0330),
  ('8398', 'Organizaciones de servicio social', 'Instituciones de servicio social', 0.0060, 0.0060, 0.0320, 0.0330),
  ('8021', 'Ortodoncistas y Doctores', 'Servicios de ortodoncia y odontología', 0.0060, 0.0060, 0.0320, 0.0330),
  ('5462', 'Panaderías', 'Venta de productos de panadería', 0.0223, 0.0185, 0.0320, 0.0330),
  ('6513', 'Renta de departamentos, edificio de departamentos', 'Servicios de arrendamiento inmobiliario', 0.0225, 0.0185, 0.0320, 0.0330),
  ('5812', 'Restaurantes', 'Servicios de alimentación', 0.0236, 0.0175, 0.0320, 0.0330),
  ('7230', 'Salones de belleza', 'Servicios de estética y belleza', 0.0060, 0.0060, 0.0320, 0.0330),
  ('7374', 'Servicios de procesamiento de datos', 'Servicios de tecnología de información', 0.0215, 0.0175, 0.0320, 0.0330),
  ('4814', 'Servicios de telecomunicaciones', 'Servicios de comunicación telefónica', 0.0205, 0.0175, 0.0320, 0.0330),
  ('9399', 'Servicios gubernamentales', 'Servicios del sector público', 0.0165, 0.0125, 0.0320, 0.0330),
  ('8999', 'Servicios profesionales no clasificados', 'Servicios profesionales diversos', 0.0215, 0.0175, 0.0320, 0.0330),
  ('7311', 'Servicios publicitarios', 'Servicios de publicidad y marketing', 0.0213, 0.0175, 0.0320, 0.0330),
  ('742',  'Servicios veterinarios', 'Servicios de atención veterinaria', 0.0060, 0.0060, 0.0320, 0.0330),
  ('8220', 'Universidades', 'Instituciones de educación superior', 0.0175, 0.0125, 0.0320, 0.0330),
  ('5651', 'Tiendas de Ropa Familiar', 'Venta de ropa y accesorios', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5722', 'Tiendas de Electrodomésticos', 'Venta de aparatos eléctricos para el hogar', 0.0218, 0.0170, 0.0320, 0.0330),
  ('5310', 'Tiendas de Descuento', 'Comercio minorista de descuento', 0.0218, 0.0175, 0.0320, 0.0330),
  ('5499', 'Tiendas de Alimentos Variados', 'Venta de alimentos diversos', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5944', 'Joyerías, Relojes, Relojes de Pared y Tiendas de Platería', 'Venta de joyería y relojes', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5941', 'Tiendas de Artículos Deportivos', 'Venta de equipos deportivos', 0.0218, 0.0170, 0.0320, 0.0330),
  ('7032', 'Campamentos Deportivos/Recreativos', 'Servicios recreativos y deportivos', 0.0182, 0.0175, 0.0320, 0.0330),
  ('7297', 'Masajes y Servicios Relacionados', 'Servicios de masajes y terapias', 0.0218, 0.0180, 0.0320, 0.0330),
  ('4789', 'Servicios de Transporte No Clasificados en Otra Parte', 'Servicios de transporte diversos', 0.0216, 0.0140, 0.0320, 0.0330),
  ('5712', 'Tiendas de Muebles, Artículos para el Hogar y Equipamiento (Excepto Electrodomésticos)', 'Venta de muebles y equipamiento', 0.0218, 0.0170, 0.0320, 0.0330),
  ('5719', 'Tiendas Especializadas en Artículos para el Hogar', 'Venta de artículos especializados para el hogar', 0.0218, 0.0170, 0.0320, 0.0330),
  ('5111', 'Papelerías, Suministros de Oficina, Papel de Impresión y Escritura', 'Venta de artículos de papelería', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5995', 'Tiendas de Mascotas, Alimentos y Suministros para Mascotas', 'Venta de productos para mascotas', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5541', 'Estaciones de Servicio', 'Venta de combustibles y servicios automotrices', 0.0165, 0.0110, 0.0320, 0.0330),
  ('5815', 'Bienes Digitales: Medios, Libros, Películas, Música', 'Venta de contenido digital', 0.0218, 0.0180, 0.0320, 0.0330),
  ('5732', 'Tiendas de Electrónica', 'Venta de productos electrónicos', 0.0218, 0.0170, 0.0320, 0.0330),
  ('5816', 'Bienes Digitales: Videojuegos', 'Venta de videojuegos digitales', 0.0218, 0.0180, 0.0320, 0.0330),
  ('7531', 'Talleres de Reparación de Carrocería de Automóviles', 'Servicios de reparación automotriz', 0.0218, 0.0170, 0.0320, 0.0330),
  ('4215', 'Servicios de Mensajería y Paquetería', 'Servicios de envío y mensajería', 0.0218, 0.0180, 0.0320, 0.0330);
