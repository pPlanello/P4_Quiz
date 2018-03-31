
const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const Sequelize = require('sequelize');


/**
 * Función de ayuda para los diversos comandos.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.helpCmd = (socket, rl) => {
		log(socket, "Commandos:");
  		log(socket, " h|help - Muestra esta ayuda.");
  		log(socket, " show <id> - Muestra la pregunta y la respuesta el quiz indicado");
  		log(socket, " add - Añadir un nuevo quiz interactivamente.");
  		log(socket, " delete <id> - Borrar el quiz indicado.");
  		log(socket, " edit <id> - Editar el quiz indicado.");
  	    log(socket, " test <id> - Probar ek quiz indicado.");
  		log(socket, " p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  		log(socket, " credits - Créditos.");
  		log(socket, " q|quit - Salir del programa.");
  		rl.prompt();
 };

/**
 * Lista de todos los quizzes existentes en el modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.listCmd = (socket, rl) => {

 		models.quiz.findAll()
 		.each(quiz => {
 				log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
 		})
 		.catch(error => {
 			errorlog(socket, error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});



 }


/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parámetro.
 *  - Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
 *
 * @param id Parámetro con el índice a validar.
 */
 const validateId = (id) => {

 	return new Sequelize.Promise((resolve, reject) => {
 		if (typeof id === "undefined"){
 			reject(new Error(`Falta el parámetro <id>.`));
 		}  else {
 			id = parseInt(id);	//convertir el parámetro id en un número.

 			if (Number.isNaN(id)) {
 				reject(new Error(`El valor del parámetro <id> no es un número.`));
 			} else {
 				resolve(id);
 			}
 		}
 	});
 };


