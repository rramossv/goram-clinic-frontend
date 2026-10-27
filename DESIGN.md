---
name: GoRam Clinic
description: Panel de gestion clinica con la logica de un archivo de expedientes en orden.
colors:
  hoja: "oklch(0.991 0.003 240)"
  tinta: "oklch(0.255 0.038 256)"
  azul-carton: "oklch(0.355 0.075 255)"
  gaveta: "oklch(0.285 0.058 257)"
  gaveta-hover: "oklch(0.34 0.062 257)"
  carton: "oklch(0.948 0.012 245)"
  carton-texto: "oklch(0.42 0.04 255)"
  texto-secundario: "oklch(0.49 0.032 255)"
  filete: "oklch(0.895 0.012 245)"
  exito: "oklch(0.47 0.095 168)"
  aviso: "oklch(0.53 0.14 52)"
  info: "oklch(0.45 0.11 255)"
  peligro: "oklch(0.53 0.185 27)"
  etiqueta-0: "#B42318"
  etiqueta-1: "#D9661F"
  etiqueta-2: "#B8901A"
  etiqueta-3: "#3B8C3E"
  etiqueta-4: "#1F7A8C"
  etiqueta-5: "#2457A6"
  etiqueta-6: "#5B3FA0"
  etiqueta-7: "#8E3B78"
  etiqueta-8: "#7A5638"
  etiqueta-9: "#4A5563"
typography:
  headline:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  etiqueta: "3px"
  chip: "4px"
  control: "6px"
  hoja: "8px"
spacing:
  fila: "12px"
  bloque: "20px"
  seccion: "32px"
components:
  button-primary:
    backgroundColor: "{colors.azul-carton}"
    textColor: "{colors.hoja}"
    rounded: "{rounded.control}"
    height: "36px"
    padding: "0 14px"
  button-outline:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    height: "36px"
  input:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.control}"
    height: "36px"
  nav-item:
    textColor: "{colors.hoja}"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.gaveta}"
  table-head:
    backgroundColor: "{colors.carton}"
    textColor: "{colors.carton-texto}"
    typography: "{typography.label}"
---

# Design System: GoRam Clinic

## Overview

**Creative North Star: "El Archivo de Expedientes"**

El panel se comporta como el archivo de una clinica seria: una gaveta azul marino guarda los modulos, cada modulo se saca como un folder cuya pestana se une con la hoja de trabajo, y cada paciente lleva su codigo de color como en los archivos fisicos por digito terminal. La interfaz es formal, ordenada y tranquila; el color existe para identificar, no para decorar.

La densidad es de herramienta de trabajo: listas regladas con filetes finos, cifras tabulares alineadas, encabezados cortos. La segunda capa neutra (carton prensado gris azulado) separa estructura de contenido sin recurrir a sombras. Rechazo confirmado por el usuario: el negro y blanco neutro por defecto ("colores negros horribles").

**Key Characteristics:**
- Gaveta azul marino con pestana activa del color de la hoja.
- Hojas blancas frias, nunca blanco puro ni crema.
- Codigo de color de dos bandas por paciente, siempre con sus digitos.
- Estados con icono + texto en espanol, tono solo como refuerzo.
- Una sola familia tipografica (Public Sans) con escala corta.

## Colors

Restringido: neutros frios azulados, un azul de carton para acciones, y una paleta de etiquetas de archivo reservada para identificacion.

### Primary
- **Azul Carton Prensado** (azul-carton): botones principales, enlaces de accion, seleccion, barra del mes actual en graficas. En modo oscuro sube a un azul claro legible.

### Neutral
- **Hoja Fria** (hoja): fondo de todo el contenido y color de la pestana activa.
- **Tinta Marina** (tinta): titulos, nombres de pacientes, cifras.
- **Texto Secundario** (texto-secundario): descripciones, metadatos (contraste >= 4.5:1 sobre la hoja).
- **Carton** (carton / carton-texto): encabezados de tabla, columna de horas y fila de doctores de la agenda, bloques de resumen secundarios.
- **Gaveta** (gaveta / gaveta-hover): menu lateral y panel ilustrado del inicio de sesion.
- **Filete** (filete): bordes y separadores de 1px.

### Semanticos
- **Exito** (exito), **Aviso** (aviso), **Info** (info), **Peligro** (peligro): cada uno con su version suave de fondo; se usan en chips de estado, bloques de cita y alertas clinicas (alergias).

