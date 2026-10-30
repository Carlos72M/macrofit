import type { Food, Serving } from '../lib/types'

// Base local de alimentos comunes en México.
// Valores aproximados por 100 g, basados en tablas de referencia (USDA FoodData
// Central / Sistema Mexicano de Alimentos Equivalentes) y etiquetas de producto.
// Formato: [nombre, marca, categoría, kcal, proteína, carbohidratos, grasa, fibra, porciones]
type Row = [string, string, string, number, number, number, number, number, string]

const rows: Row[] = [
  // Proteínas animales
  ['Pechuga de pollo cocida', '', 'Proteínas', 165, 31, 0, 3.6, 0, 'filete mediano:150|taza picada:140'],
  ['Pechuga de pollo cruda', '', 'Proteínas', 120, 22.5, 0, 2.6, 0, 'filete mediano:180'],
  ['Muslo de pollo sin piel cocido', '', 'Proteínas', 209, 26, 0, 10.9, 0, 'pieza:95'],
  ['Huevo entero', '', 'Proteínas', 143, 12.6, 0.7, 9.5, 0, 'pieza:50|2 piezas:100'],
  ['Clara de huevo', '', 'Proteínas', 52, 10.9, 0.7, 0.2, 0, 'clara:33|taza:243'],
  ['Bistec de res cocido', '', 'Proteínas', 217, 30, 0, 10, 0, 'bistec:120'],
  ['Carne molida de res 90/10 cocida', '', 'Proteínas', 217, 26, 0, 11.8, 0, 'taza:110'],
  ['Arrachera cocida', '', 'Proteínas', 245, 27, 0, 15, 0, 'porción:150'],
  ['Lomo de cerdo cocido', '', 'Proteínas', 206, 29, 0, 9.5, 0, 'chuleta:120'],
  ['Carnitas', '', 'Proteínas', 330, 25, 0, 25, 0, 'taco (relleno):45|porción:120'],
  ['Atún en agua (drenado)', '', 'Proteínas', 116, 25.5, 0, 0.8, 0, 'lata drenada:100'],
  ['Atún en agua', 'Dolores', 'Proteínas', 104, 24, 0, 1, 0, 'lata drenada:100'],
  ['Salmón cocido', '', 'Proteínas', 206, 22, 0, 12, 0, 'filete:150'],
  ['Tilapia cocida', '', 'Proteínas', 128, 26, 0, 2.7, 0, 'filete:120'],
  ['Camarón cocido', '', 'Proteínas', 99, 24, 0.2, 0.3, 0, 'taza:145|pieza grande:10'],
  ['Jamón de pavo', 'FUD', 'Proteínas', 105, 15, 3, 3.5, 0, 'rebanada:20'],
  ['Jamón de pierna', 'San Rafael', 'Proteínas', 110, 17, 2, 3.5, 0, 'rebanada:21'],
  ['Salchicha de pavo', 'FUD', 'Proteínas', 190, 11, 5, 14, 0, 'pieza:30'],
  ['Chorizo de cerdo', '', 'Proteínas', 455, 24, 2, 38, 0, 'cucharada:15|porción:50'],
  ['Pechuga de pollo', 'Bachoco', 'Proteínas', 120, 23, 0, 2.5, 0, 'filete:150'],

  // Lácteos
  ['Leche entera', 'Lala', 'Lácteos', 61, 3.1, 4.7, 3.3, 0, 'vaso (250 ml):250|taza:240'],
  ['Leche deslactosada light', 'Lala', 'Lácteos', 40, 3.3, 4.8, 1, 0, 'vaso (250 ml):250|taza:240'],
  ['Leche descremada', 'Alpura', 'Lácteos', 35, 3.4, 5, 0.2, 0, 'vaso (250 ml):250'],
  ['Leche de almendra sin azúcar', 'Silk', 'Lácteos', 15, 0.5, 0.3, 1.2, 0.3, 'vaso (240 ml):240'],
  ['Yogur griego natural', 'Oikos', 'Lácteos', 59, 10, 3.6, 0.4, 0, 'vaso:150|taza:245'],
  ['Yogur bebible fresa', 'Yoplait', 'Lácteos', 80, 2.8, 13.5, 1.6, 0, 'botella:242'],
  ['Queso panela', '', 'Lácteos', 240, 18, 3, 17, 0, 'rebanada:30|porción:60'],
  ['Queso Oaxaca', '', 'Lácteos', 300, 22, 2, 22, 0, 'porción:30|taza deshebrada:110'],
  ['Queso cottage', '', 'Lácteos', 98, 11, 3.4, 4.3, 0, 'taza:225|cucharada:15'],
  ['Queso crema', 'Philadelphia', 'Lácteos', 342, 6, 4, 34, 0, 'cucharada:15'],
  ['Requesón', '', 'Lácteos', 174, 11, 3, 13, 0, 'cucharada:20'],
  ['Crema ácida', 'Lala', 'Lácteos', 200, 2.5, 4, 19, 0, 'cucharada:15'],

  // Cereales y tubérculos
  ['Tortilla de maíz', '', 'Cereales', 218, 5.7, 44.6, 2.9, 6.3, 'pieza:30|3 piezas:90'],
  ['Tortilla de harina', 'Tía Rosa', 'Cereales', 310, 8, 51, 8, 2, 'pieza:38'],
  ['Arroz blanco cocido', '', 'Cereales', 130, 2.7, 28.2, 0.3, 0.4, 'taza:158|½ taza:79'],
  ['Arroz rojo (a la mexicana)', '', 'Cereales', 155, 3, 27, 4, 1, 'taza:170|½ taza:85'],
  ['Arroz integral cocido', '', 'Cereales', 123, 2.7, 25.6, 1, 1.6, 'taza:195'],
  ['Avena en hojuelas', 'Quaker', 'Cereales', 379, 13, 67.7, 6.5, 10, '½ taza:40|cucharada:8'],
  ['Pan blanco', 'Bimbo', 'Cereales', 265, 8.5, 49, 3.5, 2.5, 'rebanada:27|2 rebanadas:54'],
  ['Pan integral', 'Bimbo', 'Cereales', 250, 11, 43, 3.5, 6.5, 'rebanada:30'],
  ['Bolillo', '', 'Cereales', 277, 9, 56, 1.8, 2.4, 'pieza:70'],
  ['Pasta cocida', '', 'Cereales', 158, 5.8, 30.9, 0.9, 1.8, 'taza:140'],
  ['Papa cocida', '', 'Cereales', 87, 1.9, 20, 0.1, 1.8, 'pieza mediana:170|taza:156'],
  ['Camote cocido', '', 'Cereales', 90, 2, 20.7, 0.2, 3.3, 'pieza mediana:150'],
  ['Cereal Zucaritas', "Kellogg's", 'Cereales', 375, 4.5, 87, 0.5, 2, 'taza:40'],
  ['Cereal Special K', "Kellogg's", 'Cereales', 379, 12, 79, 1.5, 4, 'taza:31'],
  ['Galletas Marías', 'Gamesa', 'Cereales', 430, 7, 74, 12, 2, '5 galletas:30|galleta:6'],
  ['Tostada horneada', 'Sanissimo', 'Cereales', 380, 9, 78, 3, 7, 'pieza:11'],
  ['Totopos de maíz', '', 'Cereales', 497, 7, 63, 24, 4.4, 'puño (10 pzas):28'],
  ['Harina de maíz', 'Maseca', 'Cereales', 360, 8, 76, 3.5, 7, 'taza:115'],
  ['Granola', '', 'Cereales', 471, 10, 64, 20, 5, '¼ taza:30'],

  // Leguminosas
  ['Frijoles negros cocidos', '', 'Leguminosas', 132, 8.9, 23.7, 0.5, 8.7, 'taza:172|½ taza:86'],
  ['Frijoles refritos', 'La Costeña', 'Leguminosas', 110, 6, 16, 2.5, 5, '½ taza:120|cucharada:20'],
  ['Frijoles bayos refritos', 'Isadora', 'Leguminosas', 115, 6, 15, 3, 5, '½ taza:120'],
  ['Lentejas cocidas', '', 'Leguminosas', 116, 9, 20, 0.4, 7.9, 'taza:198'],
  ['Garbanzos cocidos', '', 'Leguminosas', 164, 8.9, 27.4, 2.6, 7.6, 'taza:164'],

  // Frutas
  ['Plátano', '', 'Frutas', 89, 1.1, 22.8, 0.3, 2.6, 'pieza mediana:118'],
  ['Manzana', '', 'Frutas', 52, 0.3, 13.8, 0.2, 2.4, 'pieza mediana:182'],
  ['Papaya', '', 'Frutas', 43, 0.5, 10.8, 0.3, 1.7, 'taza picada:145'],
  ['Mango', '', 'Frutas', 60, 0.8, 15, 0.4, 1.6, 'pieza:200|taza picada:165'],
  ['Naranja', '', 'Frutas', 47, 0.9, 11.8, 0.1, 2.4, 'pieza:131'],
  ['Jugo de naranja natural', '', 'Frutas', 45, 0.7, 10.4, 0.2, 0.2, 'vaso (250 ml):250'],
  ['Fresas', '', 'Frutas', 32, 0.7, 7.7, 0.3, 2, 'taza:150'],
  ['Sandía', '', 'Frutas', 30, 0.6, 7.6, 0.2, 0.4, 'taza picada:152'],
  ['Piña', '', 'Frutas', 50, 0.5, 13.1, 0.1, 1.4, 'taza picada:165'],
  ['Guayaba', '', 'Frutas', 68, 2.6, 14.3, 1, 5.4, 'pieza:55'],
  ['Aguacate', '', 'Frutas', 160, 2, 8.5, 14.7, 6.7, '½ pieza:68|rebanada:15'],
  ['Arándanos', '', 'Frutas', 57, 0.7, 14.5, 0.3, 2.4, 'taza:148'],

  // Verduras
  ['Jitomate', '', 'Verduras', 18, 0.9, 3.9, 0.2, 1.2, 'pieza:123'],
  ['Nopal cocido', '', 'Verduras', 15, 1.4, 3.3, 0.1, 2, 'taza:150|pieza:60'],
  ['Brócoli cocido', '', 'Verduras', 35, 2.4, 7.2, 0.4, 3.3, 'taza:156'],
  ['Espinaca cruda', '', 'Verduras', 23, 2.9, 3.6, 0.4, 2.2, 'taza:30'],
  ['Lechuga', '', 'Verduras', 15, 1.4, 2.9, 0.2, 1.3, 'taza:47'],
  ['Calabacita cocida', '', 'Verduras', 20, 1.1, 4.3, 0.4, 1.4, 'taza:180|pieza:120'],
  ['Zanahoria', '', 'Verduras', 41, 0.9, 9.6, 0.2, 2.8, 'pieza:61|taza rallada:110'],
  ['Pepino', '', 'Verduras', 15, 0.7, 3.6, 0.1, 0.5, 'pieza:300|taza:104'],
  ['Cebolla', '', 'Verduras', 40, 1.1, 9.3, 0.1, 1.7, '¼ pieza:28'],
  ['Chile jalapeño', '', 'Verduras', 29, 0.9, 6.5, 0.4, 2.8, 'pieza:14'],
  ['Elote cocido', '', 'Verduras', 96, 3.4, 21, 1.5, 2.4, 'pieza:100|taza desgranado:145'],

  // Grasas, semillas y aderezos
  ['Aceite de oliva', '', 'Grasas', 884, 0, 0, 100, 0, 'cucharada:13.5|cucharadita:4.5'],
  ['Aceite vegetal', 'Nutrioli', 'Grasas', 884, 0, 0, 100, 0, 'cucharada:14|cucharadita:4.5'],
  ['Mantequilla de maní', '', 'Grasas', 588, 25, 20, 50, 6, 'cucharada:16'],
  ['Almendras', '', 'Grasas', 579, 21, 21.6, 49.9, 12.5, 'puño (23 pzas):28'],
  ['Nueces', '', 'Grasas', 654, 15.2, 13.7, 65.2, 6.7, 'puño:28'],
  ['Cacahuates japoneses', 'Nishikawa', 'Grasas', 500, 17, 50, 26, 3, 'bolsa chica:40'],
  ['Semillas de chía', '', 'Grasas', 486, 16.5, 42.1, 30.7, 34.4, 'cucharada:12'],
  ['Mayonesa', 'McCormick', 'Grasas', 680, 1, 2, 75, 0, 'cucharada:14'],
  ['Guacamole', '', 'Grasas', 155, 2, 8.6, 14, 6, 'cucharada:20|½ taza:120'],
  ['Salsa verde', 'Herdez', 'Grasas', 25, 1, 5, 0.3, 1, 'cucharada:16'],
  ['Salsa casera roja', 'Herdez', 'Grasas', 30, 1, 6, 0.5, 1, 'cucharada:16'],

  // Platillos mexicanos
  ['Taco al pastor', '', 'Platillos', 210, 11, 18, 10, 2, 'taco:90|orden (4):360'],
  ['Taco de bistec', '', 'Platillos', 190, 13, 17, 7.5, 2, 'taco:85'],
  ['Quesadilla de queso (tortilla maíz)', '', 'Platillos', 270, 12, 25, 13, 3, 'pieza:100'],
  ['Enchiladas verdes de pollo', '', 'Platillos', 165, 10, 15, 7.5, 2, 'orden (3):330|pieza:110'],
  ['Chilaquiles rojos', '', 'Platillos', 185, 5, 21, 9, 2.5, 'plato:300'],
  ['Pozole rojo de cerdo', '', 'Platillos', 85, 6, 8, 3, 1.5, 'plato:450'],
  ['Tamal verde de pollo', '', 'Platillos', 230, 7, 25, 11, 2, 'pieza:150'],
  ['Torta de jamón', '', 'Platillos', 255, 11, 30, 10, 2, 'pieza:250'],
  ['Sope con frijol y queso', '', 'Platillos', 220, 7, 27, 9.5, 3, 'pieza:110'],
  ['Huevos a la mexicana', '', 'Platillos', 150, 9.5, 3.5, 11, 1, 'porción:150'],
  ['Mole poblano con pollo', '', 'Platillos', 185, 14, 8, 11, 2, 'porción:250'],
  ['Caldo de pollo', '', 'Platillos', 45, 5, 3, 1.5, 0.5, 'plato:400'],

  // Bebidas y snacks de marca
  ['Refresco de cola', 'Coca-Cola', 'Bebidas', 42, 0, 10.6, 0, 0, 'lata (355 ml):355|botella (600 ml):600'],
  ['Refresco de cola sin azúcar', 'Coca-Cola', 'Bebidas', 0.3, 0, 0, 0, 0, 'lata (355 ml):355'],
  ['Jugo de naranja', 'Jumex', 'Bebidas', 46, 0.5, 11, 0, 0, 'vaso (250 ml):250'],
  ['Agua de horchata', '', 'Bebidas', 60, 0.5, 13, 0.8, 0, 'vaso (300 ml):300'],
  ['Café americano', '', 'Bebidas', 1, 0.1, 0, 0, 0, 'taza:240'],
  ['Cerveza clara', '', 'Bebidas', 43, 0.5, 3.6, 0, 0, 'lata (355 ml):355'],
  ['Proteína whey (polvo)', '', 'Snacks', 400, 78, 10, 6, 0, 'scoop:30'],
  ['Papas fritas sal', 'Sabritas', 'Snacks', 536, 7, 53, 34, 4.5, 'bolsa chica:45'],
  ['Barra de granola', 'Nature Valley', 'Snacks', 470, 8, 67, 19, 4, 'paquete (2 barras):42'],
  ['Gansito', 'Marinela', 'Snacks', 400, 4, 60, 16, 1, 'pieza:50'],
  ['Chocolate amargo 70%', '', 'Snacks', 598, 7.8, 45.9, 42.6, 10.9, 'cuadro:10'],
  ['Palomitas naturales', '', 'Snacks', 387, 13, 78, 4.5, 15, 'taza:8'],
]

const parseServings = (s: string): Serving[] =>
  s.split('|').filter(Boolean).map((p) => {
    const i = p.lastIndexOf(':')
    return { label: p.slice(0, i), grams: Number(p.slice(i + 1)) }
  })

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')

export const LOCAL_FOODS: Food[] = rows.map(([name, brand, category, kcal, protein, carbs, fat, fiber, sv]) => ({
  id: `mf-${slug(name + '-' + brand)}`,
  name,
  brand: brand || undefined,
  category,
  source: 'macrofit',
  per100: { kcal, protein, carbs, fat, fiber },
  servings: parseServings(sv),
}))

export const CATEGORIES = Array.from(new Set(rows.map((r) => r[2])))