/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
 exports.showCmd = (socket, rl, id) => {
 		
 	validateId(socket, id)
 	.then(id => models.quiz.findById(id))
 	.then(quiz => {
 		if (!quiz) {
 			throw new Error(`No existe un quiz asociado al id=${id}.`);
 		}
 		log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
 	})
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

/**
 * Esta funcion devuelve una promesa que cuando se cumple, proporciona el texto introducido
 * Entonces la llamada a then que hay que hacer la promesa devuelta, será:
 *			.then(answer => {....})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio y final.
 * 
 * @param rl Objeto readline usado para implementar el CLI.
 * @param text Pregunta que hay que hacerle al usario.
*/
const makeQuestion = (rl, text) =>{
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'cyan'), answer =>{
			resolve(answer.trim());
		});
	});
};



 /**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada rl.prompt() se debe hacer en la callback de la segunda llamada
 * a rl.question.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.addCmd = (socket, rl) => {
 	makeQuestion(rl, 'Introduzca una pregunta: ')
 	.then(q => {
 		return makeQuestion(rl, 'Introduzca la respuesta: ')
 		.then(a =>{
 			return {question: q, answer: a};
 		});
 	})
 	.then(quiz => {
 		return models.quiz.create(quiz);
 	})
 	.then(quiz => {
 		log(socket, ` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${answer.question}. `);
 	})
 	.catch(Sequelize.ValidationError, error => {
 		errorlog(socket, 'El quiz es erroneo: ');
 		error.errors.forEach(({message}) => errorlog(socket, message));
 	})
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Prueba un quiz del modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a probar.
 */
 exports.testCmd = (socket, rl, id) => {

 		validateId(id)
 		.then(id => models.quiz.findById(id) )
 		.then(quiz => {
 			if (!quiz) {
 				throw new Error(`No existe un quiz asociado al id=${id}.`);
 			}
 			log(socket, `La pregunta es: ${quiz.question} `);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 				.then(a =>{
 					if(a.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim() === quiz.answer.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim()) {
 						log(socket, 'CORRECTA', 'green');
 					} else {
 						log(socket, 'INCORRECTA', 'red');
 					}
 				});
 		})
 		.catch(error =>{
 			errorlog(socket, error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});
 		
 };

 /**
 * Pregunta todos los quizzes existentes de forma aleatoria.
 * Se gana si se contesta todos satisfactoriamente.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.playCmd = (socket, rl) => {
 	let score = 0;
 	let numQuestion = 0;
 	let toBeResolved = [];

 	models.quiz.findAll()
 	.each(quiz => {
 		++numQuestion;
 		toBeResolved.lenght = numQuestion;
 		toBeResolved.push(quiz.id);
 	})
 	.then(() => {
 		if (numQuestion == 0) {
 			log(socket, 'No hay preguntas por jugar, lo siento.', 'red');
 		} else {
 			playOne();
 		}
 	})
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});

 	const playOne = () => {

 		let randomId = Math.floor(Math.random()*(numQuestion-score)); // numero al azar del array de IDs
 		
 		models.quiz.findById(toBeResolved[randomId])
 		.then(quiz => {
 			log(socket, `La pregunta es: ${quiz.question} `);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 				.then(a =>{
 					if(a.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim() === quiz.answer.toLowerCase().replace(/[^a-zA-Z 0-9.]+/g,' ').trim()) {
 						log(socket, 'CORRECTO', 'green');
 						++score;
 						if(score < numQuestion){
 							toBeResolved.splice(randomId, 1);	//Eliminar el la pregunta de la posicion randomId
	 						models.quiz.findById(randomId)
	 							.then(() => {
	 								rl.prompt();
	 							})
	 							.then(() => {
	 								playOne();
	 							});
 						} else {
 							log(socket, 'Enhorabuena!!!', 'green');
	 			 			log(socket, 'Has acertado todas las preguntas', 'green');
 						}
 					} else {
 						log(socket, `Su respuesta es: ${colorize('INCORRECTA', 'red')} `);
	 				 	log(socket, `Ha acertado: ${colorize(score, 'magenta')} de ${colorize(numQuestion, 'magenta')} preguntas`);
	 				 	log(socket, 'FIN DEL JUEGO', 'yellow');	
 					}
 				})
 				.catch(error => {
 					errorlog(socket, error.message);
 				});
 				//.then(() => {
 				//	rl.prompt();
 				//});
 		})	
 		.catch(error => {
 			errorlog(socket, error.message);
 		})
 		.then(() => {
 			rl.prompt();
 		});
 	};

}; 


 /**
 * Borra el quiz del modelo.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a borrar.
 */
 exports.deleteCmd = (socket, rl, id) => {
 	validateId(id)
 	.then(id => models.quiz.destroy({where: {id} }) )
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Edita el quiz del modelo.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada rl.prompt() se debe hacer en la callback de la segunda llamada
 * a rl.question.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 * @param id clave del quiz a editar.
 */
 exports.editCmd = (socket, rl, id) => {
 	validateId(id)
 	.then(id => models.quiz.findById(id) )
 	.then(quiz => {
 		if(!quiz) {
 			throw new Error(`No existe un quiz asociado al id=${id}.`);
 		}

 		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
 		return makeQuestion(rl, 'Introduzca la pregunta: ')
 		.then(q => {
 			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
 			return makeQuestion(rl, 'Introduzca la respuesta: ')
 			.then(a => {
 				quiz.question = q;
 				quiz.answer = a;
 				return quiz;
 			});
 		});
 	})
 	.then(quiz => {
 		return quiz.save();
 	})
 	.then(quiz => {
 		log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
 	})
 	.catch(Sequelize.ValidationError, error => {
 		errorlog(socket, 'El quiz es erroneo: ');
 		error.errors.forEach(({message}) => errorlog(socket, message) );
 	})
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
 	});
 };

 /**
 * Creditos y nombres de los autores del proyecto.
 *
 * @param rl  Objeto readline usado para implementar el CLI.
 */
 exports.creditsCmd = (socket, rl) => {
 		log(socket, 'Autores de la práctica:');
  		log(socket, '	1) Pablo Planelló San Segundo', 'green');
  		log(socket, '	2) Daniel de la Torre Lázaro', 'green');
  		rl.prompt();
 };

 /**
 * Terminar el programa.
 *
 * @param rl  Objeto readline usado para implemtentar el CLI
 */
 exports.quitCmd = (socket, rl) => {
  		rl.close();
  		socket.end();
 };