### Etiquetas de archivo
- **etiqueta-0 a etiqueta-9**: diez colores por digito. Solo para el codigo de paciente y la marca.

### Named Rules
**The Identification Rule.** Las etiquetas de archivo solo identifican pacientes; nunca se usan como decoracion, fondo de seccion ni color de estado.

**The No Pure Black-and-White Rule.** Ningun fondo es #FFFFFF ni #000000: la hoja es blanco frio y el texto es tinta marina.

## Typography

**Body Font:** Public Sans Variable (con ui-sans-serif, system-ui)

**Character:** Una sans institucional de linea publica, sobria y legible en jornadas largas; carga titulos, datos, etiquetas y botones sin necesidad de una segunda familia.

### Hierarchy
- **Headline** (600, 1.375rem, 1.25, -0.015em): titulo de cada modulo en su encabezado.
- **Title** (600, 0.9375rem): titulos de seccion y de tarjetas.
- **Body** (400, 0.875rem, 1.5): texto general, celdas de tabla, descripciones.
- **Label** (600, 11px, 0.06em, mayusculas): encabezados de tabla y grupos del menu. Nunca encima de un titulo como antetitulo.

### Named Rules
**The Tabular Rule.** Horas, montos y fechas usan cifras tabulares; los montos se alinean a la derecha como en un libro contable.

## Layout

Estructura de aplicacion: menu lateral de 16rem (colapsable a iconos en escritorio, cajon deslizable en telefono), barra superior de 56px con la fecha del dia y, en telefono, el nombre del modulo. El contenido vive en una columna centrada de hasta 1320px con 32px de margen en escritorio y 16px en telefono. Cada modulo abre con su encabezado (titulo, descripcion y acciones a la derecha; en telefono las acciones bajan debajo del titulo) separado por un filete. Las secciones se separan 32px; las filas de listas usan 12px de relleno vertical. La hoja del dia usa dos columnas (lista + resumen de 20-22rem) que se apilan bajo 1024px. Las tablas se desplazan horizontalmente dentro de su contenedor con un degradado que avisa que hay mas columnas.

## Elevation & Depth

Plano por defecto, con capas tonales: la profundidad se lee por el paso gaveta -> hoja -> carton. Las sombras son minimas y siempre con desplazamiento y desenfoque.

### Shadow Vocabulary
- **Boton principal** (`box-shadow: 0 1px 2px rgb(16 38 59 / 0.14)`): solo bajo acciones primarias.
- **Pestana activa** (`box-shadow: -2px 1px 3px -1px rgb(0 0 0 / 0.25)`): separa el folder sacado de la gaveta.
- **Bloque de cita** (`box-shadow: 0 1px 2px rgb(16 38 59 / 0.08)`; al pasar el cursor `0 4px 12px -4px rgb(16 38 59 / 0.3)`).

### Named Rules
**The Flat Sheet Rule.** Las hojas no flotan: contenedores con filete de 1px y sin sombra; la sombra solo responde a estado o separa la pestana activa.

## Shapes

Esquinas sobrias y pequenas: etiquetas de 3px, chips de 4px, controles de 6px, hojas y tarjetas de 8px. La pestana activa del menu redondea solo su lado izquierdo y llega recta hasta el borde para fundirse con la hoja. Bordes siempre de 1px; nunca franjas laterales de color en tarjetas o alertas.

## Components

### Buttons
- **Shape:** controles de 6px, altura 36px (40px en el inicio de sesion).
- **Primary:** azul carton con texto hoja y sombra minima; hover al 90%.
- **Outline:** fondo hoja, filete, hover con el acento suave.
- **Ghost:** solo para acciones secundarias en filas de tabla.

### Chips (EstadoChip)
- **Style:** 24px de alto, esquina de 4px, fondo suave del tono, anillo interior de 1px, icono de 14px + texto en espanol ("Programada", "Emitida", "Pendiente de pago").
- **State:** la cancelada se tacha; el tono nunca es la unica senal.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** hoja; bloques de resumen secundarios en carton al 60%.
- **Border:** filete de 1px; sin sombra.
- **Internal Padding:** 20px.

