## Historias de Usuario (US)

### [HU-01] Protección de Vistas y Permisos por Rol
* **Como:** Usuario del sistema (Administrador / Empleado)
* **Quiero:** Visualizar únicamente las opciones autorizadas para mi rol
* **Para:** Prevenir operaciones no permitidas y mantener la integridad de los datos.

> **Criterios de Aceptación:**
> - **Dado que** selecciono el rol "Empleado", el sistema oculta funciones de eliminación, estadísticas e historial.
> - **Dado que** selecciono "Administrador", la interfaz habilita el acceso total.

---

### [HU-02] Gestión del Catálogo de Productos (CRUD)
* **Como:** Administrador del sistema
* **Quiero:** Registrar, editar y eliminar productos
* **Para:** Mantener actualizado el inventario.

---

### [HU-03] Control Automático de Stock
* **Como:** Empleado o Administrador
* **Quiero:** Registrar entradas y salidas de mercancía
* **Para:** Actualizar las existencias en tiempo real con validación de límite.

---

### [HU-04] Panel de Estadísticas
* **Como:** Administrador del sistema
* **Quiero:** Consultar métricas de productos con stock bajo y más demandados
* **Para:** Tomar decisiones oportunas de reabastecimiento.