let environment_id='';
let collection_id= '';
const DiscoveryV1 = require('ibm-watson/discovery/v1');

const discovery = new DiscoveryV1({
  version: '2019-04-02',
  iam_apikey: '',
  url: 'https://gateway.watsonplatform.net/discovery/api'
});

async function armandoFiltro_v2(intenciones,entidades){
  let speakers=[];
  let tecnologias=[];
  let filtro="";
  if (intenciones.length==1 && intenciones[0].intent == "AgendaEntera" && entidades.length==0){
    return filtro;
  }
  for (var i=0;i<entidades.length;i++) {
    if (entidades[i].entity == "nombre"){
      speakers.push(entidades[i].value);
    }
    else if (entidades[i].entity == "tecnologia"){
      tecnologias.push(entidades[i].value);
    }
    else if (entidades[i].entity == "titulo"){
      filtro += "titulo::\""+entidades[i].value+"\"|";
    }
    
  }
  if (filtro != ""){
    return filtro.substring(0,(filtro.length -1));
  }
  if (tecnologias.length == 0 && speakers.length != 0){
    for (var i=0;i<speakers.length;i++){
      filtro += "speakers.persona::\""+speakers[i]+"\"|";
    }
    return filtro.substring(0,(filtro.length -1));
  }
  for (var i=0;i<speakers.length;i++){
    if (i==0) {
      filtro += '('
    }
    if (i != speakers.length - 1 ){
      filtro += "speakers.persona::\""+speakers[i]+"\",";
    } else {
      filtro += "speakers.persona::\""+speakers[i]+"\"),";
    }
  }
  for (var i=0;i<tecnologias.length;i++){
    if (i==0) {
      filtro += '('
    }
    if (i != tecnologias.length - 1){
      filtro += "tecnologías.nombre::\""+tecnologias[i]+"\"|";
    } else {
      filtro += "tecnologías.nombre::\""+tecnologias[i]+"\"),";
    }
  }
  return filtro.substring(0,(filtro.length -1));
}


async function buscando (filtro){
  let titulos = [];
  let descripciones = [];
  let horas = [];
  let speakers = [];
  let preRequisitos = [];
  const queryParams = { 
    environment_id: environment_id,
    collection_id: collection_id,
    query: filtro,
    count: 30
  };
  
  let queryResponse = await discovery.query(queryParams)
  let res= "Estas son las charlas:<br>";
  for(var i = 0; i < queryResponse.matching_results;i++){
    res += (i+1)+") "+queryResponse.results[i].titulo + "<br>";
    titulos[i] = queryResponse.results[i].titulo;
    descripciones[i] = queryResponse.results[i].descripcion;
    preRequisitos[i] = queryResponse.results[i].Prerequisitos;
    horas[i] = queryResponse.results[i].hora;
    speakers[i] = queryResponse.results[i].speakers;
  }
  res += (queryResponse.matching_results+1)+") Ver el calendario completo.<br>Seleccione el número de la opción deseada."
  return [res, titulos, descripciones, horas, speakers,preRequisitos];
}

async function buscando_hora (filtro, hora){
  let titulos = [];
  let descripciones = [];
  let horas = [];
  let speakers = [];
  let preRequisitos = [];
  const queryParams = { 
    environment_id: environment_id,
    collection_id: collection_id,
    query: filtro,
    count: 30
  };
  
  let queryResponse = await discovery.query(queryParams)
  let res= "Estas son las charlas:<br>";
  let j=0;
  for(var i = 0; i < queryResponse.matching_results;i++){
    
    if (hora <= queryResponse.results[i].hora) {
      res += (j+1)+") "+queryResponse.results[i].titulo + "<br>";
      titulos[j] = queryResponse.results[i].titulo;
      descripciones[j] = queryResponse.results[i].descripcion;
      horas[j] = queryResponse.results[i].hora;
      speakers[j] = queryResponse.results[i].speakers;
      preRequisitos[j]=queryResponse.results[i].Prerequisitos;
      j+=1;
    }
  }
  res += (j+1)+") Ver el calendario completo.<br>Seleccione el número de la opción deseada."
  return [res, titulos, descripciones, horas, speakers,preRequisitos];
}

module.exports={
  buscar_sin_hora: async function (intenciones,entidades){
     return buscando((await armandoFiltro_v2(intenciones,entidades)));
  },
  buscar_con_hora: async function (intenciones,entidades, hora){
    return buscando_hora((await armandoFiltro_v2(intenciones,entidades)), hora);
 },
  buscar_con_pipe: async function (intenciones,entidades){
    return buscando((await armandoFiltro_v2(intenciones,entidades)));
  }
}
