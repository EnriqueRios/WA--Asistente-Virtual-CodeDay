const service = require('../service');
const buscador = require('../services/Discovery');
let consulta;
module.exports = function(app) {
  /**
   * Endpoint to be call from the client side
   */
  app.post('/api/message', function(req, res) {
    if (!service.getWorkspaceId()) {
      return res.json({
        output: {
          text: 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the Application Checklist in the Watson Console documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from the training file (<code>training/car_workspace.json</code>) in order to get a working application.'
        }
      });
    }
    const payload = {
      workspace_id: service.getWorkspaceId(),
      context: req.body.context || {},
      input: req.body.input || {}
    };
    if (req.body) {
      if (req.body.input) {
          payload.input = req.body.input;
      }
      if (req.body.context) {
          // The client must maintain context/state
          payload.context = req.body.context;
      }
      if (req.body.hora_actual) {
          payload.context.hora_actual = req.body.hora_actual;
      }
    }

    // Send the input to the assistant service
    service.getAssistantV1().message(payload, async function(err, data, req) {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
      await updateMessage(res, payload, data, req);
    });
  });
}
  async function updateMessage(res, input, response, req) { // Aca es donde le paso la respuesta de discovery
    if (!response.output) {
      response.output = {};
    }  else if (response.output.action && (response.output.action[0].name == 'recomendacion')) {
      consulta = await buscador.buscar_con_pipe(response.intents,response.entities);
      response.output.generic[1].text=consulta[0];
      return res.json(response);
    } 
    else if (response.output.action && (response.output.action[0].name == 'charlaAntigua')) {
      consulta = await buscador.buscar_con_hora(response.intents,response.entities, response.context.hora);
      response.output.generic[1].text=consulta[0];
      return res.json(response);
    } 
    else if (response.output.action && (response.output.action[0].name == 'callDiscovery_hora')) {
      let hora_pedida;
      response.entities.forEach(entity => {
        if (entity.entity == 'sys-time') {
          hora_pedida = entity.value;
        }
      });
      // Control de fecha
      // let fecha=req.body.context.fecha;
      // if (fecha < '2019-08-14'){
      //   consulta = ['La fecha del evento es el *14 de Agosto del 2019*<br>'+1+") Ver el calendario completo.<br>*Seleccione el número de la opción deseada.*",[],[],[],[]]
      //   response.output.generic[1].text=consulta[0];
      //   return res.json(response);
      // }
      hora_pedida= (hora_pedida.split(':')[0])+':'+hora_pedida.split(':')[1]
      if (!(hora_pedida >= '16:00' && hora_pedida <= '22:00')){ 
          consulta = ['La hora no pertenece a los horarios del evento. Solo de 16:00 a 22:00<br>'+1+") Ver el calendario completo.<br>Seleccione el número de la opción deseada.",[],[],[],[]]
          response.output.generic[1].text=consulta[0];
          return res.json(response);
      }// control de error
      consulta = await buscador.buscar_con_hora(response.intents,response.entities, hora_pedida);
      response.output.generic[1].text=consulta[0];
      return res.json(response);
    } 
    else if (response.output.action && (response.output.action[0].name == 'callDiscovery')) {
      consulta = await buscador.buscar_sin_hora(response.intents,response.entities)
      response.output.generic[1].text=consulta[0];
      return res.json(response);
    } 
    else if (response.output.action && (response.output.action[0].name == 'showDetails')) {
      let opcion = response.input.text;
      if (opcion < 1 || opcion > (consulta[1].length + 1) || isNaN(opcion)){
        response.output.generic[0].text="No selecciono una opcion adecuada. Comencemos de nuevo";
        return res.json(response)
      }else if (opcion == consulta[1].length + 1){
        response.output.generic[0].text="Esta es la agenda completa del IBM Code Day <br> https://www.ibm.com/events/uy/es/ibm-code-mvd/montevideo/";
        return res.json(response)
      }
      let titulo = consulta[1][opcion-1];
      let descripcion = consulta[2][opcion-1]; 
      let hora = consulta[3][opcion-1];
      let speakers = consulta[4][opcion-1];
      let preRequisitos = consulta[5][opcion-1];
      let detalle = 'Título: '+titulo+'<br>Descripción: '+descripcion+'<br>Hora: '+hora+'<br>Speakers: ';
      for (var i=0; i<speakers.length; i++){
        if (i < speakers.length-1) {
          detalle += speakers[i].persona+' - ';
        } else {
          detalle += speakers[i].persona;
        }
      }
      detalle += '<br>Pre-Requisitos: ' + preRequisitos;
      response.output.generic[0].text=detalle;
      return res.json(response)
    } 
    else if (response.output.action && (response.output.action[0].name === 'charlaAntigua')) {
      return res.json(response);
    } 
    else if (response.output && response.output.text) {
      return res.json(response);
    }
  }
