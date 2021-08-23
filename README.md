# @nomikos/module-koa-common

Configura logging, y varios middleware para koa

- Configura pino logging para apis koa
  - loggerMiddleware. Internamente usa:
    - logRequest: post log de immediato
    - logResponse: post todos los logs acumulados en memoria
  - errorHandlerMiddleware. Internamente usa:
    - errorHandler

- Maneja y reporta unhandled promise rejection.
  - unhandledRejectionHandler. Internamente usa:
    - rejectionHandler

- Exporta funciones de logging
  - trace, debug, info, warn, error, fatal

- Reporta logs en apps que no siguen un flujo down-up sobre un request http.
    - logBegin
    - logEnd

## Creación de tracers

tracer-session-id:
  - Se crean en pwa o apis. Es unico por request
  - Se mantiene a lo largo de todas las apis
  - Se toma desde headers, si no existe se crea
  - Se adhiere a cada log en el sistema actual

tracer-request-id:
  - Es un identificador de tipo entero autoincrementado
  - Se inicializa a 1 en cada sesión en pwa
  - Si no existe se usa un random entre 1 millon y 10 millones
  - Es importante para correlacionar stages begin y end en logs

tracer-systems
  - Se le adhiere al final del string nombre del sistema actual

tracer-user-id:
  - Es el id de usuario
  - Se crea en kong

Todos estos tracers se pasan por headers HTTP o por mensaje (key headers) en colas.

## Caso especial

En push notification desde killbill: No habrá empezado en pwa. Setear tracer-user-id a initialOwner

## unhandledRejectionHandler

> Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code

Se debe ejecutar al cuando se levanta la aplicación. Queda escuchando por "Unhandled promise rejections" y envía log de immediato, ya que loggerMiddleware no se ejecutará normalmente al ser este un error fatal. El log setea stage a "fatal". De todas formas puede recolectar y enviar tambien to otro log ya grabado para envio en stage: end.