### Inputs / Fields
- **Style:** 36px, fondo hoja, filete del input, esquina de 6px.
- **Focus:** borde y anillo del color de enfoque (azul medio).

### Navigation
- Menu en la gaveta azul marino, agrupado en "Atencion" y "Administracion" con etiquetas de grupo pequenas. Elementos de 36px; inactivos en texto claro al 80%, hover con gaveta-hover; activo como pestana color hoja, texto marino en negrita. En telefono el menu es un cajon y se cierra al elegir.

### Codigo de paciente (componente de firma)
Dos bandas de color con los digitos en blanco, derivadas del id del paciente (18px en listas y agenda, 32px en la ficha). Aparece junto al nombre en la hoja del dia, agenda, pacientes, consultas, facturas y la ficha.

### Bloque de cita (agenda)
Fondo suave del tono del estado, anillo interior, codigo de paciente + nombre en tinta, y la hora con el motivo debajo. La linea de "ahora" es naranja aviso; los horarios pasados se rayan con el color del filete.

## Do's and Don'ts

### Do:
- **Do** mostrar el codigo de paciente junto a cada nombre de paciente en listas y agenda.
- **Do** usar EstadoChip para todo estado; nunca el valor crudo en mayusculas.
- **Do** abrir cada modulo con el encabezado de pagina (titulo, descripcion, acciones) y su filete.
- **Do** escribir con tildes, ene y signos de apertura en todo texto visible.
- **Do** alinear montos a la derecha con cifras tabulares.

### Don't:
- **Don't** usar negro puro, blanco puro ni grises neutros sin tinte azul.
- **Don't** usar las etiquetas de archivo como color decorativo o de estado.
- **Don't** construir paneles con tarjetas de metricas gigantes (numero enorme + icono + etiqueta); los resumenes van como filas de libro contable.
- **Don't** poner antetitulos encima de los titulos.
- **Don't** agregar franjas laterales de color a tarjetas o alertas.

## Superficie pública: página de inicio (/)

**Modo:** persuadir. **Idea central:** la portada es el asistente; el médico pregunta y una hoja de expediente con pestaña le muestra la pantalla real que corresponde a cada respuesta. Contrato completo en `index.html` (seed 03e27317).

- **Estilos aislados:** todo vive bajo `.gl` en `src/pages/LandingPage.css` con sus propias variables `--gl-*` (nunca en `:root`, porque Vite junta el CSS y pisaría los tokens del panel). Los enlaces se resetean con `:where(.gl) a` para no ganarle a las clases de botón.
- **Portada (gaveta):** fondo azul marino `#17273f` con filetes horizontales cada 4.5rem (los cajones del archivo) y un degradado radial suave. Titular blanco Public Sans 680, `clamp(2.5rem, 4.4vw, 4rem)`, tracking -0.035em. A la derecha, bajada y tres renglones de libro contable (dato / valor).
- **Escritorio:** asistente de 24rem a la izquierda, montado 2.5rem sobre la hoja; la hoja lleva pestaña color hoja con las dos bandas de la marca (azul `#2457a6`, verde `#3b8c3e`). Al cambiar de pantalla la hoja nueva sube con `clip-path` (620 ms, ease-out exponencial): el único movimiento de autor, además de la salida inicial de la gaveta.
- **Sugerencias del asistente:** pestañas de folder (esquina superior 8px, inferior 3px, filete interior), nunca chips redondos.
- **Un día con GoRam Clinic:** regla horaria como la columna de horas de la agenda (hora en 2.6rem tabular, periodo debajo), filetes entre filas, capturas reales a la derecha. Teléfonos dibujados en CSS (marco degradado, isla, notificaciones con desenfoque solo como material de iOS).
- **Libro contable:** "Hecho para El Salvador" y "Seguridad" son renglones término/detalle sobre cartón `#e9eef3`, sin tarjetas.
- **Tarifario:** columnas separadas por filete dentro de un solo contenedor; el plan recomendado se distingue por la etiqueta y el botón relleno, nunca por franjas de color.
- **Verdad:** capturas reales tomadas con datos de demostración (rotuladas). Los precios salen en vivo de `GET /api/v1/planes`. No hay prueba gratis, cifras de clientes ni comparaciones con la competencia.
- **Asistente flotante:** aparece cuando el de la portada sale de vista; comparte la misma conversación (`useAsistente`, guardada en `sessionStorage`).
