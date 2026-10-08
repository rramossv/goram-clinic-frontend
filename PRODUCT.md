# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Medico** (consultorio individual o clinica): entra entre paciente y paciente a ver la agenda del dia, abrir la ficha del paciente, escribir la consulta (notas, diagnostico, receta) y facturar.
- **Asistente / recepcionista**: puede tener el panel abierto toda la jornada; agenda citas, registra pacientes, cobra y emite facturas.
- **Administrador de clinica**: gestiona personal, suscripcion y reportes.

Ambos perfiles son primarios: el panel debe servir para consultas rapidas y para trabajo continuo de varias horas.

## Product Purpose

GoRam Clinic es un SaaS multi-clinica para El Salvador: cada consultorio o clinica tiene su propio espacio para gestionar pacientes, agenda, consultas medicas y facturacion (interna o electronica DTE ante el Ministerio de Hacienda), pagando una suscripcion mensual. Exito = que el medico o la asistente quiera abrirlo cada dia y sienta que vale lo que paga.

## Positioning

Hecho para la practica medica salvadorena: facturacion electronica DTE a nombre de cada clinica, IVA 13% calculado sobre el subtotal, planes separados para consultorio individual (un solo medico) y para clinicas con varios doctores, con una interfaz que se simplifica sola en modo consultorio.

## Operating Context

- Se usa en consultorio y recepcion: laptop o computadora de escritorio, tablet y telefono. Debe ser totalmente adaptable a los tres.
- Flujo central: recepcion agenda -> medico atiende y registra la consulta -> se emite factura -> reportes se actualizan.
- Planes: Consultorio $30, Consultorio Pro $40 (DTE), Clinica $50 (hasta 5 medicos, DTE), Clinica Plus $80.
- Modo de interfaz por tenant: INDIVIDUAL (un medico, sin selector de doctor, "Mi asistente") o CLINICA.

## Capabilities and Constraints

- Stack existente: React + TypeScript + Vite + Tailwind 4 + shadcn/ui (Base UI), lucide-react, sonner, next-themes (modo claro/oscuro real).
- Modulos del panel: Panel (inicio), Pacientes (+ ficha 360), Agenda (calendario por doctor), Consultas, Facturacion (factura simple o DTE, notas de credito), Reportes, Personal / Mi asistente, Suscripcion, Mi perfil.
- La facturacion electronica DTE y el cobro con Wompi/Pagadito estan simulados hasta conectar proveedores reales.
- Todo el texto de cara al usuario esta en espanol (voseo salvadoreno en algunos textos).

## Brand Commitments

- Nombre: GoRam Clinic, producto de la marca GoRam.
- El panel debe verse limpio, ordenado, corporativo y formal, como una clinica seria. El usuario rechazo explicitamente el negro/blanco neutro por defecto ("colores negros horribles"). No esta atado a la landing publica actual, que se redisenara despues.

## Evidence on Hand

- No hay clientes reales, testimonios ni metricas de uso todavia. No inventar cifras, clientes ni logros (ya se retiraron de la landing cifras sin respaldo).

## Product Principles

1. La tarea manda: agenda, ficha y factura deben leerse de un vistazo entre paciente y paciente.
2. Seriedad clinica: la interfaz transmite confianza y orden, nunca juego ni exageracion.
3. Comodidad para jornadas largas: contraste correcto y calma visual para quien lo usa ocho horas.
4. Igual de util en telefono que en laptop.

## Accessibility & Inclusion

- Contraste suficiente para lectura prolongada en ambos temas (claro y oscuro); objetivos tactiles adecuados en tablet y telefono.
