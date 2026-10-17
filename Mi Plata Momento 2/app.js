// ==========================================
// POO - CLASES DE ENTIDADES BANCARIAS
// ==========================================

class Cliente {
    #id;
    #password;

    constructor(id, nombre, celular, usuario, password) {
        this.#id = id;
        this.nombre = nombre;
        this.celular = celular;
        this.usuario = usuario;
        this.#password = password;
        this.intentosFallidos = 0;
        this.bloqueado = false;
        this.cuentas = [];
    }

    getId() { return this.#id; }
    getPassword() { return this.#password; }
    setPassword(newPass) { this.#password = newPass; }

    agregarCuenta(cuenta) {
        this.cuentas.push(cuenta);
    }
}

class Cuenta {
    #saldo;

    constructor(numeroCuenta, tipo, saldoInicial = 0) {
        this.numeroCuenta = numeroCuenta;
        this.tipo = tipo;
        this.#saldo = saldoInicial;
        this.movimientos = [];
    }

    getSaldo() { return this.#saldo; }
    setSaldo(nuevoSaldo) { this.#saldo = nuevoSaldo; }

    registrarMovimiento(tipoMov, valor) {
        const fecha = new Date().toLocaleString();
        this.movimientos.unshift({ fecha, tipo: tipoMov, valor });
    }

    consignar(monto) {
        if (monto <= 0) throw new Error("El monto debe ser mayor a cero.");
        this.#saldo += monto;
        this.registrarMovimiento("Consignación", monto);
        return this.#saldo;
    }

    retirar(monto) {
        if (monto <= 0) throw new Error("El monto debe ser mayor a cero.");
        if (monto > this.#saldo) throw new Error("Saldo insuficiente.");
        this.#saldo -= monto;
        this.registrarMovimiento("Retiro", monto);
        return this.#saldo;
    }
}

class CuentaAhorros extends Cuenta {
    constructor(numeroCuenta, saldoInicial = 50000) {
        super(numeroCuenta, "Cuenta de Ahorros", saldoInicial);
    }

    retirar(monto) {
        if (monto <= 0) throw new Error("El monto debe ser mayor a cero.");
        if (monto > this.getSaldo()) throw new Error("Saldo insuficiente.");
        
        const interes = monto * 0.015;
        const totalDescontar = monto + interes;

        if (totalDescontar > this.getSaldo()) {
            throw new Error(`Saldo insuficiente para cubrir el retiro más el 1.5% de interés ($${interes.toFixed(2)}).`);
        }

        this.setSaldo(this.getSaldo() - totalDescontar);
        this.registrarMovimiento("Retiro (Interés 1.5%)", totalDescontar);
        return this.getSaldo();
    }
}

class CuentaCorriente extends Cuenta {
    constructor(numeroCuenta, saldoInicial = 100000) {
        super(numeroCuenta, "Cuenta Corriente", saldoInicial);
    }

    retirar(monto) {
        if (monto <= 0) throw new Error("El monto debe ser mayor a cero.");
        const limiteSobregiro = this.getSaldo() * 1.20;
        if (monto > limiteSobregiro) {
            throw new Error("Supera el saldo disponible más el sobregiro del 20%.");
        }
        this.setSaldo(this.getSaldo() - monto);
        this.registrarMovimiento("Retiro (Sobregiro)", monto);
        return this.getSaldo();
    }
}

class TarjetaCredito extends Cuenta {
    constructor(numeroCuenta, cupoTotal = 2000000) {
        super(numeroCuenta, "Tarjeta de Crédito", 0);
        this.cupoTotal = cupoTotal;
        this.deudaActual = 0;
    }

    getSaldo() { return this.cupoTotal - this.deudaActual; }
}

// ==========================================
// CONTROLADOR BANCARIO Y NAVEGACIÓN
// ==========================================

class BancoApp {
    constructor() {
        this.clientes = [];
        this.clienteActual = null;
        this.inicializarDatos();
    }

    inicializarDatos() {
        const guardados = localStorage.getItem("mi_plata_db");
        if (guardados) {
            const raw = JSON.parse(guardados);
            this.clientes = raw.map(c => {
                const cli = new Cliente(c.id, c.nombre, c.celular, c.usuario, c.password);
                cli.intentosFallidos = c.intentosFallidos || 0;
                cli.bloqueado = c.bloqueado || false;
                cli.cuentas = c.cuentas.map(a => {
                    let acc;
                    if (a.tipo === "Cuenta de Ahorros") acc = new CuentaAhorros(a.numeroCuenta, a._Cuenta__saldo || a.saldo);
                    else if (a.tipo === "Cuenta Corriente") acc = new CuentaCorriente(a.numeroCuenta, a._Cuenta__saldo || a.saldo);
                    else acc = new TarjetaCredito(a.numeroCuenta, a.cupoTotal || 2000000);
                    acc.movimientos = a.movimientos || [];
                    return acc;
                });
                return cli;
            });
        } else {
            const admin = new Cliente("10203040", "Carlos Pérez", "3001234567", "carlos", "1234");
            admin.agregarCuenta(new CuentaAhorros("AH-1001", 350000));
            admin.agregarCuenta(new CuentaCorriente("CC-2001", 800000));
            this.clientes.push(admin);
            this.guardarStorage();
        }
    }

    guardarStorage() {
        localStorage.setItem("mi_plata_db", JSON.stringify(this.clientes));
    }

    ocultarVistas() {
        document.querySelectorAll(".view-section").forEach(sec => sec.classList.add("d-none"));
    }

    mostrarLanding() {
        this.ocultarVistas();
        document.getElementById("viewLanding").classList.remove("d-none");
    }

    mostrarLogin() {
        this.ocultarVistas();
        document.getElementById("viewLogin").classList.remove("d-none");
        document.getElementById("loginAlert").innerHTML = "";
    }

    mostrarRegistro() {
        this.ocultarVistas();
        document.getElementById("viewRegistro").classList.remove("d-none");
        document.getElementById("registroAlert").innerHTML = "";
    }

    mostrarAbrirCuenta(tipoSelect = 'ahorros') {
        this.ocultarVistas();
        document.getElementById("viewAbrirCuenta").classList.remove("d-none");
        document.getElementById("acTipoProducto").value = tipoSelect;
        document.getElementById("abrirCuentaAlert").innerHTML = "";
    }

    mostrarPanel() {
        this.ocultarVistas();
        document.getElementById("viewPanel").classList.remove("d-none");
        document.getElementById("panelUserDisplay").innerText = this.clienteActual.nombre;
        this.verSeccion('saldo');
    }

    cerrarSesion() {
        this.clienteActual = null;
        this.mostrarLanding();
    }

    login(event) {
        event.preventDefault();
        const user = document.getElementById("loginUser").value.trim();
        const pass = document.getElementById("loginPassword").value.trim();
        const alertDiv = document.getElementById("loginAlert");

        const cli = this.clientes.find(c => c.usuario === user);
        if (!cli) {
            alertDiv.innerHTML = `<div class="alert alert-danger">El usuario ingresado no existe.</div>`;
            return;
        }

        if (cli.bloqueado) {
            alertDiv.innerHTML = `<div class="alert alert-danger">Cuenta bloqueada por seguridad tras 3 intentos fallidos.</div>`;
            return;
        }

        if (cli.getPassword() === pass) {
            cli.intentosFallidos = 0;
            this.guardarStorage();
            this.clienteActual = cli;
            this.mostrarPanel();
        } else {
            cli.intentosFallidos++;
            const rest = 3 - cli.intentosFallidos;
            document.getElementById("intentosRestantes").innerText = rest > 0 ? rest : 0;

            if (cli.intentosFallidos >= 3) {
                cli.bloqueado = true;
                this.guardarStorage();
                alertDiv.innerHTML = `<div class="alert alert-danger">Ha excedido los 3 intentos. Su cuenta ha sido bloqueada.</div>`;
            } else {
                alertDiv.innerHTML = `<div class="alert alert-warning">Contraseña incorrecta. Te quedan ${rest} intento(s).</div>`;
            }
            this.guardarStorage();
        }
    }

    registrarCliente(event) {
        event.preventDefault();
        const id = document.getElementById("regId").value.trim();
        const nombre = document.getElementById("regNombre").value.trim();
        const celular = document.getElementById("regCelular").value.trim();
        const usuario = document.getElementById("regUsuario").value.trim();
        const pass = document.getElementById("regPassword").value.trim();
        const passConf = document.getElementById("regConfirmPassword").value.trim();
        const alertDiv = document.getElementById("registroAlert");

        if (pass !== passConf) {
            alertDiv.innerHTML = `<div class="alert alert-danger">Las contraseñas no coinciden.</div>`;
            return;
        }

        if (this.clientes.some(c => c.usuario === usuario)) {
            alertDiv.innerHTML = `<div class="alert alert-danger">El usuario ya está registrado en el sistema.</div>`;
            return;
        }

        const nuevoCliente = new Cliente(id, nombre, celular, usuario, pass);
        nuevoCliente.agregarCuenta(new CuentaAhorros(`AH-${Math.floor(1000 + Math.random()*9000)}`, 100000));
        
        this.clientes.push(nuevoCliente);
        this.guardarStorage();

        alertDiv.innerHTML = `<div class="alert alert-success">¡Registro de usuario exitoso! Redirigiendo a inicio de sesión...</div>`;
        setTimeout(() => this.mostrarLogin(), 1500);
    }

    solicitarCuentaBancaria(event) {
        event.preventDefault();
        const id = document.getElementById("acId").value.trim();
        const nombre = document.getElementById("acNombre").value.trim();
        const celular = document.getElementById("acCelular").value.trim();
        const usuario = document.getElementById("acUsuario").value.trim();
        const pass = document.getElementById("acPassword").value.trim();
        const tipo = document.getElementById("acTipoProducto").value;
        const monto = parseFloat(document.getElementById("acMontoInicial").value);
        const alertDiv = document.getElementById("abrirCuentaAlert");

        if (this.clientes.some(c => c.usuario === usuario)) {
            alertDiv.innerHTML = `<div class="alert alert-danger">El nombre de usuario ya existe.</div>`;
            return;
        }

        const cliente = new Cliente(id, nombre, celular, usuario, pass);
        const rand = Math.floor(1000 + Math.random() * 9000);
        let cuenta;

        if (tipo === 'ahorros') cuenta = new CuentaAhorros(`AH-${rand}`, monto);
        else if (tipo === 'corriente') cuenta = new CuentaCorriente(`CC-${rand}`, monto);
        else cuenta = new TarjetaCredito(`TC-${rand}`, monto);

        cliente.agregarCuenta(cuenta);
        this.clientes.push(cliente);
        this.guardarStorage();

        this.clienteActual = cliente;
        alertDiv.innerHTML = `<div class="alert alert-success">¡Apertura aprobada! Accediendo a tu panel...</div>`;
        setTimeout(() => this.mostrarPanel(), 1200);
    }

    verSeccion(seccion, btnEl = null) {
        if (btnEl) {
            document.querySelectorAll(".btn-panel-nav").forEach(b => b.classList.remove("active"));
            btnEl.classList.add("active");
        }

        const container = document.getElementById("panelContenido");
        const cuentas = this.clienteActual.cuentas;

        switch(seccion) {
            case 'saldo':
                let htmlSaldo = `<h4 class="fw-bold mb-4 text-cyan"><i class="fa-solid fa-wallet me-2"></i>Saldos Actuales</h4><div class="row g-3">`;
                cuentas.forEach(c => {
                    htmlSaldo += `
                        <div class="col-md-6">
                            <div class="p-3 rounded-4 border border-dark-custom bg-dark">
                                <span class="text-muted-custom small d-block">${c.tipo}</span>
                                <span class="fw-bold fs-5">${c.numeroCuenta}</span>
                                <h3 class="text-cyan fw-bold mt-2">$${c.getSaldo().toLocaleString()}</h3>
                            </div>
                        </div>`;
                });
                htmlSaldo += `</div>`;
                container.innerHTML = htmlSaldo;
                break;

            case 'consignar':
                let optsCons = cuentas.map(c => `<option value="${c.numeroCuenta}">${c.tipo} (${c.numeroCuenta})</option>`).join('');
                container.innerHTML = `
                    <h4 class="fw-bold mb-3 text-cyan"><i class="fa-solid fa-circle-plus me-2"></i>Consignar Fondos</h4>
                    <div id="opAlert"></div>
                    <form onsubmit="app.ejecutarConsignacion(event)">
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Seleccionar Cuenta</label>
                            <select class="form-select form-control-custom" id="cAcc">${optsCons}</select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Monto a Consignar ($)</label>
                            <input type="number" class="form-control form-control-custom" id="cMonto" min="1" required placeholder="0.00">
                        </div>
                        <button type="submit" class="btn btn-hero-primary w-100">Confirmar Consignación</button>
                    </form>`;
                break;

            case 'retirar':
                let optsRet = cuentas.map(c => `<option value="${c.numeroCuenta}">${c.tipo} (${c.numeroCuenta})</option>`).join('');
                container.innerHTML = `
                    <h4 class="fw-bold mb-3 text-cyan"><i class="fa-solid fa-circle-minus me-2"></i>Retirar Dinero</h4>
                    <div id="opAlert"></div>
                    <form onsubmit="app.ejecutarRetiro(event)">
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Seleccionar Cuenta</label>
                            <select class="form-select form-control-custom" id="rAcc">${optsRet}</select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Monto a Retirar ($)</label>
                            <input type="number" class="form-control form-control-custom" id="rMonto" min="1" required placeholder="0.00">
                        </div>
                        <button type="submit" class="btn btn-hero-primary w-100">Confirmar Retiro</button>
                    </form>`;
                break;

            case 'movimientos':
                let htmlMov = `<h4 class="fw-bold mb-4 text-cyan"><i class="fa-solid fa-clock-rotate-left me-2"></i>Historial de Movimientos</h4>`;
                cuentas.forEach(c => {
                    htmlMov += `<h6 class="fw-bold text-white mt-3">${c.tipo} (${c.numeroCuenta})</h6>`;
                    if (c.movimientos.length === 0) {
                        htmlMov += `<p class="text-muted-custom small">No registra movimientos.</p>`;
                    } else {
                        htmlMov += `<ul class="list-group mb-3">`;
                        c.movimientos.forEach(m => {
                            htmlMov += `
                                <li class="list-group-item bg-dark border-dark-custom text-white d-flex justify-content-between align-items-center">
                                    <span><small class="text-muted-custom me-2">${m.fecha}</small> <strong>${m.tipo}</strong></span>
                                    <span class="badge bg-cyan text-dark fw-bold">$${m.valor.toLocaleString()}</span>
                                </li>`;
                        });
                        htmlMov += `</ul>`;
                    }
                });
                container.innerHTML = htmlMov;
                break;

            case 'transferir':
                let optsTrans = cuentas.map(c => `<option value="${c.numeroCuenta}">${c.tipo} (${c.numeroCuenta})</option>`).join('');
                container.innerHTML = `
                    <h4 class="fw-bold mb-3 text-cyan"><i class="fa-solid fa-arrow-right-arrow-left me-2"></i>Transferir Dinero</h4>
                    <div id="opAlert"></div>
                    <form onsubmit="app.ejecutarTransferencia(event)">
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Cuenta Origen</label>
                            <select class="form-select form-control-custom" id="tOrigen">${optsTrans}</select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Cuenta Destino</label>
                            <input type="text" class="form-control form-control-custom" id="tDestino" required placeholder="Número de cuenta destino">
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Monto ($)</label>
                            <input type="number" class="form-control form-control-custom" id="tMonto" min="1" required placeholder="0.00">
                        </div>
                        <button type="submit" class="btn btn-hero-primary w-100">Realizar Transferencia</button>
                    </form>`;
                break;

            case 'perfil':
                container.innerHTML = `
                    <h4 class="fw-bold mb-3 text-cyan"><i class="fa-solid fa-user-gear me-2"></i>Perfil y Seguridad</h4>
                    <div id="opAlert"></div>
                    <form onsubmit="app.actualizarPerfil(event)" class="mb-4">
                        <h6 class="text-white mb-3">Datos Personales</h6>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Nombre Completo</label>
                            <input type="text" class="form-control form-control-custom" id="pNombre" value="${this.clienteActual.nombre}" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Celular</label>
                            <input type="tel" class="form-control form-control-custom" id="pCelular" value="${this.clienteActual.celular}" required>
                        </div>
                        <button type="submit" class="btn btn-hero-secondary btn-sm">Actualizar Perfil</button>
                    </form>
                    <hr class="border-dark-custom">
                    <form onsubmit="app.cambiarPassword(event)">
                        <h6 class="text-white mb-3">Cambiar Contraseña</h6>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Contraseña Actual</label>
                            <input type="password" class="form-control form-control-custom" id="pActual" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Nueva Contraseña</label>
                            <input type="password" class="form-control form-control-custom" id="pNUEVA" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-muted-custom small">Confirmar Nueva Contraseña</label>
                            <input type="password" class="form-control form-control-custom" id="pConfirmar" required>
                        </div>
                        <button type="submit" class="btn btn-hero-primary btn-sm">Guardar Nueva Contraseña</button>
                    </form>`;
                break;
        }
    }

    ejecutarConsignacion(event) {
        event.preventDefault();
        const numAcc = document.getElementById("cAcc").value;
        const monto = parseFloat(document.getElementById("cMonto").value);
        const cuenta = this.clienteActual.cuentas.find(c => c.numeroCuenta === numAcc);

        try {
            cuenta.consignar(monto);
            this.guardarStorage();
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-success">Consignación exitosa. Saldo actualizado: $${cuenta.getSaldo().toLocaleString()}</div>`;
        } catch (err) {
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    ejecutarRetiro(event) {
        event.preventDefault();
        const numAcc = document.getElementById("rAcc").value;
        const monto = parseFloat(document.getElementById("rMonto").value);
        const cuenta = this.clienteActual.cuentas.find(c => c.numeroCuenta === numAcc);

        try {
            cuenta.retirar(monto);
            this.guardarStorage();
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-success">Retiro procesado. Saldo actualizado: $${cuenta.getSaldo().toLocaleString()}</div>`;
        } catch (err) {
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    ejecutarTransferencia(event) {
        event.preventDefault();
        const origen = document.getElementById("tOrigen").value;
        const destino = document.getElementById("tDestino").value.trim();
        const monto = parseFloat(document.getElementById("tMonto").value);

        try {
            if (origen === destino) throw new Error("No se permiten transferencias al mismo producto.");

            const cOrigen = this.clienteActual.cuentas.find(c => c.numeroCuenta === origen);
            let cDestino = null;

            for (let cli of this.clientes) {
                let enc = cli.cuentas.find(c => c.numeroCuenta === destino);
                if (enc) { cDestino = enc; break; }
            }

            if (!cDestino) throw new Error("La cuenta destino no existe.");

            cOrigen.retirar(monto);
            cDestino.consignar(monto);

            cOrigen.registrarMovimiento(`Transferencia enviada a ${destino}`, monto);
            cDestino.registrarMovimiento(`Transferencia recibida de ${origen}`, monto);

            this.guardarStorage();
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-success">Transferencia efectuada exitosamente.</div>`;
        } catch (err) {
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    actualizarPerfil(event) {
        event.preventDefault();
        this.clienteActual.nombre = document.getElementById("pNombre").value.trim();
        this.clienteActual.celular = document.getElementById("pCelular").value.trim();
        this.guardarStorage();
        document.getElementById("opAlert").innerHTML = `<div class="alert alert-success">Perfil actualizado correctamente.</div>`;
    }

    cambiarPassword(event) {
        event.preventDefault();
        const actual = document.getElementById("pActual").value.trim();
        const nueva = document.getElementById("pNUEVA").value.trim();
        const conf = document.getElementById("pConfirmar").value.trim();

        if (this.clienteActual.getPassword() !== actual) {
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-danger">La contraseña actual es incorrecta.</div>`;
            return;
        }

        if (nueva !== conf) {
            document.getElementById("opAlert").innerHTML = `<div class="alert alert-danger">La nueva contraseña no coincide con la confirmación.</div>`;
            return;
        }

        this.clienteActual.setPassword(nueva);
        this.guardarStorage();
        document.getElementById("opAlert").innerHTML = `<div class="alert alert-success">Contraseña modificada exitosamente.</div>`;
    }
}

const app = new BancoApp();