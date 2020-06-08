const { io } = require('../server');
const { Usuarios } = require('../models/usuarios');
const usuarios = new Usuarios();
const { crearMensaje } = require('../utils/utils');


io.on('connection', (client) => {

    client.on('entrarChat', (data, callback) => {

        console.log(data);

        if (!data.nombre) {
            return callback({
                err: true,
                message: 'El nombre es necesario'
            });
        }
        client.join(data.sala);
        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${data.nombre} se unió`));

        callback(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        console.log(personaBorrada);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);
    });

    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });
});